import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Package, Tag, Settings, Users, ShoppingBag, Eye, X, Upload } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import ImageUpload from '../components/ImageUpload'

interface Category {
  id: string
  name: string
  description: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  category_id: string
  sizes: string[]
  in_stock: boolean
  categories?: { name: string }
}

interface DiscountCode {
  id: string
  code: string
  discount_percentage: number
  active: boolean
}

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  discount_amount: number
  discount_code: string | null
  customer_email: string
  customer_mobile: string
  customer_alternate_mobile: string | null
  shipping_country: string
  shipping_state: string
  shipping_city: string
  shipping_pin_code: string
  shipping_full_address?: string
  created_at: string
  user_id: string
  customer_name?: string
  payment_method: string | null
  order_items: {
    product_name: string
    product_image_url: string | null
    size: string
    quantity: number
    item_total: number
    custom_name: string | null
    custom_number: string | null
  }[]
}

const SPECIAL_DISCOUNT_SETTINGS_ID = '00000000-0000-0000-0000-000000000001'

const statusOptions = [
  { value: 'pending', label: 'Yet to Dispatch', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-800' },
  { value: 'shipped', label: 'On the Way', color: 'bg-purple-100 text-purple-800' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
]

export default function AdminPage() {
  const { user, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('orders')
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [specialDiscountActive, setSpecialDiscountActive] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  
  // Form states
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [showDiscountForm, setShowDiscountForm] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  
  // Search and filter states
  const [orderSearch, setOrderSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [productSearch, setProductSearch] = useState('')
  const [productStockFilter, setProductStockFilter] = useState('all')
  const [productCategoryFilter, setProductCategoryFilter] = useState('all')

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = orderSearch === '' || 
      order.customer_name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.order_number?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.customer_mobile?.includes(orderSearch)
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Filter products based on search, stock status, and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = productSearch === '' || 
      product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.description?.toLowerCase().includes(productSearch.toLowerCase())
    
    const matchesStock = productStockFilter === 'all' || 
      (productStockFilter === 'in_stock' && product.in_stock) ||
      (productStockFilter === 'out_of_stock' && !product.in_stock)
    
    const matchesCategory = productCategoryFilter === 'all' || 
      product.category_id === productCategoryFilter
    
    return matchesSearch && matchesStock && matchesCategory
  })

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    sizes: [''],
    image_urls: [] as string[],
    in_stock: true
  })
  const [pendingImages, setPendingImages] = useState<File[]>([])
  const [uploadPendingImagesFn, setUploadPendingImagesFn] = useState<(() => Promise<string[]>) | null>(null)
  const [discountForm, setDiscountForm] = useState({
    code: '',
    discount_percentage: 0,
    active: true
  })

  const [showForceDeleteModal, setShowForceDeleteModal] = useState(false)
  const [productToForceDelete, setProductToForceDelete] = useState<string | null>(null)

  useEffect(() => {
    if (user && isAdmin) {
      loadData()
    }
  }, [user, isAdmin])

  useEffect(() => {
    if (activeTab === 'customers') {
      loadCustomers()
    }
    // eslint-disable-next-line
  }, [activeTab])

  if (!user || !isAdmin) {
    return (
      <Navigate to="/" replace />
    )
  }

  const loadData = async () => {
    await Promise.all([
      loadCategories(),
      loadProducts(),
      loadDiscountCodes(),
      loadOrders(),
      loadSpecialDiscountSettings()
    ])
  }

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*')
    setCategories(data || [])
  }

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, categories(name), product_images(image_url, order_index, alt_text)')
    setProducts(data || [])
  }

  const loadDiscountCodes = async () => {
    const { data } = await supabase.from('discount_codes').select('*')
    setDiscountCodes(data || [])
  }

  const loadOrders = async () => {
    try {
      // First, fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (ordersError) {
        console.error('Error loading orders:', ordersError)
        return
      }

      if (!ordersData || ordersData.length === 0) {
        setOrders([])
        return
      }

      // Get all order IDs and user IDs
      const orderIds = ordersData.map(order => order.id)
      const userIds = [...new Set(ordersData.map(order => order.user_id).filter(Boolean))]

      // Fetch order items for all orders
      const { data: orderItemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('order_id, product_name, product_image_url, size, quantity, item_total, custom_name, custom_number')
        .in('order_id', orderIds)

      if (itemsError) {
        console.error('Error loading order items:', itemsError)
        return
      }

      // Fetch user profiles for customer names
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)

      if (profilesError) {
        console.error('Error loading profiles:', profilesError)
      }

      // Create a map of user IDs to names
      const userNamesMap = new Map()
      if (profilesData) {
        profilesData.forEach(profile => {
          userNamesMap.set(profile.id, profile.full_name)
        })
      }

      // Merge order items with orders and add customer names
      const ordersWithItems = ordersData.map(order => ({
        ...order,
        customer_name: userNamesMap.get(order.user_id) || 'Unknown Customer',
        order_items: (orderItemsData || []).filter(item => item.order_id === order.id)
      }))

      setOrders(ordersWithItems)
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

  const loadSpecialDiscountSettings = async () => {
    const { data } = await supabase
      .from('special_discount_settings')
      .select('active')
      .eq('id', SPECIAL_DISCOUNT_SETTINGS_ID)
      .maybeSingle()
    setSpecialDiscountActive(data?.active || false)
  }

  // loading customers from the database for admin to see
  const loadCustomers = async () => {
    const { data } = await supabase.from('profiles').select('full_name, email, mobile_number')
    setCustomers(data || [])
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (!error) {
      loadOrders()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null)
      }
    }
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingItem) {
      await supabase
        .from('categories')
        .update(categoryForm)
        .eq('id', editingItem.id)
    } else {
      await supabase.from('categories').insert(categoryForm)
    }
    
    setCategoryForm({ name: '', description: '' })
    setShowCategoryForm(false)
    setEditingItem(null)
    loadCategories()
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const productData = {
      name: productForm.name,
      description: productForm.description,
      price: productForm.price,
      category_id: productForm.category_id,
      sizes: productForm.sizes.filter(size => size.trim() !== ''),
      in_stock: productForm.in_stock
    }

    let productId = editingItem?.id

    if (editingItem) {
      await supabase
        .from('products')
        .update(productData)
        .eq('id', editingItem.id)
    } else {
      const { data } = await supabase
        .from('products')
        .insert(productData)
        .select('id')
        .single()
      productId = data?.id
    }

    if (productId) {
      // Upload pending images first
      let finalImageUrls = productForm.image_urls
      if (uploadPendingImagesFn && pendingImages.length > 0) {
        try {
          finalImageUrls = await uploadPendingImagesFn()
        } catch (error) {
          console.error('Error uploading images:', error)
          alert('Failed to upload some images. Please try again.')
          return
        }
      }

      if (editingItem) {
        await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productId)
      }

      const imageInserts = finalImageUrls
        .filter(url => url.trim() !== '')
        .map((url, index) => ({
          product_id: productId,
          image_url: url,
          order_index: index,
          alt_text: productForm.name
        }))

      if (imageInserts.length > 0) {
        await supabase.from('product_images').insert(imageInserts)
      }
    }
    
    setProductForm({
      name: '',
      description: '',
      price: 0,
      category_id: '',
      sizes: [''],
      image_urls: [],
      in_stock: true
    })
    setPendingImages([])
    setUploadPendingImagesFn(null)
    setShowProductForm(false)
    setEditingItem(null)
    loadProducts()
  }

  const handleDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const discountData = {
      ...discountForm,
      code: discountForm.code.toUpperCase()
    }

    if (editingItem) {
      await supabase
        .from('discount_codes')
        .update(discountData)
        .eq('id', editingItem.id)
    } else {
      await supabase.from('discount_codes').insert(discountData)
    }
    
    setDiscountForm({ code: '', discount_percentage: 0, active: true })
    setShowDiscountForm(false)
    setEditingItem(null)
    loadDiscountCodes()
  }

  const deleteProduct = async (productId: string, force = false) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return

    try {
      if (!force) {
        // First check if product has any associated orders
        const { data: orderItems, error: checkError } = await supabase
          .from('order_items')
          .select('id')
          .eq('product_id', productId)
          .limit(1)

        if (checkError) {
          console.error('Error checking order items:', checkError)
          alert('Error checking product dependencies. Please try again.')
          return
        }

        if (orderItems && orderItems.length > 0) {
          setProductToForceDelete(productId)
          setShowForceDeleteModal(true)
          return
        }
      }

      // Delete the product (this will cascade delete product_images, cart_items, and reviews)
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) {
        console.error('Error deleting product:', error)
        alert('Error deleting product. Please try again.')
        return
      }

      loadProducts()
      alert('Product and all associated data (cart items, reviews, product images) deleted successfully!')
      setShowForceDeleteModal(false)
      setProductToForceDelete(null)
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error deleting product. Please try again.')
    }
  }

  const handleImagesUploaded = (imageUrls: string[]) => {
    // Only update with existing images, not pending ones
    setProductForm(prev => ({ ...prev, image_urls: imageUrls }))
  }

  const handlePendingImagesChange = (images: File[]) => {
    setPendingImages(images)
  }

  const handleUploadPendingImages = (uploadFn: () => Promise<string[]>) => {
    setUploadPendingImagesFn(() => uploadFn)
  }

  const handleDelete = async (table: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

      if (error) {
        console.error(`Error deleting from ${table}:`, error)
        alert('Error deleting item. Please try again.')
        return
      }

      // Reload the appropriate data
      if (table === 'categories') {
        loadCategories()
      } else if (table === 'discount_codes') {
        loadDiscountCodes()
      }
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error)
      alert('Error deleting item. Please try again.')
    }
  }

  const toggleSpecialDiscount = async () => {
    try {
      // First check if the settings record exists
      const { data: existing } = await supabase
        .from('special_discount_settings')
        .select('id')
        .eq('id', SPECIAL_DISCOUNT_SETTINGS_ID)
        .maybeSingle()

      const newActiveState = !specialDiscountActive

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('special_discount_settings')
          .update({ active: newActiveState })
          .eq('id', SPECIAL_DISCOUNT_SETTINGS_ID)

        if (error) {
          console.error('Error updating special discount settings:', error)
          return
        }
      } else {
        // Create new record
        const { error } = await supabase
          .from('special_discount_settings')
          .insert({
            id: SPECIAL_DISCOUNT_SETTINGS_ID,
            active: newActiveState
          })

        if (error) {
          console.error('Error creating special discount settings:', error)
          return
        }
      }

      setSpecialDiscountActive(newActiveState)
    } catch (error) {
      console.error('Error toggling special discount:', error)
    }
  }

  const startEdit = (item: any, type: string) => {
    setEditingItem(item)
    
    if (type === 'category') {
      setCategoryForm({ name: item.name, description: item.description })
      setShowCategoryForm(true)
    } else if (type === 'product') {
      // Get existing images for this product
      const existingImages = item.product_images?.map((img: any) => img.image_url) || []
      
      setProductForm({
        name: item.name,
        description: item.description,
        price: item.price,
        category_id: item.category_id,
        sizes: item.sizes.length ? item.sizes : [''],
        image_urls: existingImages,
        in_stock: item.in_stock
      })
      setPendingImages([])
      setUploadPendingImagesFn(null)
      setShowProductForm(true)
    } else if (type === 'discount') {
      setDiscountForm({
        code: item.code,
        discount_percentage: item.discount_percentage,
        active: item.active
      })
      setShowDiscountForm(true)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    return statusOptions.find(option => option.value === status)?.color || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    return statusOptions.find(option => option.value === status)?.label || status
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-navy-900">Admin Dashboard</h1>
          <p className="font-body text-gray-600 mt-2">Manage your SKATIOUS store</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'orders', name: 'Orders', icon: ShoppingBag },
                { id: 'products', name: 'Products', icon: Package },
                { id: 'categories', name: 'Categories', icon: Tag },
                { id: 'customers', name: 'Customers', icon: Users},
                { id: 'discounts', name: 'Discounts', icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-heading font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-heading text-xl font-semibold text-gray-900">Orders Management</h2>
              <div className="text-sm text-gray-600 font-body">
                {filteredOrders.length} of {orders.length} orders
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm">
              <div className="flex-1 w-full sm:max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search orders by customer name, order number, or email..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 font-heading">Filter by Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                >
                  <option value="all">All Status</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => {
                      const isBlueLockOrder = order.order_items.some(
                        item => item.custom_name || item.custom_number
                      )
                      return (
                      <tr key={order.id} className={`hover:bg-blue-50 transition-colors ${
                        isBlueLockOrder ? 'bg-blue-50/40 border-l-4 border-l-blue-400' : ''
                      }`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 font-heading">#{order.order_number}</div>
                          <div className="text-sm text-gray-500 font-body">{order.order_items.length} items</div>
                          {isBlueLockOrder && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                              ⚡ Blue Lock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 font-body">{order.customer_name}</div>
                          <div className="text-sm text-gray-500 font-body">{order.customer_email}</div>
                          <div className="text-sm text-gray-500 font-body">{order.customer_mobile}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className={`text-sm font-medium rounded-full px-3 py-1 border-0 ${getStatusColor(order.status)}`}
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 font-body">₹{order.total_amount.toFixed(2)}</div>
                          {order.discount_amount > 0 && (
                            <div className="text-sm text-green-600 font-body">
                              -₹{order.discount_amount.toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-body">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedOrder(order)
                              setShowOrderModal(true)
                            }}
                            className="text-emerald-600 hover:text-emerald-900 flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-heading text-xl font-semibold text-gray-900">Products</h2>
              <button
                onClick={() => setShowProductForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-heading font-medium flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products by name or description..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <div>
                  <select
                    value={productStockFilter}
                    onChange={(e) => setProductStockFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                  >
                    <option value="all">All Stock Status</option>
                    <option value="in_stock">In Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>

                <div>
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-sm text-gray-600 flex items-center font-body">
                  {filteredProducts.length} of {products.length} products
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-heading">
                        Product Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-heading">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-heading">
                        Stock Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-heading">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Available Sizes
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <Package className="h-6 w-6 text-emerald-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 font-heading text-sm leading-5">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500 font-body mt-1 line-clamp-2">
                                {product.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-body text-sm text-gray-900">
                          ₹{product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.in_stock 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.in_stock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-body text-sm text-gray-500">
                          {product.categories?.name || 'No Category'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {product.sizes.map((size, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                              >
                                {size}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => startEdit(product, 'product')}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-150"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 font-heading">
                    {productSearch || productStockFilter !== 'all' || productCategoryFilter !== 'all' 
                      ? 'No products match your search criteria' 
                      : 'No products'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 font-body">
                    {productSearch || productStockFilter !== 'all' || productCategoryFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.' 
                      : 'Get started by creating a new product.'}
                  </p>
                  {!(productSearch || productStockFilter !== 'all' || productCategoryFilter !== 'all') && (
                    <div className="mt-6">
                      <button
                        onClick={() => setShowProductForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-heading text-xl font-semibold text-gray-900">Categories</h2>
              <button
                onClick={() => setShowCategoryForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-heading font-medium flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div key={category.id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-heading text-lg font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEdit(category, 'category')}
                        className="text-emerald-600 hover:text-emerald-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete('categories', category.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="font-body text-gray-600">{category.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-heading text-xl font-semibold text-gray-900">Customers</h2>
              <div className="text-sm text-gray-600 font-body">
                {customers.length} total customers
              </div>
            </div>
            <div className="mb-4">
              <input
                type="text"
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                placeholder="Search by name, email, or mobile..."
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
              />
            </div>
            {(() => {
              const search = customerSearch.trim().toLowerCase();
              const filtered = !search
                ? customers
                : customers.filter((customer: any) => {
                    const name = (customer.full_name || customer.name || '').toLowerCase().trim();
                    const email = (customer.email || '').toLowerCase().trim();
                    const mobile = (customer.mobile_number || '').toLowerCase().trim();
                    return (
                      (name && name.includes(search)) ||
                      (email && email.includes(search)) ||
                      (mobile && mobile.includes(search))
                    );
                  });
              return (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500 font-body">
                      No customers found.
                    </div>
                  ) : (
                    filtered.map((customer: any, idx: number) => (
                      <div key={customer.email || customer.id || idx} className="bg-white rounded-xl shadow-sm p-6 flex flex-col space-y-2">
                        <div className="flex items-center space-x-3 mb-2">
                          <Users className="h-6 w-6 text-emerald-500" />
                          <h3 className="font-heading text-lg font-semibold text-gray-900">
                            {customer.full_name || customer.name || customer.email || 'Unnamed'}
                          </h3>
                        </div>
                        <div className="font-body text-gray-700">
                          <div>
                            <span className="font-medium">Email:</span>{' '}
                            {customer.email || <span className="text-gray-400">N/A</span>}
                          </div>
                          <div>
                            <span className="font-medium">Mobile:</span>{' '}
                            {customer.mobile_number || <span className="text-gray-400">N/A</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Discounts Tab */}
        {activeTab === 'discounts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-heading text-xl font-semibold text-gray-900">Discount Management</h2>
              <button
                onClick={() => setShowDiscountForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-heading font-medium flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Discount Code</span>
              </button>
            </div>

            {/* Special Discount Toggle */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-lg font-semibold text-gray-900">Special Dice Discount</h3>
                  <p className="font-body text-gray-600">Allow users to roll dice for random discounts</p>
                </div>
                <button
                  onClick={toggleSpecialDiscount}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                    specialDiscountActive ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      specialDiscountActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Discount Codes */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {discountCodes.map((discount) => (
                    <tr key={discount.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-medium text-gray-900">
                        {discount.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-body">
                        {discount.discount_percentage}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          discount.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {discount.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => startEdit(discount, 'discount')}
                            className="text-emerald-600 hover:text-emerald-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('discount_codes', discount.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className={`p-6 border-b ${
                selectedOrder.order_items.some(i => i.custom_name || i.custom_number)
                  ? 'border-blue-200 bg-blue-50/50'
                  : 'border-gray-200'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <h3 className="font-heading text-xl font-semibold text-gray-900">
                      Order Details - #{selectedOrder.order_number}
                    </h3>
                    {selectedOrder.order_items.some(i => i.custom_name || i.custom_number) && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                        ⚡ Blue Lock Order
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-heading mb-2">
                    Order Status
                  </label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-heading mb-2">
                    Payment Method
                  </label>
                  <div className={`px-4 py-3 border-2 rounded-lg font-semibold text-center ${
                    selectedOrder.payment_method === 'cod' 
                      ? 'bg-orange-50 border-orange-300 text-orange-800' 
                      : selectedOrder.payment_method === 'razorpay' 
                      ? 'bg-green-50 border-green-300 text-green-800'
                      : 'bg-gray-50 border-gray-300 text-gray-800'
                  }`}>
                    <span className="font-body text-lg">
                      {selectedOrder.payment_method === 'cod' ? '💰 Cash on Delivery (COD)' : 
                       selectedOrder.payment_method === 'razorpay' ? '💳 Online Payment (Razorpay)' : 
                       '❓ ' + (selectedOrder.payment_method || 'Not specified')}
                    </span>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-heading text-lg font-semibold text-gray-900 mb-3">Customer Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {selectedOrder.customer_name}</div>
                      <div><span className="font-medium">Email:</span> {selectedOrder.customer_email}</div>
                      <div><span className="font-medium">Mobile:</span> {selectedOrder.customer_mobile}</div>
                      {selectedOrder.customer_alternate_mobile && (
                        <div><span className="font-medium">Alt Mobile:</span> {selectedOrder.customer_alternate_mobile}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-heading text-lg font-semibold text-gray-900 mb-3">Shipping Address</h4>
                    <div className="space-y-1 text-sm">
                      {selectedOrder.shipping_full_address && (
                        <div className="flex"><span className="font-semibold w-32">Full Address:</span> <span>{selectedOrder.shipping_full_address}</span></div>
                      )}
                      <div className="flex"><span className="font-semibold w-32">City/State:</span> <span>{selectedOrder.shipping_city}, {selectedOrder.shipping_state}</span></div>
                      <div className="flex"><span className="font-semibold w-32">Country:</span> <span>{selectedOrder.shipping_country}</span></div>
                      <div className="flex"><span className="font-semibold w-32">PIN:</span> <span>{selectedOrder.shipping_pin_code}</span></div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-heading text-lg font-semibold text-gray-900 mb-3">Order Items</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedOrder.order_items.map((item, index) => (
                      <div key={index} className={`py-3 border-b border-gray-200 last:border-b-0 ${
                        item.custom_name || item.custom_number ? 'bg-blue-50/60 -mx-4 px-4 rounded-lg' : ''
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {/* Product Image */}
                            <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              {item.product_image_url ? (
                                <img
                                  src={item.product_image_url}
                                  alt={item.product_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                  <Package className="h-6 w-6 text-gray-500" />
                                </div>
                              )}
                            </div>
                            {/* Product Details */}
                            <span className="font-body text-gray-700">
                              {item.product_name} ({item.size}) × {item.quantity}
                            </span>
                          </div>
                          <span className="font-semibold">₹{item.item_total.toFixed(2)}</span>
                        </div>
                        {/* Custom Fields */}
                        {(item.custom_name || item.custom_number) && (
                          <div className="mt-2 ml-15 flex flex-wrap gap-3 pl-15">
                            {item.custom_name && (
                              <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                                <span className="text-blue-500">Name:</span>
                                <span className="uppercase tracking-wide font-bold">{item.custom_name}</span>
                              </div>
                            )}
                            {item.custom_number && (
                              <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                                <span className="text-blue-500">#</span>
                                <span className="font-bold">{item.custom_number}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-heading text-lg font-semibold text-gray-900 mb-3">Order Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{(selectedOrder.total_amount + selectedOrder.discount_amount).toFixed(2)}</span>
                    </div>
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>
                          Discount {selectedOrder.discount_code && `(${selectedOrder.discount_code})`}:
                        </span>
                        <span>-₹{selectedOrder.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg border-t border-gray-300 pt-2">
                      <span>Total:</span>
                      <span>₹{selectedOrder.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Form Modal */}
        {showCategoryForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="font-heading text-lg font-semibold text-gray-900 mb-4">
                {editingItem ? 'Edit Category' : 'Add Category'}
              </h3>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-heading mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-heading mb-1">
                    Description
                  </label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                    rows={3}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-heading font-medium"
                  >
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryForm(false)
                      setEditingItem(null)
                      setCategoryForm({ name: '', description: '' })
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-heading font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Product Form Modal */}
        {showProductForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 my-8">
              <h3 className="font-heading text-lg font-semibold text-gray-900 mb-4">
                {editingItem ? 'Edit Product' : 'Add Product'}
              </h3>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-heading mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-heading mb-1">
                    Description
                  </label>
                  <textarea
                    required
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-heading mb-1">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-heading mb-1">
                      Category
                    </label>
                    <select
                      required
                      value={productForm.category_id}
                      onChange={(e) => setProductForm(prev => ({ ...prev, category_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-heading mb-1">
                    Sizes
                  </label>
                  {productForm.sizes.map((size, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={size}
                        onChange={(e) => {
                          const newSizes = [...productForm.sizes]
                          newSizes[index] = e.target.value
                          setProductForm(prev => ({ ...prev, sizes: newSizes }))
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                        placeholder="e.g., Small, Medium, Large"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSizes = productForm.sizes.filter((_, i) => i !== index)
                          setProductForm(prev => ({ ...prev, sizes: newSizes }))
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setProductForm(prev => ({ ...prev, sizes: [...prev.sizes, ''] }))}
                    className="text-emerald-600 hover:text-emerald-800 text-sm font-heading"
                  >
                    + Add Size
                  </button>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={productForm.in_stock}
                      onChange={(e) => setProductForm(prev => ({ ...prev, in_stock: e.target.checked }))}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-heading text-sm font-medium text-gray-700">
                      In Stock
                    </span>
                  </label>
                  <p className="font-body text-xs text-gray-500 mt-1">
                    Uncheck if product is out of stock
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-heading mb-1">
                    Product Images
                  </label>
                  {editingItem ? (
                    <ImageUpload
                      productId={editingItem.id}
                      onImagesUploaded={handleImagesUploaded}
                      existingImages={productForm.image_urls}
                      onPendingImagesChange={handlePendingImagesChange}
                      onUploadPendingImages={handleUploadPendingImages}
                    />
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 font-body">
                        Images can be uploaded after the product is created
                      </p>
                      <p className="text-sm text-gray-400 font-body mt-2">
                        Save the product first, then edit to add images
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-heading font-medium"
                  >
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductForm(false)
                      setEditingItem(null)
                      setProductForm({
                        name: '',
                        description: '',
                        price: 0,
                        category_id: '',
                        sizes: [''],
                        image_urls: [],
                        in_stock: true
                      })
                      setPendingImages([])
                      setUploadPendingImagesFn(null)
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-heading font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Discount Form Modal */}
        {showDiscountForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="font-heading text-lg font-semibold text-gray-900 mb-4">
                {editingItem ? 'Edit Discount Code' : 'Add Discount Code'}
              </h3>
              <form onSubmit={handleDiscountSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-heading mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    required
                    value={discountForm.code}
                    onChange={(e) => setDiscountForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-mono font-body"
                    placeholder="SAVE20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 font-heading mb-1">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={discountForm.discount_percentage}
                    onChange={(e) => setDiscountForm(prev => ({ ...prev, discount_percentage: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={discountForm.active}
                    onChange={(e) => setDiscountForm(prev => ({ ...prev, active: e.target.checked }))}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="ml-2 block text-sm text-gray-900 font-heading">
                    Active
                  </label>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-heading font-medium"
                  >
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDiscountForm(false)
                      setEditingItem(null)
                      setDiscountForm({ code: '', discount_percentage: 0, active: true })
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-heading font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showForceDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
              <button
                onClick={() => {
                  setShowForceDeleteModal(false)
                  setProductToForceDelete(null)
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="text-center">
                <div className="mx-auto mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2 text-red-800">
                  Cannot delete this product as it has associated orders.
                </h3>
                <p className="font-body text-gray-600 mb-4">
                  Are you sure you want to delete this product? This will remove the product from the store, but existing orders will keep their order history.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      if (productToForceDelete) deleteProduct(productToForceDelete, true)
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-heading font-medium transition-colors"
                  >
                    Go ahead and delete
                  </button>
                  <button
                    onClick={() => {
                      setShowForceDeleteModal(false)
                      setProductToForceDelete(null)
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-heading font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}