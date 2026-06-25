import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, ArrowLeft } from 'lucide-react'
import Fuse, { type IFuseOptions } from 'fuse.js'
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
      // Load products filtered by Blue Lock category
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-navy-900 transition-colors mb-6 font-body text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-navy-900 mb-4">
            Blue Lock Collection
          </h1>
          <p className="font-body text-gray-600 text-lg max-w-2xl mx-auto">
            Exclusive Blue Lock merchandise — unleash the striker within.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search Blue Lock products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
              />
            </div>

            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body"
              >
                <option value="name">Sort by Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            <div className="text-sm text-gray-600 flex items-center font-body">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-80"></div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="font-heading text-xl font-semibold text-gray-900 mb-2">
              No Blue Lock products found
            </h3>
            <p className="font-body text-gray-600 mb-6">
              Check back soon for new additions to the Blue Lock collection.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-navy-800 hover:bg-navy-900 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
