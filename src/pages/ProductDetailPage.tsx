import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Heart, Star, Package, Truck, Shield, Edit, Trash2, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

interface Product {
  id: string
  name: string
  description: string
  price: number
  sizes: string[]
  in_stock: boolean
  average_rating: number
  total_reviews: number
  category?: { name: string }
  product_images: {
    image_url: string
    order_index: number
    alt_text: string
  }[]
}

interface Review {
  id: string
  user_id: string
  rating: number
  review_text: string | null
  created_at: string
  updated_at: string
  full_name?: string
}

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const { addToCart } = useCart()
  const { user } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState('')
  
  // Review form state
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [isEditingReview, setIsEditingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')

  // Custom name/number state (Blue Lock only)
  const [wantsCustomName, setWantsCustomName] = useState(false)
  const [wantsCustomNumber, setWantsCustomNumber] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customNumber, setCustomNumber] = useState('')

  useEffect(() => {
    if (productId) {
      loadProduct()
      loadReviews()
    }
  }, [productId])

  useEffect(() => {
    if (user && productId) {
      loadUserReview()
    }
  }, [user, productId])

  const loadProduct = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          sizes,
          in_stock,
          average_rating,
          total_reviews,
          categories (
            name
          ),
          product_images (
            image_url,
            order_index,
            alt_text
          )
        `)
        .eq('id', productId)
        .single()

      if (error) {
        console.error('Error loading product:', error)
        setError('Product not found')
        return
      }

      if (data) {
        // Resolve category
        let categoryObj: { name: string } | undefined = undefined
        if (data.categories) {
          if (Array.isArray(data.categories)) {
            if (data.categories[0]?.name) {
              categoryObj = { name: data.categories[0].name }
            }
          } else if ((data.categories as { name?: string })?.name) {
            categoryObj = { name: (data.categories as { name: string }).name }
          }
        }
        setProduct({ ...data, category: categoryObj })
        if (data.sizes.length > 0) {
          setSelectedSize(data.sizes[0])
        }
      }
    } catch (err) {
      console.error('Error loading product:', err)
      setError('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    try {
      setReviewsLoading(true)
      
      // First, get all reviews for this product
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('product_reviews')
        .select('id, user_id, rating, review_text, created_at, updated_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      if (reviewsError) {
        console.error('Error loading reviews:', reviewsError)
        return
      }

      if (!reviewsData || reviewsData.length === 0) {
        setReviews([])
        return
      }

      // Get unique user IDs from reviews
      const userIds = [...new Set(reviewsData.map(review => review.user_id))]

      // Fetch user profiles for these user IDs
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)

      if (profilesError) {
        console.error('Error loading profiles:', profilesError)
        // Continue without profile data
        setReviews(reviewsData)
        return
      }

      // Create a map of user_id to full_name
      const profileMap = new Map()
      if (profilesData) {
        profilesData.forEach(profile => {
          profileMap.set(profile.id, profile.full_name)
        })
      }

      // Combine reviews with profile data
      const reviewsWithProfiles = reviewsData.map(review => ({
        ...review,
        full_name: profileMap.get(review.user_id) || 'Anonymous User'
      }))

      setReviews(reviewsWithProfiles)
    } catch (err) {
      console.error('Error loading reviews:', err)
    } finally {
      setReviewsLoading(false)
    }
  }

  const loadUserReview = async () => {
    if (!user || !productId) return

    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user review:', error)
        return
      }

      if (data) {
        setUserReview(data)
        setReviewRating(data.rating)
        setReviewText(data.review_text || '')
      }
    } catch (err) {
      console.error('Error loading user review:', err)
    }
  }

  const isBlueLock = product?.category?.name === 'Blue Lock'

  const handleAddToCart = async () => {
    if (!product || !selectedSize) return
    
    setIsAdding(true)
    const finalCustomName = (isBlueLock && wantsCustomName && customName.trim()) ? customName.trim() : undefined
    const finalCustomNumber = (isBlueLock && wantsCustomNumber && customNumber.trim()) ? customNumber.trim() : undefined
    await addToCart(product.id, selectedSize, 1, finalCustomName, finalCustomNumber)
    setIsAdding(false)
  }

  const handleSubmitReview = async () => {
    if (!user) {
      setReviewError('Please sign in to leave a review')
      return
    }

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      setReviewError('Please select a rating between 1 and 5 stars')
      return
    }

    if (!reviewText.trim()) {
      setReviewError('Please write a review')
      return
    }

    setIsSubmittingReview(true)
    setReviewError('')

    try {
      const reviewData = {
        product_id: productId,
        user_id: user.id,
        rating: reviewRating,
        review_text: reviewText.trim(),
        updated_at: new Date().toISOString()
      }

      if (userReview) {
        // Update existing review
        const { error } = await supabase
          .from('product_reviews')
          .update(reviewData)
          .eq('id', userReview.id)

        if (error) throw error
      } else {
        // Create new review
        const { error } = await supabase
          .from('product_reviews')
          .insert(reviewData)

        if (error) throw error
      }

      // Reload reviews and user review
      await Promise.all([loadReviews(), loadUserReview(), loadProduct()])
      
      // Reset form if it was a new review
      if (!userReview) {
        setReviewRating(0)
        setReviewText('')
      }
      
      setIsEditingReview(false)
      
    } catch (error: any) {
      console.error('Error submitting review:', error)
      setReviewError(error.message || 'Failed to submit review. Please try again.')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleDeleteReview = async () => {
    if (!userReview || !user) return

    if (!confirm('Are you sure you want to delete your review?')) return

    try {
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', userReview.id)

      if (error) throw error

      // Reset state
      setUserReview(null)
      setReviewRating(0)
      setReviewText('')
      setIsEditingReview(false)

      // Reload reviews and product
      await Promise.all([loadReviews(), loadProduct()])
      
    } catch (error: any) {
      console.error('Error deleting review:', error)
      setReviewError(error.message || 'Failed to delete review. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const renderStars = (rating: number, interactive: boolean = false, onStarClick?: (star: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onStarClick && onStarClick(star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer focus:outline-none' : 'cursor-default'}`}
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                rating >= star
                  ? 'text-yellow-400 fill-current'
                  : interactive
                  ? 'text-gray-300 hover:text-yellow-300'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 font-body text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="font-heading text-xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
          <p className="font-body text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-heading font-medium transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Products</span>
          </Link>
        </div>
      </div>
    )
  }

  const images = product.product_images.length > 0 
    ? product.product_images.sort((a, b) => a.order_index - b.order_index)
    : [{ image_url: 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg', order_index: 0, alt_text: product.name }]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-body"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Products</span>
          </Link>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-white rounded-xl shadow-sm overflow-hidden">
              <img
                src={images[selectedImageIndex]?.image_url}
                alt={images[selectedImageIndex]?.alt_text || product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square bg-white rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index
                        ? 'border-emerald-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={image.alt_text || product.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Category */}
            {product.category && (
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                  {product.category.name}
                </span>
              </div>
            )}

            {/* Product Name */}
            <h1 className="font-display text-3xl font-bold text-gray-900">
              {product.name}
            </h1>

            {/* Rating Summary */}
            {/* <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {renderStars(product.average_rating)}
                <span className="font-body text-sm text-gray-600">
                  {product.average_rating.toFixed(1)} out of 5
                </span>
              </div>
              <span className="font-body text-sm text-gray-500">
                ({product.total_reviews} review{product.total_reviews !== 1 ? 's' : ''})
              </span>
            </div> */}

            {/* Price */}
            <div className="text-3xl font-bold text-navy-800">
              ₹{product.price.toFixed(2)}
            </div>

            {/* Description */}
            <div>
              <h3 className="font-heading text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="font-body text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Size Selection */}
            {product.sizes.length > 0 && product.in_stock && (
              <div>
                <h3 className="font-heading text-lg font-semibold text-gray-900 mb-3">Select Size</h3>
                <div className="grid grid-cols-3 gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-3 px-4 rounded-lg border-2 font-heading font-medium transition-colors ${
                        selectedSize === size
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <div className="space-y-4">
              {/* Custom Name & Number (Blue Lock only) */}
              {isBlueLock && product.in_stock && (
                <div className="border border-gray-200 rounded-xl p-5 space-y-4 bg-gray-50">
                  <h3 className="font-heading text-lg font-semibold text-gray-900">Customization</h3>
                  <p className="font-body text-sm text-gray-500">Add a custom name or number to your jersey.</p>

                  {/* Custom Name Toggle + Input */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={wantsCustomName}
                        onChange={(e) => {
                          setWantsCustomName(e.target.checked)
                          if (!e.target.checked) setCustomName('')
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-heading text-sm font-medium text-gray-700">Add Custom Name</span>
                    </label>
                    {wantsCustomName && (
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g. ISAGI"
                        maxLength={20}
                        className="mt-2 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body text-sm uppercase"
                      />
                    )}
                  </div>

                  {/* Custom Number Toggle + Input */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={wantsCustomNumber}
                        onChange={(e) => {
                          setWantsCustomNumber(e.target.checked)
                          if (!e.target.checked) setCustomNumber('')
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-heading text-sm font-medium text-gray-700">Add Custom Number</span>
                    </label>
                    {wantsCustomNumber && (
                      <input
                        type="text"
                        value={customNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '')
                          if (val.length <= 2) setCustomNumber(val)
                        }}
                        placeholder="e.g. 11"
                        maxLength={2}
                        className="mt-2 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body text-sm"
                      />
                    )}
                  </div>
                </div>
              )}
              {product.in_stock ? (
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || !selectedSize}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-4 px-6 rounded-lg font-heading font-semibold text-lg transition-colors duration-200 flex items-center justify-center space-x-3"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>{isAdding ? 'Adding to Cart...' : 'Add to Cart'}</span>
                </button>
              ) : (
                <div className="w-full bg-red-100 text-red-800 py-4 px-6 rounded-lg font-heading font-semibold text-lg text-center border-2 border-red-200">
                  <div className="flex items-center justify-center space-x-3">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Out of Stock</span>
                  </div>
                  <p className="font-body text-sm text-red-600 mt-2">
                    This product is currently unavailable
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="font-heading text-2xl font-semibold text-gray-900 mb-6">Customer Reviews</h3>
            
            {/* User Review Form */}
            {user && (
              <div className="border-b border-gray-200 pb-8 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-heading text-lg font-semibold text-gray-900">
                    {userReview ? 'Your Review' : 'Write a Review'}
                  </h4>
                  {userReview && !isEditingReview && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsEditingReview(true)}
                        className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 font-heading font-medium text-sm"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={handleDeleteReview}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700 font-heading font-medium text-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>

                {(!userReview || isEditingReview) && (
                  <div className="space-y-4">
                    {/* Star Rating */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-heading mb-2">
                        Your Rating
                      </label>
                      <div className="flex items-center space-x-2">
                        {renderStars(reviewRating, true, setReviewRating)}
                        <span className="ml-2 text-sm text-gray-600 font-body">
                          {reviewRating > 0 ? `${reviewRating} out of 5` : 'Click to rate'}
                        </span>
                      </div>
                    </div>

                    {/* Review Text */}
                    <div>
                      <label htmlFor="review" className="block text-sm font-medium text-gray-700 font-heading mb-2">
                        Your Review
                      </label>
                      <textarea
                        id="review"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Share your thoughts about this product..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 font-body resize-none"
                      />
                    </div>

                    {/* Error Message */}
                    {reviewError && (
                      <p className="text-red-600 text-sm font-body">{reviewError}</p>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSubmitReview}
                        disabled={!reviewRating || !reviewText.trim() || isSubmittingReview}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-2 px-6 rounded-lg font-heading font-medium transition-colors duration-200 flex items-center space-x-2"
                      >
                        {isSubmittingReview ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>{userReview ? 'Updating...' : 'Submitting...'}</span>
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4" />
                            <span>{userReview ? 'Update Review' : 'Submit Review'}</span>
                          </>
                        )}
                      </button>
                      
                      {isEditingReview && (
                        <button
                          onClick={() => {
                            setIsEditingReview(false)
                            setReviewRating(userReview?.rating || 0)
                            setReviewText(userReview?.review_text || '')
                            setReviewError('')
                          }}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-6 rounded-lg font-heading font-medium transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Display User's Existing Review */}
                {userReview && !isEditingReview && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      {renderStars(userReview.rating)}
                      <span className="text-sm font-medium text-gray-900">
                        {userReview.rating} out of 5
                      </span>
                    </div>
                    <p className="text-gray-700 font-body leading-relaxed mb-2">{userReview.review_text}</p>
                    <p className="text-sm text-gray-500 font-body">
                      Reviewed on {formatDate(userReview.created_at)}
                      {userReview.updated_at !== userReview.created_at && (
                        <span> • Updated on {formatDate(userReview.updated_at)}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Sign in prompt for non-authenticated users */}
            {!user && (
              <div className="border-b border-gray-200 pb-8 mb-8">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="font-heading text-lg font-semibold text-gray-900 mb-2">
                    Sign in to write a review
                  </h4>
                  <p className="font-body text-gray-600 mb-4">
                    Share your experience with this product by signing in to your account.
                  </p>
                  <Link
                    to="/auth"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-heading font-medium transition-colors duration-200 inline-block"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            )}

            {/* All Reviews Display */}
            <div>
              <h4 className="font-heading text-lg font-semibold text-gray-900 mb-4">
                All Reviews ({reviews.length})
              </h4>
              
              {reviewsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="font-body text-gray-600 mt-2">Loading reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h5 className="font-heading text-lg font-semibold text-gray-900 mb-2">No reviews yet</h5>
                  <p className="font-body text-gray-600">
                    Be the first to review this product and help other customers make informed decisions.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            {renderStars(review.rating)}
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {review.rating} out of 5
                            </span>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 font-body">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      
                      {review.review_text && (
                        <p className="text-gray-700 font-body leading-relaxed mb-3">
                          {review.review_text}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-600 font-body">
                          {review.full_name || 'Anonymous User'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}