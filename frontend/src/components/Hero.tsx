import React from 'react';

const Hero = () => {
  const handleSubmitStartup = () => {
    window.location.href = '/signup';
  };

  const handleRegisterVC = () => {
    window.location.href = '/signup';
  };

  return (
    <section 
      className="relative w-full h-[500px] md:h-[600px] overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('/Banner BG 03.png')`
      }}
    >
      <div className="relative h-full container mx-auto px-4 md:px-8 lg:px-12 xl:px-20">
        <div className="flex flex-col lg:flex-row items-center h-full">
          {/* Text Content - Left Side */}
          <div className="w-full lg:w-[60%] flex flex-col justify-center py-6 lg:py-0 text-center lg:text-left z-10 relative">
            {/* Tagline */}
            {/* <div className="flex items-center justify-center lg:justify-start gap-2 text-white mb-4">
              <span className="text-lg md:text-xl text-orange-500">•</span>
              <span className="text-xs md:text-sm uppercase tracking-wider">
                YOU BUILD. WE HANDLE WHAT COMES NEXT.
              </span>
            </div> */}
            
            {/* Main Heading - Single Line Layout */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-4 lg:mb-6 text-white max-w-4xl mx-auto lg:mx-0">
              
                <span className="text-[#F8673C]">Funding{",   "}</span>
                <span className="text-[#F8673C]">visibility</span> and
                <span className="text-[#F8673C]">{" "}world domination</span> for visionary 
                <span className="text-[#F8673C]">{" "}CEOs</span>
              {/* </div> */}
             
            </h1>
            
            {/* Description */}
            <div className="relative mb-6 lg:mb-8">
              <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-0.5 bg-white/30"></div>
              <div className="lg:pl-6 space-y-3 text-sm md:text-base text-white/90 leading-relaxed max-w-xl mx-auto lg:mx-0">
                <p className="hidden md:block">
                  Zuvomo supports handpicked Web3 startups through funding, token sales, and visibility. We take the journey with founders, combining AI insights, proven advisory, and data-backed execution to help them dominate with precision and confidence.
                </p>
                <p className="md:hidden">
                  Zuvomo supports handpicked Web3 startups through funding, token sales, and visibility. We take the journey with founders, combining AI insights, proven advisory, and data-backed execution to help them dominate with precision and confidence.
                </p>
                <p className="hidden lg:block">
                  Powered by AI and backed by an earned network of VCs, KOLs, and domain experts, we operate as veteran ambassadors of the crypto ecosystem. Over the past 8+ years, we have empowered strong teams led by passionate founders, raising over $800M across 100+ projects since 2017.
                </p>
                <p className="hidden md:block lg:hidden">
                  Over 8+ years, we've empowered founders, raising $800M+ across 100+ projects since 2017.
                </p>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 max-w-md mx-auto lg:mx-0">
              <button 
                onClick={handleSubmitStartup}
                className="bg-white text-[#2C91D5] px-6 py-3 rounded-full font-semibold text-sm hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-xl hover:bg-[#2C91D5] hover:text-white active:scale-95"
              >
                SUBMIT YOUR STARTUP
              </button>
              <button 
                onClick={handleRegisterVC}
                className="bg-[#2C91D5] text-white px-6 py-3 rounded-full font-semibold text-sm hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-[#2C91D5] hover:bg-[#2475c2] active:scale-95"
              >
               REGISTER AS VC
              </button>
            </div>
          </div>
          
          {/* Hero Image - Right Side, Bottom Aligned */}
          <div className="w-full lg:w-[40%] h-[250px] md:h-[350px] lg:h-full flex items-end justify-center lg:justify-end">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/1fe1bb0cddbd63739a4fe4f3c3249b2649f69ff3?placeholderIfAbsent=true"
              className="w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] h-auto object-contain object-bottom"
              alt="Hero illustration"
              style={{ marginBottom: '0' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;