import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, ArrowLeft } from 'lucide-react'
import Fuse, { type IFuseOptions } from 'fuse.js'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import Footer from '../components/Footer'

interface Product {
  id: string
  name: string
  description: string
  price: number
  sizes: string[]
  in_stock: boolean
  image_url: string
  category?: { name: string }
}

export default function BlueLockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')

  useEffect(() => {
    loadBlueLockProducts()
  }, [])

  const loadBlueLockProducts = async () => {
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          sizes,
          in_stock,
          categories (
            name
          ),
          product_images!inner (
            image_url,
            order_index
          )
        `)
        .order('name')

      if (productsData) {
        const formattedProducts = productsData
          .map((product: any) => {
            let categoryObj = { name: 'Uncategorized' }
            if (product.categories) {
              if (Array.isArray(product.categories)) {
                if (product.categories[0]?.name) {
                  categoryObj = { name: product.categories[0].name }
                }
              } else if ((product.categories as { name?: string })?.name) {
                categoryObj = { name: (product.categories as { name: string }).name }
              }
            }
            return {
              id: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              sizes: product.sizes,
              in_stock: product.in_stock,
              image_url: product.product_images[0]?.image_url || '/assets/logo/logo.jpg',
              category: categoryObj
            }
          })
          .filter((product) => product.category?.name === 'Blue Lock')

        setProducts(formattedProducts)
      }
    } catch (error) {
      console.error('Error loading Blue Lock products:', error)
      setProducts([])
    }
    setLoading(false)
  }

  const fuse = useMemo(() => {
    const options: IFuseOptions<Product> = {
      keys: ['name', 'description'],
      threshold: 0.4,
      includeScore: true,
    }
    return new Fuse(products, options)
  }, [products])

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return products
    }
    return fuse.search(searchTerm).map(result => result.item)
  }, [searchTerm, products, fuse])

  const filteredProducts = searchResults
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  }

  return (
    <div className="min-h-screen bg-white relative">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors duration-300 mb-16 font-body text-xs tracking-widest uppercase"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-24"
        >
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-medium text-black tracking-tight mb-6">
            Blue Lock.
          </h1>
          <p className="font-body text-gray-500 text-lg md:text-xl max-w-2xl tracking-wide font-light">
            Exclusive merchandise collection. High-contrast design, relentless pursuit.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 pb-8 border-b border-gray-200"
        >
          {/* Search Line */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search collection..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-transparent border-none outline-none font-body text-black placeholder-gray-400 border-b border-transparent focus:border-black transition-colors"
            />
          </div>

          <div className="flex items-center gap-8">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-transparent py-2 pr-8 font-body text-sm text-gray-600 focus:outline-none focus:text-black cursor-pointer transition-colors"
              >
                <option value="name">Sort: Alphabetical</option>
                <option value="price-low">Sort: Price (Low to High)</option>
                <option value="price-high">Sort: Price (High to Low)</option>
              </select>
              <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="text-xs text-gray-400 font-body uppercase tracking-widest hidden sm:block">
              [{filteredProducts.length}] Results
            </div>
          </div>
        </motion.div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-100 aspect-[4/5] mb-4"></div>
                <div className="h-4 bg-gray-100 w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-100 w-1/3"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16"
          >
            {filteredProducts.map((product) => (
              <motion.div key={product.id} variants={itemVariants}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32"
          >
            <h3 className="font-display text-2xl text-gray-900 mb-4 font-medium">
              Nothing found
            </h3>
            <p className="font-body text-gray-500 mb-8 max-w-md mx-auto">
              We couldn't find any products matching your search criteria.
            </p>
            <Link
              to="/products"
              className="inline-block border border-black px-8 py-3 text-sm tracking-widest uppercase hover:bg-black hover:text-white transition-colors duration-300"
            >
              View All
            </Link>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  )
}
