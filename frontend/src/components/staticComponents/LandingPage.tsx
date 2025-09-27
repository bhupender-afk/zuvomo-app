import React from 'react';
import { TrendingUp, Users, DollarSign, Star, Share2, Eye, User, Rocket, ArrowRight } from 'lucide-react';
import AnimatedCounter from '../AnimatedCounter';
import { motion } from 'framer-motion';
import TeamMember from '../TeamMember';
import Carousel from '@/components/Carousel';
import { handleJoinNow } from '@/utils/url';



export function ExclusiveDealsComponent() {
  return (
    <div className="bg-blue-50 p-6 md:p-12" style={{ backgroundImage: `url('/Bg.png')`,      backgroundPosition: 'left center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat'}}>
      <div className="max-w-7xl mx-auto">
        <div className="rounded-lg p-6 md:p-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left Content */}
            <div className="flex-1 max-w-2xl">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8">
                <span className='text-orange-500'>Unlock {" "}</span>
                 exclusive{' '}
                <span className="text-orange-500">1%</span>
                {' '}token{" "}<span className="text-orange-500">deals.{" "}</span> 
                 Be the first.
              </h2>
              
              
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Meet passionate founders building protocols, DAOs, DeFi apps, RWAs, and Layer 1,2 solutions where every project is vetted, tokenomics reviewed, and graded by domain experts.
              </p>
              
              <button onClick={handleJoinNow} className="bg-[rgb(44,145,213)] hover:bg-[rgb(30,120,180)] text-white font-semibold px-8 py-3 rounded-full text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                JOIN NOW
              </button>
            </div>
            
            {/* Right Investment Card - Screenshot Image */}
            <div className="flex-1 max-w-md w-full">
              <img
                src="/investor-screenshot.png"
                alt="Investment Dashboard Screenshot"
                className="w-full h-auto rounded-lg shadow-xl"
                onError={(e) => {
                  // Fallback to placeholder if screenshot not found
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



// Startup Register Banner Component
export function StartupRegisterBanner() {
  return (
    <div className="relative bg-gradient-to-r from-[rgb(44,145,213)] to-[rgb(44,120,180)] py-8 md:py-12 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}></div>
      </div>
      
      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          <h2 className="text-white text-2xl md:text-3xl lg:text-4xl font-bold">
            Register As A Startup
          </h2>
          
          <button onClick={handleJoinNow} className="bg-white hover:bg-gray-100 text-[rgb(44,145,213)] font-semibold px-8 py-3 rounded-full text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 whitespace-nowrap">
           JOIN NOW
          </button>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute -left-4 -top-4 w-24 h-24 bg-white opacity-5 rounded-full"></div>
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white opacity-5 rounded-full"></div>
      <div className="absolute left-1/4 -top-2 w-16 h-16 bg-white opacity-5 rounded-full"></div>
      <div className="absolute right-1/3 -bottom-4 w-20 h-20 bg-white opacity-5 rounded-full"></div>
    </div>
  );
}



// Four Step Journey Component
export function FourStepJourney() {
  const steps = [
    {
      icon: User,
      title: "1. Join",
      description: "Get instant access to funding networks, playbooks, and Web3 experts ready to back your vision."
    },
    {
      icon: Rocket,
      title: "2. Evaluate",
      description: "Receive a startup scorecard and tokenomics check to identify gaps and growth opportunities."
    },
    {
      icon: Users,
      title: "3. Connect",
      description: "Tap into our network of 1000 plus VCs, KOLs, and mentors to secure funding and partnerships."
    },
    {
      icon: TrendingUp,
      title: "4. Scale",
      description: "Plot your growth roadmap, design liquidity strategies, and align with the future of Web3."
    }
  ];

  return (
    <div className="bg-gray-50 py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Kick Start Your Journey In 4 Steps
          </h2>
        </div>
        
        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-12">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="text-center group">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-[#2F3A63] rounded-full mb-6 group-hover:bg-[#2F3A63] transition-colors duration-200 shadow-lg group-hover:shadow-xl">
                  <IconComponent className="w-10 h-10 md:w-12 md:h-12 text-white" />
                </div>
                
                {/* Title */}
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                  {step.title}
                </h3>
                
                {/* Description */}
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  {step.description}
                </p>
                
                {/* Step Number */}
                {/* <div className="mt-4 text-blue-500 font-bold text-lg">
                  Step {index + 1}
                </div> */}
              </div>
            );
          })}
        </div>
        
        {/* CTA Button */}
        <div className="text-center">
          <button className="bg-[rgb(44,145,213)] hover:bg-[rgb(30,120,180)] text-white font-semibold px-10 py-4 rounded-full text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            JOIN NOW
          </button>
        </div>
      </div>
    </div>
  );
}


