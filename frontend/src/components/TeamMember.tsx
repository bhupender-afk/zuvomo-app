import React from 'react';

interface TeamMemberProps {
  name: string;
  role: string;
  description: string;
  image: string;
  socialLinks?: {
    linkedin?: string;
    telegram?: string;
  };
  variant?: 'default' | 'highlighted';
}

const TeamMember: React.FC<TeamMemberProps> = ({
  name,
  role,
  description,
  image,
  socialLinks,
  variant = 'default'
}) => {
  return (
    <article className="max-w-[320px] sm:max-w-[433px] bg-white flex w-full flex-col items-stretch p-4 sm:p-5 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02] group border border-gray-200 hover:border-[#2C91D5] mx-auto relative z-10 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)]">
      <div className="relative overflow-hidden rounded-full w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-4">
        <img
          src={image}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          alt={`${name} profile`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      {/* Standardized name styling for all cards */}
      <div className="flex flex-col items-center text-base font-bold text-center leading-[1.2] mb-2">
        <div className="text-[#212529] max-w-[412px]">
          {name}
        </div>
      </div>
      
      {/* Standardized role styling for all cards */}
      <div className="text-center text-base font-bold leading-[19.2px] flex flex-col items-center mt-1 text-[#212529] mb-3">
        <div className="max-w-[412px]">
          {role}
        </div>
      </div>
      
      {/* Standardized description for all cards */}
      <div className="text-center text-sm font-normal leading-[22.4px] flex flex-col items-center text-[#212529] mt-1.5 px-3 sm:px-[21px] flex-1">
        <div className="max-w-[280px] sm:max-w-[412px]">
          {description}
        </div>
      </div>
      
      {/* Standardized social links for all cards */}
      <div className="flex gap-[7px] justify-center text-sm text-[rgba(33,37,41,0.7)] font-normal leading-[22.4px] mt-4">
        {socialLinks?.linkedin && (
          <div className="flex min-h-7 flex-col w-[34px] gap-[7px] pr-1.5">
            <button 
              onClick={() => window.open(socialLinks.linkedin, '_blank')}
              className="items-center flex min-h-8 w-8 justify-center bg-[#0077B6] hover:bg-[#005885] rounded-full transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-md"
              aria-label={`${name}'s LinkedIn profile`}
            >
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/3892bafccdaa84cacbabd3966034cc7b84db48e3?placeholderIfAbsent=true"
                className="aspect-[1] object-contain w-[18px] brightness-0 invert"
                alt="LinkedIn"
              />
            </button>
          </div>
        )}
        {socialLinks?.telegram && (
          <div className="flex min-h-7 flex-col w-[34px] pr-1.5">
            <button 
              onClick={() => window.open(socialLinks.telegram, '_blank')}
              className="items-center flex min-h-8 w-8 justify-center bg-[#0077B6] hover:bg-[#005885] rounded-full transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-md"
              aria-label={`${name}'s Telegram profile`}
            >
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/cfe53b0b52ab2f6dc24eca8c85b7cdf73bff8099?placeholderIfAbsent=true"
                className="aspect-[1] object-contain w-[18px] brightness-0 invert"
                alt="Telegram"
              />
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

export default TeamMember;