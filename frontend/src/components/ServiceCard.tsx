import React from 'react';
import { motion } from 'framer-motion';

interface ServiceCardProps {
  icon: string;
  title: string;
  description: string;
  variant?: 'default' | 'highlighted';
}

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  icon, 
  title, 
  description, 
  variant = 'default' 
}) => {
  return (
    <motion.article 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{ 
        scale: 1.02
      }}
      transition={{ 
        duration: 0.3, 
        ease: [0.4, 0, 0.2, 1],
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className={`max-w-[400px] min-h-[220px] w-full flex-1 p-5 rounded-2xl group cursor-pointer backdrop-blur-sm border transition-all duration-300 ${
        variant === 'highlighted' 
          ? 'bg-gradient-to-br from-[#2c91d5] via-[#2c91d5] to-[#1e40af] text-white border-white/20 shadow-[0_8px_32px_0_rgba(44,145,213,0.2)] hover:shadow-[0_20px_40px_0_rgba(44,145,213,0.3)]' 
          : 'bg-white hover:bg-[#2c91d5] hover:text-white border-gray-100 shadow-[0_2px_12px_0_rgba(0,0,0,0.05)] hover:shadow-[0_15px_35px_0_rgba(0,0,0,0.12)]'
      }`}
    >
      <div className="min-h-20 w-[60px] max-w-[304px] pb-5">
        <div 
          className={`justify-center items-center flex min-h-[60px] w-full h-[60px] max-w-[304px] rounded-[30px] transition-all duration-300 ease-in-out ${
            variant === 'highlighted' 
              ? 'bg-white/20 backdrop-blur-sm shadow-[0_4px_16px_0_rgba(255,255,255,0.2)]' 
              : 'bg-gray-100 backdrop-blur-sm shadow-[0_4px_16px_0_rgba(0,0,0,0.1)] group-hover:bg-white group-hover:shadow-[0_4px_20px_0_rgba(255,255,255,0.3)] group-hover:scale-105'
          }`}
        >
          <img
            src={icon}
            className={`aspect-[1] object-contain w-10 self-stretch max-w-[60px] my-auto transition-all duration-300 ease-in-out  ${
              variant === 'highlighted' 
                ? '' 
                : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110'
            }`}
            alt={`${title} icon`}
          />
          {/* <div className="absolute inset-0 bg-blue-500 opacity-40 mix-blend-multiply"></div> */}
        </div>
      </div>
      
      <h3 className={`max-w-[304px] w-full text-base font-bold leading-[1.2] transition-colors duration-300 ${
        variant === 'highlighted' ? 'text-white' : 'text-[#212529] group-hover:text-white'
      }`}>
        <div className="text-base font-bold leading-[19.2px]">
          {title}
        </div>
      </h3>
      
      <div className={`max-w-[304px] items-stretch flex w-full flex-col overflow-hidden text-sm font-normal leading-5 justify-center flex-1 py-2 rounded-lg transition-colors duration-300 ${
        variant === 'highlighted' ? 'text-white/90' : 'text-[#333333] group-hover:text-white/90'
      }`}>
        <div className="text-sm font-normal leading-[19.6px]">
          {description}
        </div>
      </div>
      
      <div className="min-h-[51px] w-9 max-w-[304px] pt-[15px]">
        <button 
          className={`justify-center items-center border flex min-h-9 w-full h-9 max-w-[304px] px-px rounded-[18px] border-solid backdrop-blur-sm transition-all duration-300 ${
            variant === 'highlighted' 
              ? 'bg-white/20 border-white/30' 
              : 'bg-gray-100 border-gray-200 group-hover:bg-white group-hover:border-white/30'
          }`}
        >
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/752eb73ad5681c24b91f408938c5ef8dbfea169c?placeholderIfAbsent=true"
            className={`aspect-[1] object-contain w-3.5 self-stretch my-auto transition-all duration-300 ${
              variant === 'highlighted' 
                ? '' 
                : 'opacity-70 group-hover:opacity-100'
            }`}
            alt="Arrow icon"
          />
        </button>
      </div>
    </motion.article>
  );
};

export default ServiceCard;