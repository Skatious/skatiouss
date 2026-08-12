import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, easeInOut } from 'framer-motion';
import { ArrowRight, Star, Sparkles, Truck, Shield, Headphones, Quote } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import PlayersShowcase from '../components/PlayersShowcase';
import ExploreSection from '../components/ExploreSection';
import bannerImg from '../../assets/banner.jpeg';
import cert1Img from '../../assets/cert1.jpeg';
import cert2Img from '../../assets/cert2.jpeg';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sizes: string[];
  in_stock: boolean;
  image_url: string;
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 500], [0, -150]);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      const { data: products } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          sizes,
          in_stock,
          product_images!inner (
            image_url,
            order_index
          )
        `)
        .limit(6);

      if (products && products.length > 0) {
        const formattedProducts = products.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          sizes: product.sizes,
          in_stock: product.in_stock,
          image_url: product.product_images[0]?.image_url || 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg',
        }));
        setFeaturedProducts(formattedProducts);
      } else {
        // Fallback to mock data only if no real products found
        setFeaturedProducts([
          {
            id: '1',
            name: 'Premium Cotton Tee',
            description: 'Soft, comfortable cotton t-shirt with modern fit',
            price: 29.99,
            sizes: ['XS', 'S', 'M', 'L', 'XL'],
            in_stock: true,
            image_url: 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg'
          },
          {
            id: '2',
            name: 'Urban Hoodie',
            description: 'Stylish hoodie perfect for casual wear and street style',
            price: 49.99,
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
            in_stock: true,
            image_url: 'https://images.pexels.com/photos/1629781/pexels-photo-1629781.jpeg'
          },
          {
            id: '3',
            name: 'Classic Denim Jacket',
            description: 'Timeless denim jacket with modern styling',
            price: 79.99,
            sizes: ['XS', 'S', 'M', 'L', 'XL'],
            in_stock: true,
            image_url: 'https://images.pexels.com/photos/1010973/pexels-photo-1010973.jpeg'
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading featured products:', error);
      // Mock data for demonstration if database error
      setFeaturedProducts([
        {
          id: '1',
          name: 'Premium Cotton Tee',
          description: 'Soft, comfortable cotton t-shirt with modern fit',
          price: 29.99,
          sizes: ['XS', 'S', 'M', 'L', 'XL'],
          in_stock: true,
          image_url: 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg'
        },
        {
          id: '2',
          name: 'Urban Hoodie',
          description: 'Stylish hoodie perfect for casual wear and street style',
          price: 49.99,
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          in_stock: true,
          image_url: 'https://images.pexels.com/photos/1629781/pexels-photo-1629781.jpeg'
        },
        {
          id: '3',
          name: 'Classic Denim Jacket',
          description: 'Timeless denim jacket with modern styling',
          price: 79.99,
          sizes: ['XS', 'S', 'M', 'L', 'XL'],
          in_stock: true,
          image_url: 'https://images.pexels.com/photos/1010973/pexels-photo-1010973.jpeg'
        }
      ]);
    }
    setLoading(false);
  };

  const stats = [
    { value: '100+', label: 'Happy Customers', description: 'Fashion enthusiasts worldwide' },
    { value: '1000+', label: 'Products Sold', description: 'Premium pieces delivered' },
    { value: '4/5', label: 'Customer Rating', description: 'Average satisfaction score' },
    { value: '75+', label: 'Recurring Customers', description: 'Come back for more' }
  ];

  const features = [
    {
      icon: Truck,
      title: 'All India Shipping',
      description: 'India wide delivery.'
    },
    {
      icon: Shield,
      title: 'Premium Quality',
      description: 'Every piece crafted with finest materials and quality promise.'
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Our Brand is always available to help you anytime.'
    }
  ];

  const testimonials = [
    {
      name: 'Hassan',
      content: 'SKATIOUS understands the fans at heart. The quality is exceptional.',
      rating: 5,
    },
    {
      name: 'Raj',
      content: 'The attention to detail in every piece is remarkable. Premium quality.',
      rating: 5,
    },
    {
      name: 'Divyansh',
      content: 'Finally found a brand that understands sports fashion. Highly recommended!',
      rating: 5,
    }
  ];

  // Scroll reveal animation variants
  const scrollRevealVariants = {
    hidden: { 
      opacity: 0, 
      y: 75,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: easeInOut
      }
    }
  };

  // CountUp component with "start" prop for manual trigger and slower animation
  function CountUp({ end, duration = 3, start = false, ...props }: { end: number | string, duration?: number, start?: boolean }) {
    const [count, setCount] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (!start) return;
      let startVal = 0;
      let endNum = typeof end === 'string' && end.includes('+')
        ? parseInt(end)
        : typeof end === 'string' && end.includes('/')
          ? parseFloat(end)
          : Number(end);
      if (isNaN(endNum)) endNum = 0;
      const increment = endNum / (duration * 80); // slower
      let frame = 0;
      const totalFrames = duration * 80;
      intervalRef.current = setInterval(() => {
        frame++;
        if (frame >= totalFrames) {
          setCount(endNum);
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else {
          setCount(Number((startVal + increment * frame).toFixed(0)));
        }
      }, 1000 / 80);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [end, duration, start]);
    let suffix = '';
    if (typeof end === 'string' && end.includes('+')) suffix = '+';
    if (typeof end === 'string' && end.includes('/')) suffix = end.slice(end.indexOf('/'));
    return (
      <span {...props}>
        {count}
        {suffix}
      </span>
    );
  }

  const [statsInView, setStatsInView] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [certModal, setCertModal] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!statsRef.current) return;
      const rect = statsRef.current.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setStatsInView(true);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <motion.div 
          style={{ y: heroParallax }}
          className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-emerald-900"
        />
        
        {/* Enhanced Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full blur-xl ${
                i % 3 === 0 ? 'bg-emerald-400/10' :
                i % 3 === 1 ? 'bg-blue-400/10' : 'bg-purple-400/10'
              }`}
              style={{
                width: `${60 + i * 15}px`,
                height: `${60 + i * 15}px`,
                left: `${10 + i * 12}%`,
                top: `${15 + i * 10}%`,
              }}
              animate={{
                y: [-30, 30, -30],
                x: [-20, 20, -20],
                scale: [1, 1.3, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 6 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3
              }}
            />
          ))}
        </div>

        {/* Animated Geometric Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`shape-${i}`}
              className="absolute opacity-5"
              style={{
                left: `${20 + i * 20}%`,
                top: `${20 + i * 15}%`,
              }}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 15 + i * 5,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div className={`w-32 h-32 ${
                i % 2 === 0 ? 'rounded-full' : 'rounded-2xl rotate-45'
              } bg-gradient-to-r from-emerald-500/20 to-blue-500/20 backdrop-blur-sm`} />
            </motion.div>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="mb-6"
          >
            <div className="flex items-center justify-center mb-4">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-6 w-6 text-emerald-400 mr-2" />
              </motion.div>
              <motion.span 
                className="text-emerald-400 font-semibold tracking-wide uppercase text-sm"
                animate={{ 
                  textShadow: [
                    "0 0 10px rgba(16, 185, 129, 0.5)",
                    "0 0 20px rgba(16, 185, 129, 0.8)",
                    "0 0 10px rgba(16, 185, 129, 0.5)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Premium Collection
              </motion.span>
              <motion.div
                animate={{ rotate: [360, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-6 w-6 text-emerald-400 ml-2" />
              </motion.div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.3, ease: [0.21, 1.02, 0.73, 1] }}
            className="text-5xl md:text-7xl font-bold mb-8 leading-tight"
          >
            <motion.span
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
              }}
              transition={{ duration: 5, repeat: Infinity }}
              className="bg-gradient-to-r from-white via-gray-100 to-white bg-300% bg-clip-text"
            >
              Elevate Your
            </motion.span>
            <motion.span 
              className="block bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
              }}
              transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
            >
              Style Experience
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Discover premium clothing crafted for those who demand excellence, style, and comfort in every piece.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          >
            <motion.div
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 25px 50px -12px rgba(16, 185, 129, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link
                to="/products"
                className="group bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-2 shadow-2xl relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  whileHover={{ scale: 1.1 }}
                />
                <span className="relative z-10">Shop Collection</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="relative z-10"
                >
                  <ArrowRight className="h-5 w-5" />
                </motion.div>
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ 
                scale: 1.05,
                backgroundColor: "rgba(255, 255, 255, 0.15)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link
                to="/about"
                className="border-2 border-white/80 text-white hover:bg-white/10 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 backdrop-blur-sm shadow-2xl  min-w-[200px]"
              >
                Learn More
              </Link>
            </motion.div>
          </motion.div>

          {/* Enhanced Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex items-center justify-center space-x-8 text-gray-300"
          >
            <div className="flex items-center space-x-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.3,
                      delay: 1.2 + i * 0.1,
                      type: "spring",
                      stiffness: 500
                    }}
                  >
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  </motion.div>
                ))}
              </div>
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                1000+ Reviews
              </motion.span>
            </div>
            <div className="hidden sm:block w-1 h-6 bg-gray-400 rounded-full" />
            <motion.span
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              All India Shipping
            </motion.span>
          </motion.div>
        </div>

        {/* Animated Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 25, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white/70 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Cashback Scheme Banner ── */}
      <motion.section
        className="relative py-16 bg-gradient-to-br from-navy-900 via-[#0a1628] to-navy-900 overflow-hidden"
        variants={scrollRevealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* Background glow orbs */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 -left-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"
        />

        <div className="max-w-6xl mx-auto px-4">
          {/* Section label */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex items-center justify-center mb-8"
          >
            <motion.span
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold tracking-widest uppercase"
              style={{
                background: 'linear-gradient(90deg, #10b981, #34d399, #10b981)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                border: '1px solid rgba(16,185,129,0.4)',
              }}
            >
              <Sparkles className="h-4 w-4 text-emerald-400" style={{ WebkitTextFillColor: 'initial' }} />
              Exclusive Offer
            </motion.span>
          </motion.div>

          {/* Banner Image with glowing frame */}
          <motion.div
            whileHover={{ scale: 1.015 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="relative rounded-3xl overflow-hidden"
            style={{
              boxShadow: '0 0 0 1px rgba(16,185,129,0.25), 0 0 60px rgba(16,185,129,0.15), 0 30px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Shimmer overlay on hover */}
            <motion.div
              className="absolute inset-0 z-10 pointer-events-none"
              initial={{ x: '-100%', opacity: 0 }}
              whileInView={{ x: '200%', opacity: [0, 0.4, 0] }}
              transition={{ duration: 1.8, delay: 0.5, ease: 'easeInOut' }}
              viewport={{ once: true }}
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
              }}
            />

            {/* Corner accent badges */}
            <div className="absolute top-4 left-4 z-20 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-emerald-500/40 uppercase tracking-wider">
              🎉 Earn Cashback
            </div>

            <img
              src={bannerImg}
              alt="Skatious Cashback Scheme - Order jerseys and earn cashback"
              className="w-full h-auto object-cover block"
              style={{ maxHeight: '520px', objectPosition: 'center' }}
            />
          </motion.div>

          {/* CTA below banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/products"
                className="group inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-2xl font-semibold text-base transition-all duration-300 shadow-xl shadow-emerald-900/40"
              >
                Order Jerseys Now
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </Link>
            </motion.div>
            <p className="text-gray-400 text-sm">
              Order 3-4 jerseys · Post on Instagram · Get cashback in 24 hrs
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Explore Section - Blog, Replica, Blue Lock */}
      <ExploreSection />

      {/* Features Section with Scroll Reveal */}
      <motion.section 
        className="py-24 bg-gray-50"
        variants={scrollRevealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            variants={scrollRevealVariants}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-6">
              Why Choose SKATIOUS?
            </h2>
            <div className="w-24 h-1 bg-emerald-600 mx-auto mb-6 rounded-full" />
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're not just selling clothes; we're crafting experiences that elevate your style journey.
            </p>

          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={scrollRevealVariants}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -12, transition: { duration: 0.3 } }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 text-center group"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-200 transition-colors">
                  <feature.icon className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-navy-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <PlayersShowcase/>
      </motion.section>

      {/* Products Section with Scroll Reveal */}
      <motion.section 
        className="py-24 bg-white"
        variants={scrollRevealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            variants={scrollRevealVariants}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-6">
              Hot Selling Products
            </h2>
            <div className="w-24 h-1 bg-emerald-600 mx-auto mb-6 rounded-full" />
            <p className="text-xl text-gray-600">
              Discover our most popular and fast selling clothing pieces.
            </p>
          </motion.div>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className="bg-gray-200 animate-pulse rounded-2xl h-96"
                />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredProducts.slice(0, 3).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          
          <motion.div
            variants={scrollRevealVariants}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/products"
                className="inline-flex items-center space-x-2 bg-navy-800 hover:bg-navy-900 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-200 shadow-lg"
              >
                <span>View All Products</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section with Scroll Reveal */}
      <motion.section 
        className="py-24 bg-navy-900 relative overflow-hidden"
        variants={scrollRevealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {/* Background Effects */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-20 left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative" ref={statsRef}>
          <motion.div
            variants={scrollRevealVariants}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Trusted by Fashion Lovers
            </h2>
            <div className="w-24 h-1 bg-emerald-400 mx-auto mb-6 rounded-full" />
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Numbers that speak for themselves. Join our satisfied customers who love SKATIOUS.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={scrollRevealVariants}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                className="text-center bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="text-4xl font-bold text-emerald-400 mb-2">
                  <CountUp end={stat.value} start={statsInView} duration={3.5} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{stat.label}</h3>
                <p className="text-gray-400">{stat.description}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Quality Certificates ── */}
          <motion.div
            variants={scrollRevealVariants}
            className="mt-16"
          >
            <div className="text-center mb-10">
              <h3 className="text-2xl font-bold text-white mb-3">Certified Quality You Can Trust</h3>
              <div className="w-16 h-0.5 bg-emerald-400 mx-auto rounded-full" />
              <p className="text-gray-400 mt-3 text-base">Our fabrics are independently tested and certified.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {[
                { img: cert1Img, title: 'Intertek Test Report', subtitle: 'BHS Standard · Lab No. 2004/050', badge: 'Tested' },
                { img: cert2Img, title: 'OEKO-TEX® Standard 100', subtitle: 'Certificate valid until 31.05.2028', badge: 'Certified' },
              ].map((cert, i) => (
                <motion.div
                  key={i}
                  variants={scrollRevealVariants}
                  transition={{ delay: i * 0.15 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  onClick={() => setCertModal(cert.img)}
                  className="relative cursor-pointer rounded-2xl overflow-hidden group"
                  style={{
                    boxShadow: '0 0 0 1px rgba(16,185,129,0.2), 0 0 30px rgba(16,185,129,0.08), 0 20px 40px rgba(0,0,0,0.4)',
                  }}
                >
                  {/* Cert image thumbnail */}
                  <div className="bg-white/5 backdrop-blur-sm">
                    <img
                      src={cert.img}
                      alt={cert.title}
                      className="w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      style={{ height: '200px' }}
                    />
                  </div>

                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Verified badge top-right */}
                  <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg shadow-emerald-900/50 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    {cert.badge}
                  </div>

                  {/* Text info bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-semibold text-sm">{cert.title}</p>
                    <p className="text-gray-300 text-xs mt-0.5">{cert.subtitle}</p>
                  </div>

                  {/* Click hint */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-white text-xs font-medium border border-white/20">
                      Click to view
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Certificate Lightbox Modal */}
      {certModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setCertModal(null)}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <img src={certModal} alt="Certificate" className="w-full h-auto block" />
            <button
              onClick={() => setCertModal(null)}
              className="absolute top-4 right-4 w-9 h-9 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors text-lg font-bold"
            >
              ×
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Testimonials Section with Scroll Reveal */}
      <motion.section 
        className="py-24 bg-gray-50"
        variants={scrollRevealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            variants={scrollRevealVariants}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-6">
              What Our Customers Say
            </h2>
            <div className="w-24 h-1 bg-emerald-600 mx-auto mb-6 rounded-full" />
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it. Here's what fashion lovers are saying about SKATIOUS.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={scrollRevealVariants}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -12, transition: { duration: 0.3 } }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 relative"
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-emerald-600 rounded-xl shadow-lg flex items-center justify-center">
                  <Quote className="h-6 w-6 text-white" />
                </div>

                <div className="flex items-center mb-4 ml-8">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center">
                  <div>
                    <h4 className="font-semibold text-navy-900">{testimonial.name}</h4>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Newsletter Section with Scroll Reveal */}
      <motion.section 
        className="py-24 bg-gradient-to-r from-emerald-600 to-emerald-700 relative overflow-hidden"
        variants={scrollRevealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {/* Background Effects */}
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"
        />
        <motion.div
          animate={{
            rotate: -360,
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"
        />

        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <motion.div variants={scrollRevealVariants}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Stay in the Loop
            </h2>
            <p className="text-emerald-100 text-xl mb-12 max-w-2xl mx-auto">
              Get the latest updates on new collections, exclusive deals, and style tips directly to your inbox.
            </p>
            
            <motion.form
              variants={scrollRevealVariants}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
            >
              <motion.input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-2xl border-2 border-emerald-400/30 focus:ring-4 focus:ring-white/20 focus:border-white bg-white/10 backdrop-blur-sm text-white placeholder-emerald-200 text-lg"
                whileFocus={{ scale: 1.02 }}
              />
              <motion.button
                type="submit"
                className="bg-white text-emerald-600 px-8 py-4 rounded-2xl font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Subscribe
              </motion.button>
            </motion.form>
          </motion.div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
}