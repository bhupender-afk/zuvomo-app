import React from 'react';

const Hero = () => {
  const checkAuthentication = () => {
    const token = localStorage.getItem('zuvomo_access_token');
    const userStr = localStorage.getItem('zuvomo_user');
    return token && userStr;
  };

  const handleSubmitStartup = () => {
    // Check if user is authenticated
    if (!checkAuthentication()) {
      // Show confirmation dialog before redirecting to signup
      if (confirm('You need to be a registered member to submit your startup. Would you like to create an account now?')) {
        window.location.href = '/signup';
      }
      return;
    }

    // User is authenticated, proceed with startup submission
    if (!window.open('https://forms.google.com/startup-submission', '_blank')) {
      alert('Startup submission form would open here. Please prepare your pitch deck and business plan.');
    }
  };

  const handleRegisterVC = () => {
    if (!window.open('https://forms.google.com/vc-registration', '_blank')) {
      alert('VC registration form would open here. Please prepare your investment criteria and portfolio information.');
    }
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
            <div className="flex items-center justify-center lg:justify-start gap-2 text-white mb-4">
              <span className="text-lg md:text-xl text-orange-500">•</span>
              <span className="text-xs md:text-sm uppercase tracking-wider">
                YOU BUILD. WE HANDLE WHAT COMES NEXT.
              </span>
            </div>
            
            {/* Main Heading - Single Line Layout */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-4 lg:mb-6">
              <div className="mb-2">
                <span className="text-white">Great Ideas </span>
                <span className="text-[#F8673C]">Deserve</span>
              </div>
              <div>
                <span className="text-white">Capital and </span>
                <span className="text-[#2C91D5]">Credibility</span>
              </div>
            </h1>
            
            {/* Description */}
            <div className="relative mb-6 lg:mb-8">
              <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-0.5 bg-white/30"></div>
              <div className="lg:pl-6 space-y-3 text-sm md:text-base text-white/90 leading-relaxed max-w-xl mx-auto lg:mx-0">
                <p className="hidden md:block">
                  Zuvomo supports handpicked Web3 startups through token sales, liquidity, and capital. We take the journey with founders, combining AI insights, proven advisory, and data-backed execution to help them dominate with precision and confidence.
                </p>
                <p className="md:hidden">
                  Zuvomo supports handpicked Web3 startups with capital, advisory, and execution to help founders succeed.
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
                Submit your startups
              </button>
              <button 
                onClick={handleRegisterVC}
                className="bg-[#2C91D5] text-white px-6 py-3 rounded-full font-semibold text-sm hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-[#2C91D5] hover:bg-[#2475c2] active:scale-95"
              >
                Register as VC's
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