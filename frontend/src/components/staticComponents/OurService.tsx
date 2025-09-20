import React from 'react';
import { Check, Star, RotateCcw, Share2, TrendingUp, Users, DollarSign } from 'lucide-react';
import Header from '../Header';
import StickyCTABar from '../StickyCTABar';
import Footer from '../Footer';
import ServiceCard from '../ServiceCard';
import ProjectTable from '../ProjectTable';
import StartupEvaluationGrid from './LandingPage';
import CaseStudyCard from '../CaseStudyCard';

export default function OurService() {
    const servicesData = [
        {
            icon: "https://api.builder.io/api/v1/image/assets/TEMP/8ce8ef7ef8c4e0cabe8d01e9fdb2d1ccc5d95062?placeholderIfAbsent=true",
            title: "Full Stack Advisory",
            description: "You build, we take care of the rest until the end."
        },
        {
            icon: "https://api.builder.io/api/v1/image/assets/TEMP/07aec0b2d4b918e6cf8f8693d05dd64ddf9021ac?placeholderIfAbsent=true",
            title: "VC Funding",
            description: "Get funded by investors who fuel real growth."
        },
        {
            icon: "https://api.builder.io/api/v1/image/assets/TEMP/379ff523d56d512107ce8b080603ef92ecb938de?placeholderIfAbsent=true",
            title: "Marketing",
            description: "We build narratives and communities that last."
        },
        {
            icon: "https://api.builder.io/api/v1/image/assets/TEMP/d39452372f8ded7c2fd8ba119ddad5acb8b1ff3d?placeholderIfAbsent=true",
            title: "Liquidity/OTC",
            description: "Stay liquid, tradeable, and secure from day one."
        }
    ];
    const caseStudiesData = [
        {
            title: "RWA vs. DeFi vs. DePIN vs. AI: Who's Winning the 2025 VC Funding War?",
            description: "The first half of 2025 marked a pivotal period for crypto venture capital, demonstrating a discernible rebound in total funding that collectively surpassed the total funding figures for the entirety of 2024.",
            category: "Market Analysis",
            image: "https://api.builder.io/api/v1/image/assets/TEMP/635f795a41e7888f3faced2e318107315cec1614?placeholderIfAbsent=true"
        },
        {
            title: "Why 70% Public Companies, Michael Saylor's Strategy, and Holding $67 Billion of BTC",
            description: "An in-depth analysis of corporate Bitcoin adoption strategies and Michael Saylor's approach to holding $67 billion in BTC reserves.",
            category: "Bitcoin Strategy",
            image: "https://api.builder.io/api/v1/image/assets/TEMP/db2a5a72c9699d26dddbba5248a2f725a6452ea6?placeholderIfAbsent=true"
        },
        {
            title: "How 4 Crypto Narratives Fueled a $13 Billion Dollar Fundraising Resurgence in 2024",
            description: "Exploring the four key crypto narratives that drove a massive $13 billion fundraising resurgence throughout 2024.",
            category: "Crypto Trends",
            image: "https://api.builder.io/api/v1/image/assets/TEMP/a2e55bec0ca00b57ad8940c86cf6c1d6e9e16893?placeholderIfAbsent=true"
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


                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                                    Supporting{' '}
                                    <span className="text-blue-500">Startups </span>
                                      with Tools for{' '}
                                    <span className="text-orange-500">Growth </span>& {" "}
                                    <span className="text-orange-500">Sustainability</span>
                               
                                </h2>
                                {/* <h3 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                Be the first.
              </h3> */}

                                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                                    Our mission is to help CEOs get their startups capital-ready and meet the
                                    right VCs at the right time.
                                </p>

                                <button className="bg-[rgb(44,145,213)] hover:bg-[rgb(30,120,180)] text-white font-semibold px-8 py-3 rounded-full text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                                    Join Now
                                </button>
                            </div>

                            {/* Right Investment Card */}
                            <div className="flex-1 max-w-md w-full">
                                <img src='public/handshake.png' alt='Handshake' className='w-full h-auto rounded-lg shadow-xl' />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <StartupEvaluationGrid />
              <section id="case-studies" className="w-full pt-12 pb-6">
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
            
            <div className="flex justify-center">
              <button 
                // onClick={handleViewAllCaseStudies}
                className="px-12 py-3 text-base text-[#2c91d5] border border-[#2C91D5] rounded-full hover:bg-[#2c91d5] hover:text-white transition-all duration-200"
              >
                View More
              </button>
            </div>
          </div>
        </section>
            <Footer />
            <StickyCTABar />
        </div>
    );
}