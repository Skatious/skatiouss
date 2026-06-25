import React, { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { ArrowRight, MessageCircle, CheckCircle } from 'lucide-react'

// Quality images
import qualityImg1 from '../../assets/jersey-quality/quality1.jpeg'
import qualityImg2 from '../../assets/jersey-quality/quality2.jpeg'
import qualityImg3 from '../../assets/jersey-quality/quality3.jpeg'


// Design images
import design01 from '../../assets/blog_section/our_designs/custom-design-01.jpeg'
import design02 from '../../assets/blog_section/our_designs/custom-design-02.jpeg'
import design03 from '../../assets/blog_section/our_designs/custom-design-03.jpeg'
import design04 from '../../assets/blog_section/our_designs/custom-design-04.jpeg'
import design05 from '../../assets/blog_section/our_designs/custom-design-05.jpeg'
import design06 from '../../assets/blog_section/our_designs/custom-design-06.jpeg'
import design07 from '../../assets/blog_section/our_designs/custom-design-07.jpeg'
import design08 from '../../assets/blog_section/our_designs/custom-design-08.jpeg'
import design09 from '../../assets/blog_section/our_designs/custom-design-09.jpeg'
import design10 from '../../assets/blog_section/our_designs/custom-design-10.jpeg'
import design11 from '../../assets/blog_section/our_designs/custom-design-11.jpeg'

// Academy images
import academyBadowala from '../../assets/academies/badowala-fc.jpeg'
import academyFalcons from '../../assets/academies/falcons-fc.jpeg'
import academyFastbreak from '../../assets/academies/fastbreak-fa.jpeg'
import academyGladiator from '../../assets/academies/gladiator-fc.jpeg'
import academyIndusliga from '../../assets/academies/indusliga-fa.jpeg'
import academyManipur from '../../assets/academies/manipur-united-fa.jpeg'
import academyMustang from '../../assets/academies/mustang-fc.jpeg'

const academies = [
  { name: 'Hindustan FA', image: null },
  { name: 'Fastbreak FA', image: academyFastbreak },
  { name: 'Mustang FC', image: academyMustang },
  { name: 'Badowala FC', image: academyBadowala },
  { name: 'Indusliga FA', image: academyIndusliga },
  { name: 'Gladiator FC', image: academyGladiator },
  { name: 'Falcons FC', image: academyFalcons },
  { name: 'Manipur United FA', image: academyManipur },
]

const designs = [
  { id: 1, name: 'The Obsidian Drop', image: design01, description: 'All-black stealth silhouette. Built for teams that command the night.' },
  { id: 2, name: 'Neon Striker', image: design02, description: 'Electric accents. Maximum visibility. Zero compromise.' },
  { id: 3, name: 'Crimson Eclipse', image: design03, description: "Deep red power. The kit worn by those who don't lose." },
  { id: 4, name: 'Azure Wave', image: design04, description: 'Dynamic flow lines for teams that never stop pressing.' },
  { id: 5, name: 'Phantom Thread', image: design05, description: 'Barely there. Everywhere at once.' },
  { id: 6, name: 'Golden Era', image: design06, description: 'Championship energy. Classic craft. Modern precision.' },
  { id: 7, name: 'Arctic Ghost', image: design07, description: 'Ice-cool composure on the pitch. Unmistakable on sight.' },
  { id: 8, name: 'Urban Edge', image: design08, description: 'Where streetwear grit meets match-day performance.' },
  { id: 9, name: 'Midnight Run', image: design09, description: 'Dark navy dominance. For teams who own the second half.' },
  { id: 10, name: 'Emerald Rush', image: design10, description: 'Speed embodied in colour. Push past your limits.' },
  { id: 11, name: 'Solar Flare', image: design11, description: 'Strike like the sun. Be impossible to ignore.' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

// Academy Grid — full-bleed editorial photo cards
function AcademyGrid() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {academies.map((academy, i) => (
          <motion.div
            key={academy.name}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            className="group relative aspect-[3/4] overflow-hidden bg-white/5"
          >
            {academy.image ? (
              <>
                <img
                  src={academy.image}
                  alt={academy.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                {/* Always-visible gradient + name */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-heading font-semibold text-sm md:text-base tracking-wide leading-tight">
                    {academy.name}
                  </p>
                </div>
              </>
            ) : (
              /* Typographic fallback for Hindustan FA */
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/8 border border-white/15 p-4 text-center">
                <span className="text-white/20 text-5xl font-display font-bold leading-none mb-3">
                  {academy.name.charAt(0)}
                </span>
                <span className="text-white font-heading font-semibold text-sm tracking-wide leading-tight">
                  {academy.name}
                </span>
                <span className="text-white/30 text-[10px] tracking-widest uppercase mt-1 font-medium">
                  Partner
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function CustomJerseysPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  // Detect mobile — disable parallax on small screens to save perf
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check, { passive: true })
    return () => window.removeEventListener('resize', check)
  }, [])

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  // On mobile or reduced motion: no parallax Y shift, just fade out gently
  const heroY = useTransform(scrollYProgress, [0, 1], isMobile || shouldReduceMotion ? ['0%', '0%'] : ['0%', '15%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, shouldReduceMotion ? 1 : 0])

  return (
    <div className="min-h-screen bg-white">
      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative min-h-[90vh] bg-black overflow-hidden flex items-center">
        {/* Background grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24"
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.span
              variants={fadeUp}
              className="inline-block text-xs font-semibold tracking-[0.3em] text-white/40 uppercase mb-6"
            >
              Skatious Bespoke Studio
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="font-display text-[clamp(3rem,10vw,8rem)] font-bold text-white leading-[0.9] tracking-tighter mb-8"
            >
              Your Jersey.<br />
              <span className="text-white/20">Our Craft.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="max-w-xl text-white/50 text-lg md:text-xl font-light leading-relaxed mb-10"
            >
              We design and manufacture custom match jerseys for academies, clubs, and teams that refuse to settle. Built to perform. Made to last. Designed to turn heads.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <a
                href="#gallery"
                className="inline-flex items-center gap-2 bg-white text-black px-7 py-4 text-sm font-semibold tracking-widest uppercase hover:bg-white/90 transition-colors"
              >
                See Our Work
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#inquire"
                className="inline-flex items-center gap-2 border border-white/20 text-white px-7 py-4 text-sm font-semibold tracking-widest uppercase hover:border-white/50 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Get a Quote
              </a>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 right-8 z-10 flex flex-col items-center gap-2"
        >
          <span className="text-white/20 text-[10px] tracking-widest uppercase rotate-90 origin-center">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/30 to-transparent" />
        </motion.div>
      </section>


      {/* ─── STAT STRIP ─── */}
      <section className="bg-black border-t border-white/5">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 border-b border-white/5"
        >
          {[
            { stat: '150+', label: 'Academy Partners' },
            { stat: '8+', label: 'States Served' },
            { stat: '100%', label: 'Custom Made' },
            { stat: '11', label: 'Signature Designs' },
          ].map((item) => (
            <motion.div key={item.stat} variants={fadeUp} className="text-center md:text-left">
              <p className="font-display text-4xl md:text-5xl font-bold text-white mb-1">{item.stat}</p>
              <p className="text-white/30 text-xs tracking-widest uppercase font-medium">{item.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── TRUST / ACADEMIES ─── */}
      <section className="bg-black py-24 overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12"
        >
          <motion.p variants={fadeUp} className="text-xs tracking-[0.3em] text-white/30 uppercase mb-4 text-center">
            Our Partners
          </motion.p>
          <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-5xl font-bold text-white text-center tracking-tight mb-4">
            Trusted by elite academies
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/40 text-center max-w-2xl mx-auto font-light leading-relaxed">
            From Hindustan FA to Manipur United, we kit out academies that take their game seriously. Over 150 clubs across India rely on Skatious for custom jerseys built for the modern game.
          </motion.p>
        </motion.div>

        <AcademyGrid />
      </section>

      {/* ─── QUALITY / CRAFT ─── */}
      <section className="bg-white py-28 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* 
              Image grid — swap these src values with real quality photos once added:
              assets/blog_section/jersey-quality-01.jpeg
              assets/blog_section/jersey-quality-02.jpeg
              assets/blog_section/jersey-quality-03.jpeg
            */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-3"
            >
              {/* Large image — col-span 2 */}
              <div className="col-span-2 overflow-hidden bg-gray-100 relative">
                <img
                  src={qualityImg1}
                  alt="Skatious jersey quality — full sublimation print close-up"
                  className="w-full h-64 md:h-80 object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                  <span className="text-white text-[10px] font-semibold tracking-widest uppercase">Quality Certified</span>
                </div>
              </div>
              {/* Two detail shots */}
              <div className="overflow-hidden bg-gray-100">
                <img
                  src={qualityImg2}
                  alt="Skatious jersey — crest detail"
                  className="w-full h-40 md:h-52 object-cover hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
              <div className="overflow-hidden bg-gray-100">
                <img
                  src={qualityImg3}
                  alt="Skatious jersey — fabric and name printing detail"
                  className="w-full h-40 md:h-52 object-cover hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
            </motion.div>

            {/* Copy */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={stagger}
            >
              <motion.p variants={fadeUp} className="text-xs tracking-[0.3em] text-gray-400 uppercase mb-6">
                Our Craft
              </motion.p>
              <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl font-bold text-black leading-tight tracking-tight mb-8">
                Every stitch.<br /> Every pixel.<br /> Inspected.
              </motion.h2>
              <motion.p variants={fadeUp} className="text-gray-500 text-lg font-light leading-relaxed mb-6">
                A jersey is more than fabric — it's the first thing your opponents see when you walk onto the pitch. That's why we treat every single order as if it's our own kit.
              </motion.p>
              <motion.p variants={fadeUp} className="text-gray-500 text-lg font-light leading-relaxed mb-10">
                Our full-sublimation process locks colour deep into the fabric — not printed on top of it. No cracking, no peeling, no fading after 50 washes. Just sharp, vivid, match-ready quality from Day 1 to the final whistle of the season.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col gap-4">
                {[
                  { title: 'Colour-locked sublimation', desc: 'Prints embedded into fibre — not sitting on top of it. Stays sharp through every wash.' },
                  { title: 'Pre-dispatch QC check', desc: 'Every jersey is inspected before it leaves our studio. Wrong colour? Wrong size? It doesn\'t ship.' },
                  { title: 'Match-grade breathable mesh', desc: 'Lightweight, sweat-wicking fabric engineered for full 90-minute performance.' },
                  { title: 'Pixel-perfect crest printing', desc: 'Your badge, your identity. Reproduced with zero compromise on detail or resolution.' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 text-black mt-0.5" />
                    <div>
                      <p className="font-semibold text-black text-sm mb-0.5">{item.title}</p>
                      <p className="text-gray-500 text-sm font-light leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── ABOUT / WHY US ─── */}
      <section className="bg-white py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={stagger}
            >
              <motion.p variants={fadeUp} className="text-xs tracking-[0.3em] text-gray-400 uppercase mb-6">
                Why Skatious
              </motion.p>
              <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl font-bold text-black leading-tight tracking-tight mb-8">
                More than<br /> a kit. It's your<br /> identity.
              </motion.h2>
              <motion.p variants={fadeUp} className="text-gray-500 text-lg font-light leading-relaxed mb-6">
                Every design starts with a conversation. We don't hand you a template — we sit with your team's story, your colours, your energy, and translate that into a jersey that makes opponents take notice.
              </motion.p>
              <motion.p variants={fadeUp} className="text-gray-500 text-lg font-light leading-relaxed mb-10">
                Sublimation printing on breathable, match-grade fabric. Full front-to-back custom graphics. Names, numbers, crests — down to the last stitch.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col gap-3">
                {[
                  'Full sublimation printing — no limits on colour or design',
                  'Match-grade breathable fabric, built for Indian summers',
                  'Names, numbers, crests and sponsor placements',
                  'Minimum order flexibility for clubs of all sizes',
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-black" />
                    <p className="text-gray-600 text-sm font-light leading-relaxed">{point}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right side: 2x2 image grid preview */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-3"
            >
              {[design01, design04, design07, design10].map((img, i) => (
                <div key={i} className="aspect-[3/4] overflow-hidden bg-gray-100">
                  <img src={img} alt="Custom jersey design" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── GALLERY ─── */}
      <section id="gallery" className="bg-[#f8f8f6] py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="mb-16"
          >
            <motion.p variants={fadeUp} className="text-xs tracking-[0.3em] text-gray-400 uppercase mb-4">
              Recent Works
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl font-bold text-black tracking-tight">
              Our Signature Drops
            </motion.h2>
          </motion.div>

          {/* Mobile: 2 cols, Desktop: 3 cols masonry */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.05 }}
            className="columns-2 lg:columns-3 gap-3 md:gap-5"
          >
            {designs.map((design) => (
              <motion.div
                key={design.id}
                variants={fadeUp}
                className="break-inside-avoid group mb-3 md:mb-5"
              >
                {/* Image */}
                <div className="overflow-hidden bg-gray-200 relative">
                  <img
                    src={design.image}
                    alt={design.name}
                    className="w-full h-auto object-cover block transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Caption */}
                <div className="pt-3 pb-1 px-1">
                  <h3 className="font-heading text-sm md:text-base font-semibold text-black leading-snug">
                    {design.name}
                  </h3>
                  <p className="font-body text-[11px] md:text-xs text-gray-400 font-light mt-1 leading-relaxed">
                    {design.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section id="inquire" className="bg-black py-28 md:py-36">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.p variants={fadeUp} className="text-xs tracking-[0.3em] text-white/30 uppercase mb-6">
              Start a Project
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-6xl font-bold text-white tracking-tight mb-6 leading-tight">
              Your team deserves<br /> a kit worth wearing.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/40 text-lg font-light mb-12 max-w-xl mx-auto leading-relaxed">
              Share your vision — colours, crest, deadline. We'll handle the rest. Trusted by 150+ academies across India.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/918069xxxxxx"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-4 text-sm font-semibold tracking-widest uppercase hover:bg-white/90 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Us
              </a>
              <a
                href="mailto:custom@skatious.com"
                className="inline-flex items-center justify-center gap-2 border border-white/20 text-white px-8 py-4 text-sm font-semibold tracking-widest uppercase hover:border-white/50 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                Email Inquiry
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Marquee animation keyframe */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
