import React from 'react';

const Footer = () => {
  return (
    <footer className="flex w-full flex-col items-stretch bg-[#344168] pt-6 md:pt-[21px]">
      <div className="max-w-[1320px] justify-between items-start flex-wrap self-center flex flex-col lg:flex-row gap-8 lg:gap-0 w-full py-6 md:py-[42px] px-4 mx-auto">
        {/* Company Details Section - Left Group */}
        <div className="max-w-[500px] lg:max-w-[600px] justify-center items-center lg:items-stretch flex flex-col w-full lg:w-1/2 text-center lg:text-left">
          <div className="w-full flex-1 px-2 lg:pl-[11px] lg:pr-2.5">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/204eb8bd78fc2094848116748b02c3ff17e52b7d?placeholderIfAbsent=true"
              className="aspect-[4.42] object-contain w-[150px] sm:w-[178px] mx-auto lg:mx-0"
              alt="Zuvomo Logo"
            />
            
            <div className="w-full text-sm text-white font-medium leading-[20px] sm:leading-[22px] mt-[13px] max-w-md mx-auto lg:mx-0">
              <div className="text-sm font-medium leading-[22.4px]">
                Distinguished by a blend of diverse talents, our exceptional team thrives on unity, innovation, and shared values, forging a collective journey towards unparalleled success.
              </div>
            </div>
            
            <div className="max-w-[433px] items-center content-center flex-wrap flex w-full gap-[0_14px] mt-[13px] pt-px">
              <div className="max-w-[412px] self-stretch text-sm text-white font-medium my-auto">
                <div className="text-sm font-medium leading-[21px]">
                  Follow us on:
                </div>
              </div>
              <div className="flex items-center justify-center w-9 h-9 my-auto">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/77977c41c875e694bb5dea83c821acca1d82cb2c?placeholderIfAbsent=true"
                  className="w-full h-full object-contain"
                  alt="Social media"
                />
              </div>
              <div className="flex items-center justify-center w-9 h-9 my-auto">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/1f4bb83a6ae552d8221843bcaa80d81b58455ed3?placeholderIfAbsent=true"
                  className="w-full h-full object-contain"
                  alt="Social media"
                />
              </div>
              <div className="flex items-center justify-center w-9 h-9 my-auto">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/27f55756743a04b90361aefe292a5ab9da92a80c?placeholderIfAbsent=true"
                  className="w-full h-full object-contain"
                  alt="Social media"
                />
              </div>
              <div className="flex items-center justify-center w-9 h-9 my-auto">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/50ca8546be8a4a48df24a34a4eda90e4a335d94c?placeholderIfAbsent=true"
                  className="w-full h-full object-contain"
                  alt="Social media"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Links Section - Right Group */}
        <div className="flex justify-start lg:justify-center items-start gap-8 lg:gap-12 flex-wrap pt-5">
          {/* Account Links */}
          <div className="justify-start items-stretch flex flex-col min-w-[150px] pt-0">
            <div className="w-full flex-1 gap-[13.99px] px-3">
              <h3 className="w-full text-base text-white font-bold whitespace-nowrap leading-[1.2]">
                <div className="text-base font-bold leading-[19.2px]">
                  Account
                </div>
              </h3>
              
              <nav className="w-full text-sm font-medium gap-2 mt-3.5">
                <div className="flex w-full flex-col text-white whitespace-nowrap">
                  <div className="flex">
                    <a href="#" className="text-sm font-medium leading-[21px] hover:text-[#0dcaf0] transition-colors">
                      Home
                    </a>
                  </div>
                </div>
                <div className="flex w-full flex-col text-white mt-2">
                  <div className="flex">
                    <a href="#" className="text-sm font-medium leading-[21px] hover:text-[#0dcaf0] transition-colors">
                      About Us
                    </a>
                  </div>
                </div>
                <div className="flex w-full flex-col whitespace-nowrap mt-2">
                  <div className="flex">
                    <a href="#" className="rounded-[20px] text-white text-sm font-medium leading-[21px] hover:text-[#0dcaf0] transition-colors">
                      Security
                    </a>
                  </div>
                </div>
                <div className="flex w-full flex-col text-white whitespace-nowrap mt-2">
                  <div className="flex">
                    <a href="#" className="text-sm font-medium leading-[21px] hover:text-[#0dcaf0] transition-colors">
                      Blog
                    </a>
                  </div>
                </div>
                <div className="flex w-full flex-col text-white mt-2">
                  <div className="flex">
                    <a href="#" className="text-sm font-medium leading-[21px] hover:text-[#0dcaf0] transition-colors">
                      Contact Us
                    </a>
                  </div>
                </div>
              </nav>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="justify-start items-stretch flex flex-col text-white min-w-[150px] pt-0">
            <div className="w-full flex-1 gap-[13.99px] px-3">
              <h3 className="w-full text-base font-bold leading-[1.2]">
                <div className="text-base font-bold leading-[19.2px]">
                  Quick Links
                </div>
              </h3>
              
              <nav className="w-full text-sm font-medium gap-2 mt-3.5">
                <div className="flex w-full flex-col">
                  <div className="flex">
                    <a href="#" className="text-sm font-medium leading-[21px] hover:text-[#0dcaf0] transition-colors">
                      Terms and Conditions
                    </a>
                  </div>
                </div>
                <div className="flex w-full flex-col mt-2">
                  <div className="flex">
                    <a href="#" className="text-sm font-medium leading-[21px] hover:text-[#0dcaf0] transition-colors">
                      Privacy Policy
                    </a>
                  </div>
                </div>
                <div className="flex w-full flex-col whitespace-nowrap mt-2">
                  <div className="flex">
                    <a href="#" className="text-sm font-medium leading-[21px] hover:text-[#0dcaf0] transition-colors">
                      Support
                    </a>
                  </div>
                </div>
              </nav>
            </div>
          </div>
          
          {/* Contact Us */}
          <div className="justify-start items-stretch flex flex-col text-white min-w-[150px] pt-0">
            <div className="w-full flex-1 gap-[13.99px] px-3">
              <h3 className="w-full text-base text-white font-bold whitespace-nowrap leading-[1.2]">
                <div className="text-base font-bold leading-[19.2px]">
                  Contact Us
                </div>
              </h3>
              
              <div className="text-[#0dcaf0] font-bold mt-3.5">
                <div className="text-sm font-bold leading-[22.4px]">
                  Spacetime Center
                </div>
              </div>
              
              <address className="not-italic">
                <div className="flex items-stretch gap-[7px] mt-2">
                  <img
                    src="https://api.builder.io/api/v1/image/assets/TEMP/67de862c34e37e334c2208cb3356ca6b545cef2c?placeholderIfAbsent=true"
                    className="aspect-[1] object-contain w-3.5 shrink-0"
                    alt="Location icon"
                  />
                  <div className="text-sm font-medium leading-[22.4px] basis-auto">
                    E-25/A, 2nd Floor, Hauz Khas,
                  </div>
                </div>
                <div className="text-sm font-medium leading-[22.4px] ml-5 mt-2 max-md:ml-2.5">
                  Delhi, India 110016
                </div>
                
                <div className="flex items-stretch gap-[7px] mt-2">
                  <img
                    src="https://api.builder.io/api/v1/image/assets/TEMP/6c10345fb8fd4a599fc57b5c913f8c3ec31bf244?placeholderIfAbsent=true"
                    className="aspect-[1] object-contain w-3.5 shrink-0"
                    alt="Phone icon"
                  />
                  <div className="text-sm font-medium leading-[22.4px]">
                    (406) 555-0120
                  </div>
                </div>
                
                <div className="flex items-stretch gap-[7px] whitespace-nowrap mt-2">
                  <img
                    src="https://api.builder.io/api/v1/image/assets/TEMP/d62fba58ef8fae5b3fc4f40735efd0977e37ce39?placeholderIfAbsent=true"
                    className="aspect-[1] object-contain w-3.5 shrink-0"
                    alt="Email icon"
                  />
                  <div className="text-sm font-medium leading-[22.4px] basis-auto">
                    hello@zuvomo.com
                  </div>
                </div>
              </address>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full text-base text-[#212529] font-medium text-center max-w-[1920px] bg-white mt-[21px] pt-[15px] pb-3.5 px-[300px] border-t-[#DEE2E6] border-t border-solid max-md:max-w-full max-md:px-5">
        <div className="max-w-[1320px] w-full pl-[11px] pr-2.5 max-md:max-w-full">
          <div className="text-[#212529] text-base font-medium leading-6 max-md:max-w-full">
            © Zuvomo 2025. All rights reserved
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;