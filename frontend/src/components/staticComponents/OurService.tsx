import React from 'react';
import { Check, Star, RotateCcw, Share2, TrendingUp, Users, DollarSign } from 'lucide-react';
import Header from '../Header';
import StickyCTABar from '../StickyCTABar';
import Footer from '../Footer';
import ServiceCard from '../ServiceCard';
import ProjectTable from '../ProjectTable';
import StartupEvaluationGrid from './LandingPage';
import CaseStudyCard from '../CaseStudyCard';
import { handleJoinNow, staticData } from '@/utils/url';

export default function OurService() {
   
    const caseStudiesData = [
        {
            title: "RWA vs. DeFi vs. DePIN vs. AI: Who's Winning the 2025 VC Funding War?",
            description: "The first half of 2025 marked a pivotal period for crypto venture capital, demonstrating a discernible rebound in total funding that collectively surpassed the total funding figures for the entirety of 2024.",
            category: "Market Analysis",
            image: "https://api.builder.io/api/v1/image/assets/TEMP/635f795a41e7888f3faced2e318107315cec1614?placeholderIfAbsent=true",
            slug: "rwa-defi-depin-ai-2025-vc-funding-war"
        },
        {
            title: "Why 70% Public Companies, Michael Saylor's Strategy, and Holding $67 Billion of BTC",
            description: "An in-depth analysis of corporate Bitcoin adoption strategies and Michael Saylor's approach to holding $67 billion in BTC reserves.",
            category: "Bitcoin Strategy",
            image: "https://api.builder.io/api/v1/image/assets/TEMP/db2a5a72c9699d26dddbba5248a2f725a6452ea6?placeholderIfAbsent=true",
            slug: "michael-saylor-bitcoin-strategy-67-billion"
        },
        {
            title: "How 4 Crypto Narratives Fueled a $13 Billion Dollar Fundraising Resurgence in 2024",
            description: "Exploring the four key crypto narratives that drove a massive $13 billion fundraising resurgence throughout 2024.",
            category: "Crypto Trends",
            image: "https://api.builder.io/api/v1/image/assets/TEMP/a2e55bec0ca00b57ad8940c86cf6c1d6e9e16893?placeholderIfAbsent=true",
            slug: "crypto-narratives-13-billion-fundraising-2024"
        }
    ];

    return (
        <div className="bg-white overflow-x-hidden">
            <Header />
            <div className="p-6 md:p-12" style={{
                backgroundImage: `url('/Bg.png')`, backgroundPosition: 'left center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat'
            }}>
                <div className="max-w-7xl mx-auto">
                    <div className="rounded-lg p-6 md:p-12">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                            {/* Left Content */}
                        <div className="flex-1 max-w-2xl">


                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8">
                                    Empowering{' '}
                                    <span className="text-orange-500">Web3 startups </span>
                                      with strategy, visibility, and 
                                    <span className="text-orange-500"> {" "}long-term growth. </span>
                               
                                </h2>
                               

                                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                                    Our mission is to help CEOs get their startups capital-ready and meet the
                                    right VCs at the right time.
                                </p>

                                <button onClick={handleJoinNow} className="bg-[rgb(44,145,213)] hover:bg-[rgb(30,120,180)] text-white font-semibold px-8 py-3 rounded-full text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                                    JOIN NOW
                                </button>
                            </div>

                            {/* Right Investment Card */}
                            <div className="flex-1 max-w-md w-full">
                                <img src='/handshake.png' alt='Handshake' className='w-full h-auto rounded-lg shadow-xl' />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
              <section className="w-full py-12 pt-0">
          <div className="container mx-auto px-4">
             <div className="mt-16">
              <h2 id="services" className="text-[32px] md:text-[36px] font-bold text-center text-[#1d1d1d] mb-8 font-inter leading-tight">
                Forger: Where Web3 Success is Shaped
              </h2>
              {/* <h2  
              className="text-[24px] md:text-[30px] text-center mb-8 font-inter leading-tight font-normal text-black-100/20  max-w-7xl mx-auto"
              >
                We forge your token, story, and strategy into a foundation that attracts investors, ignites communities, and sustains long term growth. Explore our core services — Advisory, Funding, Marketing, and Liquidity — built to fuel every phase of your journey.
              </h2> */}
              
            
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 mb-8 mt-12">
                <div className="w-full lg:w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
                    {staticData.forgeContent.map((service, index) => (
                      <ServiceCard key={index} {...service} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            </div>
        </section>
         <div className="p-6 md:p-12" style={{
                backgroundImage: `url('/Bg.png')`, backgroundPosition: 'left center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat'
            }}>
                <div className="max-w-7xl mx-auto">
                    <div className="rounded-lg p-6 md:p-12">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                            {/* Left Content */}
                        <div className="flex-1 max-w-2xl">


                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8">
                                    Empowering{' '}
                                    <span className="text-orange-500">Web3 startups </span>
                                      with strategy, visibility, and 
                                    <span className="text-orange-500"> {" "}long-term growth. </span>
                               
                                </h2>
                               

                                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                                    Our mission is to help CEOs get their startups capital-ready and meet the
                                    right VCs at the right time.
                                </p>

                                <button onClick={handleJoinNow} className="bg-[rgb(44,145,213)] hover:bg-[rgb(30,120,180)] text-white font-semibold px-8 py-3 rounded-full text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                                    JOIN NOW
                                </button>
                            </div>

                            {/* Right Investment Card */}
                            <div className="flex-1 max-w-md w-full">
                                <img src='/handshake.png' alt='Handshake' className='w-full h-auto rounded-lg shadow-xl' />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Services Section */}
             
            {/* <StartupEvaluationGrid /> */}
              {/* <section id="case-studies" className="w-full pt-12 pb-6">
          <div className="container mx-auto px-4">
            <h2 className="text-[32px] md:text-[36px] font-bold text-center text-[#1d1d1d] mb-4 font-inter leading-tight">
              Case Studies
            </h2>
            
            <p className="text-[16px] text-[#6b7280] text-center max-w-3xl mx-auto mb-8 font-inter leading-relaxed">
              We have helped 100+ startups secure over $800 Million in investments. Read these case studies to discover our growth and funding strategies.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {caseStudiesData.map((caseStudy, index) => (
                <CaseStudyCard key={index} {...caseStudy} />
              ))}
            </div>
            
          </div>
        </section> */}  
            <Footer />
            <StickyCTABar />
        </div>
    );
}