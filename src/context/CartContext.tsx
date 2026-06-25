import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface ProductImage {
  image_url: string
  alt_text: string | null
  order_index: number
}

interface Product {
  name: string
  price: number
  product_images: ProductImage[]
}

interface CartItem {
  id: string
  product_id: string
  size: string
  quantity: number
  user_id: string | null
  session_id: string | null
  custom_name: string | null
  custom_number: string | null
  product?: Product
}

interface SupabaseCartItem {
  id: string
  product_id: string
  size: string
  quantity: number
  user_id: string | null
  session_id: string | null
  product: {
    name: string
    price: number
    product_images: ProductImage[]
  } | null
}

interface RawProductImage {
  image_url: string
  alt_text: string | null
  order_index: number | null
}

interface RawProduct {
  name: string
  price: number
  product_images: RawProductImage[]
}

interface RawCartItem {
  id: string
  product_id: string
  size: string
  quantity: number
  user_id: string | null
  session_id: string | null
  custom_name: string | null
  custom_number: string | null
  product: RawProduct | null
}

interface CartContextType {
  items: CartItem[]
  loading: boolean
  addToCart: (productId: string, size: string, quantity?: number, customName?: string, customNumber?: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  getCartTotal: () => number
  getCartCount: () => number
  discountCode: string | null
  discountPercentage: number
  applyDiscount: (code: string, percentage: number) => void
  removeDiscount: () => void
  getFinalTotal: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionId, setSessionId] = useState<string>('')
  const [discountCode, setDiscountCode] = useState<string | null>(null)
  const [discountPercentage, setDiscountPercentage] = useState<number>(0)

  // Fetch dice roll discount for logged-in user only
  useEffect(() => {
    const fetchUserDiceDiscount = async () => {
      if (user) {
        // Fetch latest dice roll for today
        const today = new Date().toISOString().split('T')[0]
        const { data, error } = await supabase
          .from('user_dice_rolls')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lt('created_at', `${today}T23:59:59.999Z`)
          .order('created_at', { ascending: false })
          .limit(1)

        if (data && data.length > 0) {
          const roll = data[0]
          // Generate the discount code as in DiceRollModal
          const userPrefix = user.id.substring(0, 4).toUpperCase()
          const code = `DICE${userPrefix}${roll.roll_result}${today.replace(/-/g, '')}`
          setDiscountCode(code)
          setDiscountPercentage(roll.discount_percentage)
        } else {
          setDiscountCode(null)
          setDiscountPercentage(0)
        }
      } else {
        // For guests, do not apply any dice discount
        setDiscountCode(null)
        setDiscountPercentage(0)
      }
    }
    fetchUserDiceDiscount()
  }, [user])

  useEffect(() => {
    // Generate or get session ID for anonymous users
    let storedSessionId = localStorage.getItem('cart_session_id')
    if (!storedSessionId) {
      storedSessionId = 'session_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('cart_session_id', storedSessionId)
    }
    setSessionId(storedSessionId)
  }, [])

  useEffect(() => {
    if (sessionId) {
      loadCart()
    }
  }, [user, sessionId])

  const loadCart = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('cart_items')
        .select(`
          *,
          product:products (
            name,
            price,
            product_images (
              image_url,
              alt_text,
              order_index
            )
          )
        `)

      if (user) {
        query = query.eq('user_id', user.id)
      } else {
        query = query.eq('session_id', sessionId).is('user_id', null)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading cart:', error)
        setItems([])
        return
      }

      // Transform the data to match our CartItem interface
      const validItems = (data as RawCartItem[] || [])
        .filter(item => item.product !== null)
        .map(item => ({
          id: item.id,
          product_id: item.product_id,
          size: item.size,
          quantity: item.quantity,
          user_id: item.user_id,
          session_id: item.session_id,
          custom_name: item.custom_name || null,
          custom_number: item.custom_number || null,
          product: item.product ? {
            name: item.product.name,
            price: item.product.price,
            product_images: Array.isArray(item.product.product_images) 
              ? item.product.product_images
                  .map((img: RawProductImage) => ({
                    image_url: img.image_url,
                    alt_text: img.alt_text,
                    order_index: img.order_index || 0
                  }))
                  .sort((a: ProductImage, b: ProductImage) => a.order_index - b.order_index)
              : []
          } : undefined
        })) as CartItem[]

      setItems(validItems)
    } catch (err) {
      console.error('Unexpected error loading cart:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (productId: string, size: string, quantity: number = 1, customName?: string, customNumber?: string) => {
    const hasCustomization = !!(customName || customNumber)

    // Check if item already exists (customized items are always unique)
    if (!hasCustomization) {
      const existingItem = items.find(
        item => item.product_id === productId && item.size === size && !item.custom_name && !item.custom_number
      )

      if (existingItem) {
        await updateQuantity(existingItem.id, existingItem.quantity + quantity)
        return
      }
    }

    const cartItem: Record<string, any> = {
      product_id: productId,
      size,
      quantity,
      user_id: user?.id || null,
      session_id: user ? null : sessionId,
    }

    if (customName) cartItem.custom_name = customName
    if (customNumber) cartItem.custom_number = customNumber

    const { error } = await supabase.from('cart_items').insert(cartItem)
    if (!error) {
      loadCart()
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId)
      return
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)

    if (!error) {
      loadCart()
    }
  }

  const removeFromCart = async (itemId: string) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)

    if (!error) {
      loadCart()
    }
  }

  const clearCart = async () => {
    let query = supabase.from('cart_items').delete()

    if (user) {
      query = query.eq('user_id', user.id)
    } else {
      query = query.eq('session_id', sessionId).is('user_id', null)
    }

    const { error } = await query
    if (!error) {
      setItems([])
      removeDiscount()
    }
  }

  const getCartTotal = () => {
    return items.reduce((total, item) => {
      const price = item.product?.price || 0
      return total + (price * item.quantity)
    }, 0)
  }

  const getCartCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0)
  }

  // Only allow manual promo code for guests, not dice discount
  const applyDiscount = (code: string, percentage: number) => {
    setDiscountCode(code)
    setDiscountPercentage(percentage)
  }

  const removeDiscount = () => {
    setDiscountCode(null)
    setDiscountPercentage(0)
  }

  const getFinalTotal = () => {
    const subtotal = getCartTotal()
    const discountAmount = (subtotal * discountPercentage) / 100
    return subtotal - discountAmount
  }

  const value = {
    items,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    discountCode,
    discountPercentage,
    applyDiscount,
    removeDiscount,
    getFinalTotal,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}