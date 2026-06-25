import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, Tag, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

export default function CartPage() {
  const {
    items,
    loading,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    discountCode,
    discountPercentage,
    applyDiscount,
    removeDiscount,
    getFinalTotal
  } = useCart()

  const [promoCode, setPromoCode] = useState('')
  const [promoError, setPromoError] = useState('')
  const [applyingPromo, setApplyingPromo] = useState(false)

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) return

    setApplyingPromo(true)
    setPromoError('')

    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('active', true)
        .single()

      if (error || !data) {
        setPromoError('Invalid or expired promo code')
      } else {
        applyDiscount(data.code, data.discount_percentage)
        setPromoCode('')
      }
    } catch (error) {
      setPromoError('Invalid or expired promo code')
    }

    setApplyingPromo(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="font-body text-gray-600 mb-6">Add some awesome clothing to get started!</p>
          <Link
            to="/products"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-heading font-semibold transition-colors duration-200"
          >
            Shop Products
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = getCartTotal()
  const discountAmount = (subtotal * discountPercentage) / 100
  const finalTotal = getFinalTotal()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-navy-900">Shopping Cart</h1>
          <p className="font-body text-gray-600 mt-2">{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center space-x-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product?.product_images?.[0] ? (
                      <img
                        src={item.product.product_images[0].image_url}
                        alt={item.product.product_images[0].alt_text || item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <h3 className="font-heading text-lg font-semibold text-gray-900">
                      {item.product?.name}
                    </h3>
                    <p className="font-body text-gray-600">Size: {item.size}</p>
                    {item.custom_name && (
                      <p className="font-body text-gray-600 text-sm">Name: <span className="font-medium uppercase">{item.custom_name}</span></p>
                    )}
                    {item.custom_number && (
                      <p className="font-body text-gray-600 text-sm">Number: <span className="font-medium">{item.custom_number}</span></p>
                    )}
                    <p className="font-heading text-lg font-semibold text-emerald-600">
                      ₹{item.product?.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                    >
                      <Minus className="h-4 w-4 text-gray-600" />
                    </button>
                    <span className="font-heading font-semibold text-gray-900 w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24 space-y-6">
              <h2 className="font-heading text-xl font-semibold text-gray-900">Order Summary</h2>

              {/* Promo Code Section */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 font-heading">
                  Promo Code
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body text-sm"
                  />
                  <button
                    onClick={handleApplyPromoCode}
                    disabled={applyingPromo || !promoCode.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-4 py-2 rounded-lg font-heading font-medium transition-colors duration-200 text-sm"
                  >
                    {applyingPromo ? 'Applying...' : 'Apply Code'}
                  </button>
                </div>
                {promoError && (
                  <p className="text-red-600 text-sm font-body">{promoError}</p>
                )}
              </div>

              {/* Applied Discount */}
              {discountCode && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-emerald-600" />
                      <div className="flex flex-col">
                        <span className="font-heading text-sm font-medium text-emerald-800">
                          {discountCode}
                        </span>
                        <span className="font-body text-xs text-emerald-600">
                          {discountPercentage}% off applied
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={removeDiscount}
                      className="text-emerald-600 hover:text-emerald-800 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <div className="flex justify-between font-body text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
                </div>
                
                {discountPercentage > 0 && (
                  <div className="flex justify-between font-body text-sm">
                    <span className="text-emerald-600">Discount ({discountPercentage}%)</span>
                    <span className="text-emerald-600">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between font-heading text-lg font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-navy-900">₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Link
                  to="/checkout"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-lg font-heading font-semibold text-center block transition-colors duration-200"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  to="/products"
                  className="w-full text-emerald-600 hover:text-emerald-700 py-2 px-6 text-center block font-heading font-medium transition-colors duration-200 text-sm"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}