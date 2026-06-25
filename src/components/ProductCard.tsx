import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '../context/CartContext'

interface Product {
  id: string
  name: string
  description: string
  price: number
  sizes: string[]
  in_stock: boolean
  image_url: string
}

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!selectedSize) return
    
    setIsAdding(true)
    await addToCart(product.id, selectedSize, 1)
    setIsAdding(false)
  }

  return (
    <div className="group flex flex-col w-full">
      {/* Image Container */}
      <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-gray-50 mb-6">
        <img
          src={product.image_url}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Subtle overlay on hover for premium feel without darkening */}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/5" />
      </Link>

      {/* Content Area */}
      <div className="flex flex-col flex-1 px-1">
        <div className="flex justify-between items-start mb-2">
          <Link to={`/product/${product.id}`} className="group-hover:opacity-70 transition-opacity duration-300">
            <h3 className="font-heading text-lg font-medium text-gray-900 leading-tight">
              {product.name}
            </h3>
          </Link>
          <span className="font-heading text-lg font-semibold text-gray-900 ml-4 whitespace-nowrap">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
        </div>
        
        <p className="font-body text-sm text-gray-500 line-clamp-1 mb-6">
          {product.description}
        </p>

        <div className="mt-auto space-y-4">
          {product.sizes.length > 0 && product.in_stock && (
            <div className="relative">
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full appearance-none bg-transparent border-b border-gray-200 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-900 transition-colors cursor-pointer pr-8"
                onClick={(e) => e.stopPropagation()}
              >
                {product.sizes.map((size) => (
                  <option key={size} value={size}>
                    Size: {size}
                  </option>
                ))}
              </select>
              {/* Custom Dropdown Arrow */}
              <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 flex items-center px-2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}

          {product.in_stock ? (
            <button
              onClick={handleAddToCart}
              disabled={isAdding || !selectedSize}
              className="w-full flex items-center justify-center gap-2 py-3 border border-gray-900 bg-transparent hover:bg-gray-900 hover:text-white text-gray-900 transition-all duration-300 text-sm tracking-widest uppercase font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Adding</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          ) : (
            <div className="w-full text-center py-3 border border-gray-200 text-gray-400 text-sm tracking-widest uppercase font-medium">
              Out of Stock
            </div>
          )}
        </div>
      </div>
    </div>
  )
}