import React from 'react';
import { Link } from 'react-router-dom';

interface CaseStudyCardProps {
  title: string;
  description: string;
  category: string;
  image: string;
  slug: string;
}

const CaseStudyCard: React.FC<CaseStudyCardProps> = ({
  title,
  description,
  category,
  image,
  slug
}) => {
  return (
    <article className="flex flex-col max-w-[480px] shadow-[0_8px_25px_0_rgba(0,0,0,0.15)] overflow-hidden relative aspect-[0.7] min-w-60 min-h-[560px] w-full flex-1 shrink basis-[0%] rounded-2xl group hover:shadow-[0_15px_35px_0_rgba(0,0,0,0.25)] transition-all duration-300">
      <img
        src={image}
        className="absolute h-full w-full object-cover inset-0 group-hover:scale-105 transition-transform duration-500"
        alt={title}
      />
      {/* Strong dark overlay for maximum text clarity */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/40 to-transparent group-hover:from-black/75 group-hover:via-black/50 group-hover:to-transparent transition-all duration-300"></div>
      
      <div className="relative max-w-[460px] w-full flex-1 pt-[320px] pb-8 px-6 rounded-2xl max-md:pt-[180px] z-10 flex flex-col">
        {/* Professional category badge */}
        <div className="mb-4">
          <div className="inline-flex items-center">
            <span className="bg-white text-black text-xs font-semibold px-3 py-1.5 rounded-md shadow-lg">
              {category}
            </span>
          </div>
        </div>
        
        {/* Professional title styling */}
        <h3 className="text-white font-bold text-xl leading-tight mb-4 drop-shadow-lg">
          {title}
        </h3>
        
        {/* Clean description */}
        <div className="text-white/90 font-normal leading-relaxed mb-4 text-sm drop-shadow-md flex-grow">
          {description}
        </div>
        
        {/* Professional CTA button - Fixed at bottom */}
        <Link 
          to={`/case-studies/${slug}`}
          className="inline-flex items-center text-white font-semibold text-base bg-transparent px-8 py-3.5 rounded-full hover:bg-white hover:text-[rgb(69,67,79)] hover:scale-105 transition-all duration-300 shadow-lg group/btn border-2 border-white hover:border-white mt-auto self-start"
        >
          <span className="mr-2">Read Case Study</span>
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none" 
            className="transition-transform duration-300 group-hover/btn:translate-x-1"
          >
            <path 
              d="M6 3L11 8L6 13" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </article>
  );
};

export default CaseStudyCard;