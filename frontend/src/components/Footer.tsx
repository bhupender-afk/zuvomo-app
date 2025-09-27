import React from 'react';
import { SocialIcons } from './SocialIcons';

const Footer = () => {
  return (
    <footer className="flex w-full flex-col items-stretch bg-[#344168] pt-6 md:pt-[21px]">
      <div className="max-w-[1320px] justify-between items-start flex-wrap self-center flex flex-col lg:flex-row gap-8 lg:gap-0 w-full py-6 md:py-[42px] px-4 mx-auto">
        {/* Company Details Section - Left Group */}
        <div className="max-w-[500px] lg:max-w-[600px] flex flex-col w-full lg:w-1/2 mx-auto lg:mx-0">
          <div className="w-full flex-1 flex flex-col items-start sm:items-center lg:items-start px-2 lg:pl-[11px] lg:pr-2.5">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/204eb8bd78fc2094848116748b02c3ff17e52b7d?placeholderIfAbsent=true"
              className="aspect-[4.42] object-contain w-[150px] sm:w-[178px]"
              alt="Zuvomo Logo"
            />

            <div className="w-full text-sm text-white font-medium leading-[20px] sm:leading-[22px] mt-[13px] max-w-md text-left sm:text-center lg:text-left">
              <div className="text-sm font-medium leading-[22.4px]">
                Distinguished by a blend of diverse talents, our exceptional team thrives on unity, innovation, and shared values, forging a collective journey towards unparalleled success.
              </div>
            </div>

            <div className="w-full flex justify-start sm:justify-center lg:justify-start">
              <SocialIcons />
            </div>
          </div>
        </div>

        {/* Navigation Links Section - Right Group */}
        <div className="flex justify-start sm:justify-center lg:justify-end items-start gap-8 lg:gap-12 flex-wrap pt-5 w-full lg:w-auto">
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
                    <a href="/" className="text-sm font-medium leading-[21px] hover:text-[#0dcaf0] transition-colors">
                      Home
                    </a>
                  </div>
                </div>
                <div className="flex w-full flex-col text-white mt-2">
                  <div className="flex">
                    <a href="/about-us" className="text-sm font-medium leading-[21px] hover:text-[#0dcaf0] transition-colors">
                      About Us
                    </a>
                  </div>
                </div>
                <div className="flex w-full flex-col whitespace-nowrap mt-2">
                  <div className="flex">
                    <a href="/startups" className="rounded-[20px] text-white text-sm font-medium leading-[21px] hover:text-[#0dcaf0] transition-colors">
                      Startups
                    </a>
                  </div>
                </div>
                <div className="flex w-full flex-col text-white whitespace-nowrap mt-2">
                  <div className="flex">
                    <a href="/investors" className="text-sm font-medium leading-[21px] hover:text-[#0dcaf0] transition-colors">
                      VCs
                    </a>
                  </div>
                </div>
                <div className="flex w-full flex-col text-white whitespace-nowrap mt-2">
                  <div className="flex">
                    <a href="https://blog.zuvomo.com" target='_blank' className="text-sm font-medium leading-[21px] hover:text-[#0dcaf0] transition-colors">
                      Blog
                    </a>
                  </div>
                </div>
                <div className="flex w-full flex-col text-white whitespace-nowrap mt-2">
                  <div className="flex">
                    <a href="/our-service" className="text-sm font-medium leading-[21px] hover:text-[#0dcaf0] transition-colors">
                      Services
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
          {/* <div className="justify-start items-stretch flex flex-col text-white min-w-[150px] pt-0">
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
          </div> */}

          {/* Contact Us */}
          <div className="justify-start items-stretch flex flex-col text-white min-w-[150px] pt-0 w-full sm:w-auto">
            <div className="w-full flex-1 gap-[13.99px] px-3 flex flex-col items-start sm:items-center lg:items-start">
              <h3 className="w-full text-base text-white font-bold whitespace-nowrap leading-[1.2] text-left sm:text-center lg:text-left">
                <div className="text-base font-bold leading-[19.2px]">
                  Contact Us
                </div>
              </h3>

              {/* <div className="text-[#0dcaf0] font-bold mt-3.5">
                <div className="text-sm font-bold leading-[22.4px]">
                  Spacetime Center
                </div>
              </div> */}

              <address className="not-italic w-full flex flex-col items-start sm:items-center lg:items-start">
                <div className="flex items-stretch gap-[7px] mt-2 justify-start sm:justify-center lg:justify-start">
                  <img
                    src="https://api.builder.io/api/v1/image/assets/TEMP/67de862c34e37e334c2208cb3356ca6b545cef2c?placeholderIfAbsent=true"
                    className="aspect-[1] object-contain w-3.5 shrink-0"
                    alt="Location icon"
                  />
                  <div className="text-sm font-medium leading-[22.4px] basis-auto text-left sm:text-center lg:text-left">
                    E-25/A, 2nd Floor, Hauz Khas,
                  </div>
                </div>
                <div className="text-sm font-medium leading-[22.4px] ml-5 sm:ml-0 lg:ml-5 mt-2 text-left sm:text-center lg:text-left">
                  Delhi, India 110016
                </div>

                <div className="flex items-stretch gap-[7px] mt-2 justify-start sm:justify-center lg:justify-start">
                  <img
                    src="https://api.builder.io/api/v1/image/assets/TEMP/6c10345fb8fd4a599fc57b5c913f8c3ec31bf244?placeholderIfAbsent=true"
                    className="aspect-[1] object-contain w-3.5 shrink-0"
                    alt="Phone icon"
                  />
                  <div className="text-sm font-medium leading-[22.4px]">
                    (406) 555-0120
                  </div>
                </div>

                <div className="flex items-stretch gap-[7px] whitespace-nowrap mt-2 justify-start sm:justify-center lg:justify-start">
                  <img
                    src="https://api.builder.io/api/v1/image/assets/TEMP/d62fba58ef8fae5b3fc4f40735efd0977e37ce39?placeholderIfAbsent=true"
                    className="aspect-[1] object-contain w-3.5 shrink-0"
                    alt="Email icon"
                  />
                  <div className="text-sm font-medium leading-[22.4px] basis-auto">
                    <a
                      href="mailto:hello@zuvomo.com?subject=Hello&body=Hi there,"
                      className="text-blue-500 hover:underline"
                    >
                      hello@zuvomo.com
                    </a>
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