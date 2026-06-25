import React from 'react'
import { Link } from 'react-router-dom'
import { motion, easeInOut } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

// Card background images
import BlogImg from '../../assets/blog_section/blog_card.png'
import ReplicaImg from '../../assets/blog_section/replica_card.png'
import BlueLockImg from '../../assets/blog_section/bluelock_card.png'

const exploreItems = [
  {
    title: 'Blog',
    description: 'Stories, trends, and the culture behind the game. Dive into the world of sports fashion.',
    image: BlogImg,
    link: '#',
    ctaText: 'Coming Soon',
  },
  {
    title: 'Replica',
    description: 'Premium replica jerseys crafted with precision. Wear the pride of your favourite club.',
    image: ReplicaImg,
    link: '/products',
    ctaText: 'Shop Now',
  },
  {
    title: 'Blue Lock',
    description: 'Exclusive Blue Lock collection. Unleash the striker within — limited edition, bold designs.',
    image: BlueLockImg,
    link: '/blue-lock',
    ctaText: 'Explore',
  },
]

const sectionVariants = {
  hidden: {
    opacity: 0,
    y: 75,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: easeInOut,
    },
  },
}

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 60,
    scale: 0.95,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: i * 0.15,
      ease: easeInOut,
    },
  }),
}

export default function ExploreSection() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Heading */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-6">
            Explore Our Universe
          </h2>
          <div className="w-24 h-1 bg-emerald-600 mx-auto mb-6 rounded-full" />
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From the latest stories to exclusive collections — discover everything SKATIOUS has to offer.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {exploreItems.map((item, index) => (
            <motion.div
              key={item.title}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{
                y: -10,
                transition: { duration: 0.3, ease: 'easeOut' },
              }}
              className="group"
            >
              <Link to={item.link} className="block h-full">
                <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-300 h-full flex flex-col">
                  {/* Image Area */}
                  <div className="relative h-52 sm:h-56 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Subtle bottom gradient for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  </div>

                  {/* Content Area */}
                  <div className="p-6 sm:p-7 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-navy-900 mb-2 group-hover:text-emerald-700 transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-5 flex-1 text-sm">
                      {item.description}
                    </p>

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm group-hover:text-emerald-700 transition-colors duration-300">
                      <span>{item.ctaText}</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
