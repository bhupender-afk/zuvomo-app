import React from 'react';
import { Check, Star, RotateCcw, Share2, TrendingUp, Users, DollarSign } from 'lucide-react';
import Header from '../Header';
import StickyCTABar from '../StickyCTABar';
import Footer from '../Footer';
import ServiceCard from '../ServiceCard';
import ProjectTable from '../ProjectTable';
import FAQ from '../FAQ';
import { StartupRegisterBanner } from './LandingPage';
import { handleJoinNow } from '@/utils/url';

export default function Startup() {
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
                  Build smarter,{' '}
                  <span className="text-orange-500">fund faster,</span>
                  {' '}and grow louder.
                </h2>
                {/* <h3 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                Be the first.
              </h3> */}

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

      <section className="w-full py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-[32px] md:text-[36px] font-bold text-center text-[#1d1d1d] mb-8 font-inter leading-tight">
            Successful Project Launches
          </h2>

          <ProjectTable />

          {/* Smart Services Section */}
          {/* <h2 id="services" className="text-[32px] md:text-[36px] font-bold text-center text-[#1d1d1d] mt-16 mb-10 font-inter leading-tight">
              Smart Services for Startup Success
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {servicesData.map((service, index) => (
                <ServiceCard key={index} {...service} />
              ))}
            </div> */}
        </div>
      </section>
      <StartupRegisterBanner />
      <section className="w-full bg-white  pb-12">
        <div className="container mx-auto px-4">
          <FAQ />
        </div>
      </section>


      <Footer />
      <StickyCTABar />
    </div>
  );
}