import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any
  }
}

interface ShippingInfo {
  full_name: string
  email: string
  mobile_number: string
  alternate_mobile: string
  country: string
  state: string
  city: string
  pin_code: string
  full_address: string
}

interface ProductImage {
  image_url: string
  alt_text?: string | null
  order_index?: number
}

interface Product {
  name: string
  price: number
  product_images: ProductImage[]
  description?: string
}

export default function CheckoutPage() {
  const { items, getCartTotal, clearCart, discountCode, discountPercentage, getFinalTotal } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    full_name: '',
    email: '',
    mobile_number: '',
    alternate_mobile: '',
    country: '',
    state: '',
    city: '',
    pin_code: '',
    full_address: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCODConfirmModal, setShowCODConfirmModal] = useState(false)
  const [paymentModalData, setPaymentModalData] = useState<{
    type: 'success' | 'failure' | 'cancelled'
    message: string
    orderNumber?: string
  } | null>(null)

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart')
      return
    }

    loadUserInfo()
  }, [user, items])

  const loadUserInfo = async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        
        if (error) {
          console.error('Error loading profile:', error)
          setShippingInfo(prev => ({
            ...prev,
            email: user.email || ''
          }))
          return
        }

        if (data) {
          setShippingInfo({
            full_name: data.full_name || '',
            email: data.email || user.email || '',
            mobile_number: data.mobile_number || '',
            alternate_mobile: data.alternate_mobile || '',
            country: data.country || '',
            state: data.state || '',
            city: data.city || '',
            pin_code: data.pin_code || '',
            full_address: data.full_address || ''
          })
        } else {
          setShippingInfo(prev => ({
            ...prev,
            email: user.email || ''
          }))
        }
      } catch (error) {
        console.error('Error loading user info:', error)
        setShippingInfo(prev => ({
          ...prev,
          email: user.email || ''
        }))
      }
    }
  }

  // Helper to create Razorpay order via serverless API
  const createRazorpayOrder = async (finalPrice: number, tempOrderNumber: string) => {
    const response = await fetch('https://skatious-razorpay-server-wkvb.vercel.app/api/create-razorpay-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(finalPrice * 100), // in paise
        currency: 'INR',
        receipt: tempOrderNumber,
      }),
    })
    if (!response.ok) throw new Error('Failed to create Razorpay order')
    return response.json()
  }

  const initializeRazorpayPayment = async (orderInfo: any, finalPrice: number) => {
    try {
      // Generate a temporary order number for display
      const tempOrderNumber = `TEMP_${Date.now()}_${Math.random().toString(36).substring(2)}`

      // 1. Create Razorpay order via API route
      const razorpayOrder = await createRazorpayOrder(finalPrice, tempOrderNumber)

      const options = {
        key: 'rzp_live_07OqqZuaEXjVNA',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'SKATIOUS',
        description: `Order #${tempOrderNumber}`,
        order_id: razorpayOrder.id, // <-- This is the key change!
        handler: async (response: any) => {
          // Payment successful - now create the order
          await handlePaymentSuccess(orderInfo, response)
        },
        prefill: {
          name: shippingInfo.full_name,
          email: shippingInfo.email,
          contact: shippingInfo.mobile_number
        },
        theme: {
          color: '#059669' // emerald-600
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false)
            setLoading(false)
            // Show custom modal for cancelled payment
            setPaymentModalData({
              type: 'cancelled',
              message: 'Payment was cancelled. No order was created.'
            })
            setShowPaymentModal(true)
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Error initializing Razorpay:', error)
      setPaymentProcessing(false)
      setLoading(false)
      setPaymentModalData({
        type: 'failure',
        message: 'Error initializing payment. Please try again.'
      })
      setShowPaymentModal(true)
    }
  }

  const handlePaymentSuccess = async (orderInfo: any, paymentResponse: any) => {
    try {
      // Create order in database after successful payment
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...orderInfo.orderData,
          status: 'processing',
          payment_id: paymentResponse.razorpay_payment_id,
          payment_method: 'razorpay'
        })
        .select()
        .single()

      if (orderError) {
        console.error('Error creating order:', orderError)
        alert('Payment successful but there was an error creating your order. Please contact support.')
        return
      }

      // Create order items
      const orderItems = orderInfo.orderItemsData.map((item: any) => ({
        order_id: order.id,
        ...item
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Error creating order items:', itemsError)
        alert('Payment successful but there was an error creating your order items. Please contact support.')
        return
      }

      // Update/create user profile with shipping info
      await supabase
        .from('profiles')
        .upsert({
          id: user!.id,
          full_name: shippingInfo.full_name,
          email: shippingInfo.email,
          mobile_number: shippingInfo.mobile_number,
          alternate_mobile: shippingInfo.alternate_mobile,
          country: shippingInfo.country,
          state: shippingInfo.state,
          city: shippingInfo.city,
          pin_code: shippingInfo.pin_code,
          full_address: shippingInfo.full_address
        })

      // Clear cart
      await clearCart()
      
      // Show success modal
      setPaymentModalData({
        type: 'success',
        message: 'Payment successful!',
        orderNumber: order.order_number
      })
      setShowPaymentModal(true)
    } catch (error) {
      console.error('Error handling payment success:', error)
      setPaymentModalData({
        type: 'failure',
        message: 'Payment successful but there was an error creating your order. Please contact support.'
      })
      setShowPaymentModal(true)
    } finally {
      setPaymentProcessing(false)
    }
  }

  const handleCODOrder = async () => {
    setLoading(true)

    try {
      // Check session before proceeding
      const { data: sessionData } = await supabase.auth.getSession();
      if (!user || !sessionData.session) {
        alert('Your session has expired. Please log in again to place an order.');
        navigate('/auth');
        setLoading(false);
        return;
      }

      if (!user) {
        alert('Please sign in to place an order')
        navigate('/auth')
        return
      }

      const totalPrice = getCartTotal()
      const discountAmount = (totalPrice * discountPercentage) / 100
      const finalPrice = getFinalTotal()

      // Create order data for COD
      const orderData = {
        user_id: user.id,
        total_amount: finalPrice + 80, // Including shipping charge
        discount_amount: discountAmount,
        discount_code: discountCode,
        discount_percentage: discountPercentage,
        customer_email: shippingInfo.email,
        customer_mobile: shippingInfo.mobile_number,
        customer_alternate_mobile: shippingInfo.alternate_mobile,
        shipping_country: shippingInfo.country,
        shipping_state: shippingInfo.state,
        shipping_city: shippingInfo.city,
        shipping_pin_code: shippingInfo.pin_code,
        shipping_full_address: shippingInfo.full_address,
        status: 'pending',
        payment_method: 'cod'
      }

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) {
        console.error('Error creating COD order:', orderError)
        setPaymentModalData({
          type: 'failure',
          message: 'Error creating your order. Please try again.'
        })
        setShowPaymentModal(true)
        return
      }

      // Create order items
      const orderItemsData = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product?.name || 'Unknown Product',
        product_price: item.product?.price || 0,
        product_description: (item.product as Product)?.description || '',
        product_image_url: item.product?.product_images?.[0]?.image_url || '',
        size: item.size,
        quantity: item.quantity,
        item_total: (item.product?.price || 0) * item.quantity,
        custom_name: item.custom_name || '',
        custom_number: item.custom_number || ''
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData)

      if (itemsError) {
        console.error('Error creating order items:', itemsError)
        setPaymentModalData({
          type: 'failure',
          message: 'Error creating your order items. Please contact support.'
        })
        setShowPaymentModal(true)
        return
      }

      // Update/create user profile with shipping info
      await supabase
        .from('profiles')
        .upsert({
          id: user!.id,
          full_name: shippingInfo.full_name,
          email: shippingInfo.email,
          mobile_number: shippingInfo.mobile_number,
          alternate_mobile: shippingInfo.alternate_mobile,
          country: shippingInfo.country,
          state: shippingInfo.state,
          city: shippingInfo.city,
          pin_code: shippingInfo.pin_code,
          full_address: shippingInfo.full_address
        })

      // Clear cart
      await clearCart()
      
      // Show success modal
      setPaymentModalData({
        type: 'success',
        message: 'Order placed successfully! You will pay cash on delivery.',
        orderNumber: order.order_number
      })
      setShowPaymentModal(true)

    } catch (error) {
      console.error('Error placing COD order:', error)
      setPaymentModalData({
        type: 'failure',
        message: 'Error placing your order. Please try again.'
      })
      setShowPaymentModal(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setPaymentProcessing(true)

    try {
      // Check session before proceeding
      const { data: sessionData } = await supabase.auth.getSession();
      if (!user || !sessionData.session) {
        alert('Your session has expired. Please log in again to place an order.');
        navigate('/auth');
        setLoading(false);
        setPaymentProcessing(false);
        return;
      }

      if (!user) {
        alert('Please sign in to place an order')
        navigate('/auth')
        return
      }

      const totalPrice = getCartTotal()
      const discountAmount = (totalPrice * discountPercentage) / 100
      const finalPrice = getFinalTotal()

      // Prepare order data (but don't save to database yet)
      const orderData = {
        user_id: user.id,
        total_amount: finalPrice + 80, // Including shipping charge
        discount_amount: discountAmount,
        discount_code: discountCode,
        discount_percentage: discountPercentage,
        customer_email: shippingInfo.email,
        customer_mobile: shippingInfo.mobile_number,
        customer_alternate_mobile: shippingInfo.alternate_mobile,
        shipping_country: shippingInfo.country,
        shipping_state: shippingInfo.state,
        shipping_city: shippingInfo.city,
        shipping_pin_code: shippingInfo.pin_code,
        shipping_full_address: shippingInfo.full_address,
        status: 'pending'
      }

      // Prepare order items data
      const orderItemsData = items.map(item => ({
        product_id: item.product_id,
        product_name: item.product?.name || 'Unknown Product',
        product_price: item.product?.price || 0,
        product_description: (item.product as Product)?.description || '',
        product_image_url: item.product?.product_images?.[0]?.image_url || '',
        size: item.size,
        quantity: item.quantity,
        item_total: (item.product?.price || 0) * item.quantity,
        custom_name: item.custom_name || '',
        custom_number: item.custom_number || ''
      }))

      // Initialize Razorpay payment with order data (including shipping charge)
      await initializeRazorpayPayment({ orderData, orderItemsData }, finalPrice + 80)

    } catch (error) {
      console.error('Error preparing payment:', error)
      setLoading(false)
      setPaymentProcessing(false)
      setPaymentModalData({
        type: 'failure',
        message: 'Error preparing payment. Please try again.'
      })
      setShowPaymentModal(true)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setShippingInfo(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const totalPrice = getCartTotal()
  const finalPrice = getFinalTotal()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-navy-900 mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
                {user ? 'Shipping Information' : 'Guest Checkout'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-heading mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={shippingInfo.full_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-heading mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={shippingInfo.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-heading mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      name="mobile_number"
                      required
                      value={shippingInfo.mobile_number}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-heading mb-1">
                      Alternate Mobile
                    </label>
                    <input
                      type="tel"
                      name="alternate_mobile"
                      value={shippingInfo.alternate_mobile}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-heading mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    required
                    value={shippingInfo.country}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-heading mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={shippingInfo.state}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-heading mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={shippingInfo.city}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-heading mb-1">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    name="pin_code"
                    required
                    value={shippingInfo.pin_code}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-heading mb-1">
                    Full Address
                  </label>
                  <textarea
                    name="full_address"
                    required
                    value={shippingInfo.full_address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                    rows={3}
                  />
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-heading text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="font-body text-gray-600">
                      {item.product?.name || 'Product Not Found'} ({item.size}) × {item.quantity}
                    </span>
                    <span className="font-semibold">
                      ₹{((item.product?.price || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">

              <div className="flex justify-between">
                  <span className="font-body text-gray-600">Shipping Charge</span>
                  <span>₹80.00</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-body text-gray-600">Subtotal</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                
                {discountPercentage > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="font-body">
                      Discount ({discountPercentage}%)
                      {discountCode && <span className="text-xs ml-1">({discountCode})</span>}
                    </span>
                    <span>-₹{(totalPrice * discountPercentage / 100).toFixed(2)}</span>
                  </div>
                )}
                
                
                <div className="flex justify-between text-lg font-semibold text-gray-900 border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span>₹{(finalPrice + 80).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || paymentProcessing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-3 px-4 rounded-lg font-heading font-semibold text-lg transition-colors duration-200"
            >
              {loading ? 'Processing...' : paymentProcessing ? 'Opening Payment Gateway...' : `Pay ₹${(finalPrice + 80).toFixed(2)}`}
            </button>

            <button
              onClick={() => setShowCODConfirmModal(true)}
              disabled={loading}
              className="w-full bg-white hover:bg-green-50 disabled:bg-gray-100 disabled:text-gray-400 text-green-600 border-2 border-green-600 hover:border-green-700 py-3 px-4 rounded-lg font-heading font-semibold text-lg transition-colors duration-200 mt-3"
            >
              {loading ? 'Processing...' : 'Pay using COD (Cash on Delivery)'}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Result Modal */}
      {showPaymentModal && paymentModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowPaymentModal(false)
                setPaymentModalData(null)
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto mb-4">
                {paymentModalData.type === 'success' ? (
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Title */}
              <h3 className={`font-heading text-xl font-semibold mb-2 ${
                paymentModalData.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {paymentModalData.type === 'success' ? 'Payment Successful!' : 
                 paymentModalData.type === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed'}
              </h3>

              {/* Message */}
              <p className="font-body text-gray-600 mb-4">
                {paymentModalData.message}
              </p>

              {/* Order Number for Success */}
              {paymentModalData.type === 'success' && paymentModalData.orderNumber && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="font-body text-sm text-gray-600">Order Number:</p>
                  <p className="font-heading font-semibold text-gray-900">{paymentModalData.orderNumber}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex space-x-3">
                {paymentModalData.type === 'success' ? (
                  <button
                    onClick={() => {
                      setShowPaymentModal(false)
                      setPaymentModalData(null)
                      navigate('/products')
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-heading font-medium transition-colors"
                  >
                    Continue Shopping
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowPaymentModal(false)
                      setPaymentModalData(null)
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-heading font-medium transition-colors"
                  >
                    Continue Shopping
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COD Confirmation Modal */}
      {showCODConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowCODConfirmModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto mb-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h3 className="font-heading text-xl font-semibold mb-4 text-gray-900">
                Cash on Delivery Information
              </h3>

              {/* Message */}
              <div className="font-body text-gray-600 mb-6 text-left">
                <p className="mb-3">
                  <strong>COD orders</strong> take <strong>15-17 days</strong> for delivery.
                </p>
                <p className="mb-3">
                  <strong>Prepaid orders</strong> arrive in <strong>6-7 days</strong>.
                </p>
                <p className="text-sm text-gray-500">
                  Choose prepaid payment for faster delivery!
                </p>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCODConfirmModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-heading font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowCODConfirmModal(false)
                    handleCODOrder()
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-heading font-medium transition-colors"
                >
                  Place Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}