import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

// Card background images
import BlogImg from '../../assets/blog_section/blog_card.jpeg'
import ReplicaImg from '../../assets/blog_section/replica_card.png'
import BlueLockImg from '../../assets/blog_section/bluelock_card.png'

const exploreItems = [
  {
    title: 'Custom Designs',
    description: 'Bespoke athletic wear tailored to your team. Experience high-fashion design meeting elite performance.',
    image: BlogImg,
    link: '/custom-jerseys',
    ctaText: 'View Gallery',
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
    ctaText: 'Explore Collection',
  },
]

const sectionVariants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: i * 0.15,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
}

export default function ExploreSection() {
  return (
    <section className="py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-24"
        >
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium text-black mb-8 tracking-tight">
            Explore Collection
          </h2>
          <p className="font-body text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed font-light">
            From the latest stories to exclusive merchandise drops — discover everything we have to offer.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 lg:gap-y-0">
          {exploreItems.map((item, index) => (
            <motion.div
              key={item.title}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="group flex flex-col"
            >
              <Link to={item.link} className="block w-full h-full cursor-pointer flex flex-col">
                <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-50 mb-6">
                  {/* Background Image */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Subtle overlay on hover for premium feel without darkening */}
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/5" />
                </div>

                {/* Content Area */}
                <div className="flex flex-col flex-1">
                  <h3 className="font-heading text-2xl font-medium text-black mb-3 group-hover:opacity-70 transition-opacity duration-300">
                    {item.title}
                  </h3>
                  <p className="font-body text-gray-500 text-sm leading-relaxed mb-6 font-light">
                    {item.description}
                  </p>

                  {/* Minimalist CTA */}
                  <div className="mt-auto flex items-center gap-2 text-black font-medium text-xs tracking-widest uppercase">
                    <span className="relative overflow-hidden group-hover:underline underline-offset-4 decoration-1">
                      {item.ctaText}
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-out group-hover:translate-x-2" />
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