export function CallToActionBanner() {
    return (
         <section className="relative w-full min-h-[372px] text-white text-center overflow-hidden">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/339241271433362ccd9c7387d7feb41fb9071adf?placeholderIfAbsent=true"
            className="absolute h-full w-full object-cover inset-0"
            alt="Background"
          />
          <div className="relative container mx-auto px-4 py-12">
            <h2 className="text-[32px] md:text-[36px] font-bold leading-tight max-w-3xl mx-auto mb-12 font-inter">
              We Work Around The Clock, So You Can Focus On Your Product
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4">
              {[
                { value: 800, suffix: "M+", prefix: "$", label: "raised by startups" },
                { value: 150, suffix: "+", prefix: "", label: "successful startup founders funded" },
                { value: 100, suffix: "+", prefix: "", label: "top-tier investors onboard" }
              ].map((stat, index) => (
                <motion.div 
                  key={index} 
                  className="relative"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <div className="text-center flex flex-col justify-center h-full min-h-[120px]">
                    <div className="text-4xl md:text-5xl font-bold mb-2">
                      <AnimatedCounter
                        end={stat.value}
                        suffix={stat.suffix}
                        prefix={stat.prefix}
                        duration={2.5}
                      />
                    </div>
                    <div className="text-[15px] italic font-light">
                      {stat.label}
                    </div>
                  </div>
                  {index < 2 && (
                    <motion.div 
                      className="hidden sm:block absolute right-0 top-0 bottom-0 flex items-center"
                      initial={{ opacity: 0, scaleY: 0 }}
                      whileInView={{ opacity: 1, scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                    >
                      <img 
                        src="/separator.png" 
                        alt="separator" 
                        className="h-full w-auto object-fill min-h-[100px]"
                      />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
    )
}

export function MeetTeam() {
      const teamData = [
    {
      name: "Nikhil Sethi",
      role: "Director",
      description: "Successfully crowdfunded 100+ startups. Ex Bajaj Allianz, BlaBlaCar.",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/7d0192e868781511256b405413a44ec3dd6bab77?placeholderIfAbsent=true",
      socialLinks: { linkedin: "https://www.linkedin.com/in/sethinik/", telegram: "https://t.me/nsethi" }
    },
    {
      name: "Sandeep Sorout",
      role: "Assistant Manager, Product",
      description: "Assistant Manager by title, Problem solver by nature.",
      image: 'Sandeep.png',
      socialLinks: { linkedin: "https://in.linkedin.com/in/sandeep-sorout-0159932233", telegram: "https://t.me/Sandeep_zuvomo" }
    },
    {
      name: "Rajat Thapa",
      role: "Content Analyst",
      description: "Digital storyteller with a Web3-first mindset",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/f9dad5498f2febd8444e5c9ccbf76e10cafba6d7?placeholderIfAbsent=true",
      socialLinks: { linkedin: "https://in.linkedin.com/in/rajat-thapa-655042181", telegram: "https://t.me/Rajat_zuvomo" }
    },
    {
      name: "Sarah Johnson",
      role: "Lead Developer",
      description: "Full-stack developer with 8+ years in blockchain and DeFi protocols.",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/7d0192e868781511256b405413a44ec3dd6bab77?placeholderIfAbsent=true",
      socialLinks: { linkedin: "#", telegram: "#" }
    },
    {
      name: "Michael Chen",
      role: "Investment Strategist",
      description: "Former Goldman Sachs analyst specializing in crypto investments and market analysis.",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/80e023fd16e317d90724e58651663bcfdb1d7c3a?placeholderIfAbsent=true",
      socialLinks: { linkedin: "#", telegram: "#" }
    },
    {
      name: "Emily Rodriguez",
      role: "Marketing Director",
      description: "Brand strategist who has scaled 50+ Web3 projects from idea to market leadership.",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/f9dad5498f2febd8444e5c9ccbf76e10cafba6d7?placeholderIfAbsent=true",
      socialLinks: { linkedin: "#", telegram: "#" }
    },
    {
      name: "David Kim",
      role: "Technical Advisor",
      description: "Blockchain architect with expertise in smart contracts and DeFi protocols.",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/7d0192e868781511256b405413a44ec3dd6bab77?placeholderIfAbsent=true",
      socialLinks: { linkedin: "#", telegram: "#" }
    },
    {
      name: "Lisa Wang",
      role: "Community Manager",
      description: "Community growth specialist who has built engaged communities for major crypto projects.",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/80e023fd16e317d90724e58651663bcfdb1d7c3a?placeholderIfAbsent=true",
      socialLinks: { linkedin: "#", telegram: "#" }
    }
  ];
    return(
         <section id="team" className="w-full py-12 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-[32px] md:text-[36px] font-bold text-center text-[#1d1d1d] mb-4 font-inter leading-tight">
              Meet Our Talented Team
            </h2>
            <p className="text-center text-[#6b7280] text-[16px] mb-12 max-w-2xl mx-auto font-inter leading-relaxed">
              Our experienced team combines expertise in blockchain, finance, and technology to drive innovation and success for startups worldwide.
            </p>
            
            {/* Mobile: Simple grid, Desktop: Carousel */}
            <div className="block lg:hidden">
              <div className="grid grid-cols-1 gap-6 max-w-sm mx-auto">
                {teamData.slice(0, 3).map((member, index) => (
                  <TeamMember key={index} {...member} />
                ))}
              </div>
            </div>
           
            
            <div className="hidden lg:block">
              <Carousel
                itemsPerView={3}
               gap={20}
                showArrows={true}
                showDots={true}
                autoPlay={true}
                autoPlayInterval={5000}
              >
                {teamData.slice(0, 3).map((member, index) => (
                  <div key={index} className="px-2">
                    <TeamMember {...member} />
                  </div>
                ))}
              </Carousel>
            </div>
          </div>
        </section>
    )
}

export default function StartupEvaluationGrid() {
  const cards = Array(8).fill({
    icon: Rocket,
    title: "Get your Startup Evaluated",
    description: "Lorem ipsum dolor sit amet, adipiscing elit. Quod corrupti laborum, quasi? Dolor sapiente amet optio harum dolores"
  });

  return (
    <div className="bg-white-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Grid Container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => {
            const IconComponent = card.icon;
            const isHighlighted = index === 1; // Second card (index 1) is highlighted
            
            return (
              <div key={index} className="relative">
               
                {/* Card */}
                <div className={`bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col 'border border-gray-200`}>
                  {/* Header with Icon and Title */}
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                      {card.title}
                    </h3>
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-grow">
                    {card.description}
                  </p>
                  
                  {/* Arrow Button */}
                  <div className="flex justify-start">
                    <button className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 group">
                      <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-800 transition-colors" />
                    </button>
                  </div>
                </div>
                
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}