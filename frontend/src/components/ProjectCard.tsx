import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Project {
  id: string;
  title: string;
  description: string;
  fundRaised?: string;
  stage: string;
  tags?: string[];
  tagsArray?: string[];
  progress: number;
  progress_percentage?: number;
  rating: number;
  image?: string;
  image_url?: string;
  category?: string;
  funding_goal?: number;
  current_funding?: number;
  location?: string;
  team_size?: number;
  is_featured?: boolean;
  owner?: {
    first_name: string;
    last_name: string;
    company?: string;
  };
  owner_name?: string;
}

interface ProjectCardProps {
  // Option 1: Individual props (legacy)
  title?: string;
  description?: string;
  fundRaised?: string;
  stage?: string;
  tags?: string[];
  progress?: number;
  rating?: number;
  image?: string;
  onViewDetails?: () => void;
  
  // Option 2: Project object (new)
  project?: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = (props) => {
  // Handle both prop patterns - extract from project object or use individual props
  const project = props.project;
  const title = props.title || project?.title || '';
  const description = props.description || project?.description || '';
  const fundRaised = props.fundRaised || project?.fundRaised || `$${((project?.current_funding || 0) / 1000000).toFixed(1)}M`;
  const stage = props.stage || project?.stage || '';
  const tags = props.tags || project?.tagsArray || project?.tags || [];
  const progress = props.progress || project?.progress_percentage || project?.progress || 0;
  const rating = props.rating || project?.rating || 0;
  const image = props.image || project?.image || project?.image_url || '';
  const onViewDetails = props.onViewDetails;
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [imageError, setImageError] = useState(false);
  
  // Normalize rating to 5-star scale (assuming original scale is 0-10)
  const safeRating = rating || 0;
  const normalizedRating = safeRating > 5 ? (safeRating / 10) * 5 : safeRating;
  const displayRating = userRating || normalizedRating;
  
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    }
  };

  const handleStarClick = (starIndex: number) => {
    setUserRating(starIndex);
    // Here you would typically send the rating to your backend
    console.log(`User rated ${title}: ${starIndex} stars`);
  };

  const renderStars = () => {
    const maxStars = 5;
    const stars = [];
    
    for (let i = 1; i <= maxStars; i++) {
      let starType = 'empty';
      
      if (hoveredStar) {
        starType = i <= hoveredStar ? 'filled' : 'empty';
      } else {
        if (i <= Math.floor(displayRating)) {
          starType = 'filled';
        } else if (i === Math.ceil(displayRating) && displayRating % 1 > 0) {
          starType = 'half';
        } else {
          starType = 'empty';
        }
      }
      
      stars.push(
        <button
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            handleStarClick(i);
          }}
          onMouseEnter={() => setHoveredStar(i)}
          onMouseLeave={() => setHoveredStar(0)}
          className="text-xl leading-none transition-colors cursor-pointer hover:scale-110 min-w-[24px] relative inline-block"
        >
          {starType === 'half' ? (
            <span className="relative inline-block">
              <span style={{ color: '#d1d5db' }}>★</span>
              <span 
                className="absolute top-0 left-0 inline-block overflow-hidden"
                style={{ 
                  color: '#ffa726',
                  width: '50%'
                }}
              >
                ★
              </span>
            </span>
          ) : (
            <span style={{ color: starType === 'filled' ? '#ffa726' : '#d1d5db' }}>★</span>
          )}
        </button>
      );
    }
    
    return stars;
  };

  const truncateDescription = (text: string, lines: number = 2) => {
    const words = text.split(' ');
    const wordsPerLine = 12; // Approximate words per line
    const maxWords = lines * wordsPerLine;
    
    if (words.length <= maxWords || showFullDescription) {
      return text;
    }
    
    return words.slice(0, maxWords).join(' ') + '...';
  };
  
  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.15)",
      }}
      transition={{ 
        duration: 0.3,
        ease: "easeOut"
      }}
      className="max-w-[480px] border w-full overflow-hidden bg-white p-3 sm:p-4 lg:p-5 rounded-2xl border-solid border-gray-200 hover:border-[#2C91D5] group cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 font-inter mx-auto flex flex-col h-full"
    >
      <div className="justify-center items-center flex w-full">
        {image && !imageError ? (
          <motion.div 
            className="overflow-hidden rounded-lg"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <motion.img
              src={image}
              className="aspect-[1.69] object-cover w-full max-w-[400px] self-stretch min-w-[200px] sm:min-w-60 flex-1 shrink basis-[0%] my-auto"
              alt={title}
              onError={() => {
                console.warn(`Failed to load image for project "${title}":`, image);
                setImageError(true);
              }}
              onLoad={() => {
                console.log(`Successfully loaded image for project "${title}":`, image);
              }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        ) : (
          <motion.div 
            className="max-w-[400px] border self-stretch flex min-h-[200px] min-w-60 w-full flex-1 shrink basis-[0%] my-auto border-[rgba(220,220,220,1)] border-solid bg-gray-100 rounded-lg"
            whileHover={{ backgroundColor: "#f3f4f6" }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm text-center">
              {imageError ? (
                <div>
                  <div className="text-gray-400 text-lg mb-1">📷</div>
                  <div>Image failed to load</div>
                </div>
              ) : (
                <div>
                  <div className="text-gray-400 text-lg mb-1">🖼️</div>
                  <div>No image available</div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
      
      <div className="w-full max-w-[440px] pt-[9px] flex-1 flex flex-col">
        <div className="w-full max-w-[440px] pb-3 flex-1">
          <h3 className="max-w-[400px] w-full text-base text-[#212529] font-bold leading-[1.2]">
            <div className="text-base font-bold leading-[19.2px]">
              {title}
            </div>
          </h3>
          
          <div className="max-w-[400px] justify-center items-stretch flex w-full flex-col text-sm text-[#333333] font-normal leading-5 pt-3 rounded-lg">
            <div className="text-sm font-normal leading-[19.6px]">
              <div className={`${!showFullDescription ? 'line-clamp-2' : ''}`}>
                {description}
              </div>
              {description.split(' ').length > 24 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullDescription(!showFullDescription);
                  }}
                  className="text-[#2C91D5] ml-1 hover:underline text-sm font-semibold inline-block"
                >
                  {showFullDescription ? ' show less' : ' ... view more'}
                </button>
              )}
            </div>
          </div>
          
          <div className="max-w-[440px] items-stretch flex w-full gap-1.5 sm:gap-2 text-xs text-gray-700 font-medium pt-3 font-inter flex-wrap">
            <div className="items-center border flex gap-1.5 sm:gap-2 whitespace-nowrap h-full bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full border-solid border-gray-200 flex-shrink-0">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/2d19a5a15288865376fd5b94cdcdabbf59044372?placeholderIfAbsent=true"
                className="aspect-[1] object-contain w-3 sm:w-4 self-stretch shrink-0 my-auto"
                alt="Fund icon"
              />
              <div className="text-xs font-medium leading-[15px] self-stretch my-auto">
                {fundRaised}
              </div>
            </div>
            <div className="items-center border flex gap-1.5 sm:gap-2 whitespace-nowrap h-full bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full border-solid border-gray-200 flex-shrink-0">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/3e7afe7165558f978b3b2e1cedc030b4711ce602?placeholderIfAbsent=true"
                className="aspect-[1] object-contain w-3 sm:w-4 self-stretch shrink-0 my-auto"
                alt="Stage icon"
              />
              <div className="text-xs font-medium leading-[15px] self-stretch my-auto capitalize">
                {stage}
              </div>
            </div>
            <div className="items-center border flex gap-1.5 sm:gap-2 whitespace-nowrap h-full bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full border-solid border-gray-200 flex-shrink-0 hidden sm:flex">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/173746a6a25c878968a71492e9c73ac5f7e9839a?placeholderIfAbsent=true"
                className="aspect-[1] object-contain w-4 self-stretch shrink-0 my-auto"
                alt="Growth icon"
              />
              <div className="text-xs font-medium leading-[15px] self-stretch my-auto whitespace-nowrap">
                Early Growth
              </div>
            </div>
            <div className="items-center border flex whitespace-nowrap h-full bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full border-solid border-gray-200 flex-shrink-0 hidden md:flex">
              <div className="text-xs font-medium leading-[15px] self-stretch my-auto">
                +4
              </div>
            </div>
          </div>
          
          <div className="max-w-[400px] items-stretch flex w-full gap-2 text-[10px] text-[#1976d2] font-medium whitespace-nowrap pt-2">
            <div className="flex gap-2 flex-wrap">
              {tags.map((tag, index) => (
                <div key={index} className="justify-center items-center border flex text-center h-full bg-[#E3F2FD] px-[13px] py-[5px] rounded-2xl border-solid border-[#90CAF9]">
                  <div className="text-[10px] font-medium leading-[15px]">
                    {tag}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex-1 flex justify-end">
              <button className="items-center border flex gap-2 bg-white px-4 py-2 rounded-full border-solid border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-inter">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/31c8f4ae66ef9b07b7bbd25d7dacc7d057f3fdf7?placeholderIfAbsent=true"
                  className="aspect-[1] object-contain w-4 shrink-0"
                  alt="Report icon"
                />
                <div className="text-xs font-medium leading-[18px] text-gray-700">
                  Report
                </div>
              </button>
            </div>
          </div>
          
        </div>
        <div className="w-full max-w-[440px] mt-auto pt-3">
          <div className="max-w-[400px] w-full gap-1.5 pb-3 flex justify-end">
            <div className="w-full">
              <div className="justify-between items-center flex w-full gap-[40px_100px] text-xs text-[#3f4041] max-w-[400px]">
                <div className="self-stretch my-auto pb-1">
                  <div className="flex">
                    <div className="text-xs font-normal leading-[18px]">
                      Fund Raised: 
                    </div>
                    <div className="text-xs font-bold leading-[18px] ml-1">
                      {fundRaised}
                    </div>
                  </div>
                </div>
                <div className="self-stretch font-normal my-auto text-right">
                  <div className="text-xs font-normal leading-[18px]">
                    {progress}% Completed
                  </div>
                </div>
              </div>
              <div className="justify-center flex min-h-4 w-full flex-col overflow-hidden max-w-[400px] bg-gray-200 mt-2 rounded-full">
                <motion.div 
                  className="flex min-h-4 flex-1 bg-gradient-to-r from-blue-500 to-[#2C91D5] rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${progress}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="justify-center items-center bg-black flex min-h-[30px] w-[30px] h-[30px] rounded-[15px]">
              <img
                src="/favicon icon 02.png"
                className="aspect-[1] object-contain w-5 max-w-[30px]"
                alt="Profile"
              />
            </div>
            <div className="flex items-center gap-0.5">
              {renderStars()}
            </div>
            <div className="flex items-center gap-1">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/26e9350116e7e952c977624bab4a869f446c7658?placeholderIfAbsent=true"
                className="aspect-[0.91] object-contain w-5 shrink-0"
                alt="Rating"
              />
              <div className="text-sm text-[#212529] font-bold whitespace-nowrap">
                {(isNaN(displayRating) || displayRating === null || displayRating === undefined ? 0 : displayRating).toFixed(1)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button 
              whileHover={{ scale: 1.1, backgroundColor: "rgba(44,145,213,0.20)" }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center border bg-[rgba(44,145,213,0.10)] w-[32px] h-[32px] rounded-full border-solid border-[#DCDCDC] hover:bg-[rgba(44,145,213,0.15)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#2c91d5]">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.button>
            <motion.button 
              onClick={handleViewDetails}
              whileHover={{ 
                scale: 1.05, 
                backgroundColor: "#2c91d5"
              }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center border bg-[#E3F2FD] text-[#2c91d5] hover:text-white text-sm font-bold px-4 py-2 rounded-full border-solid border-[#90CAF9] font-inter transition-all duration-300"
            >
              <span className="text-sm font-semibold leading-[18px]">
                Know More
              </span>
            </motion.button>
          </div>
        </div>
      </div>
      </div>
    </motion.article>
  );
};

export default ProjectCard;