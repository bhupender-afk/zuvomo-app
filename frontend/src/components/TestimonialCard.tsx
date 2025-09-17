import React from 'react';

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  avatar: string;
  rating?: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  quote,
  author,
  role,
  avatar,
  rating = 5
}) => {
  const renderStars = (rating: number) => {
    const maxStars = 5;
    const normalizedRating = Math.min(Math.max(rating, 0), maxStars);
    const fullStars = Math.floor(normalizedRating);
    const hasHalfStar = normalizedRating % 1 >= 0.5;
    const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <>
        {'★'.repeat(fullStars)}
        {hasHalfStar && '⯨'}
        {'☆'.repeat(emptyStars)}
      </>
    );
  };
  return (
    <article className="max-w-[320px] sm:max-w-[500px] w-full bg-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden group mx-auto">
      {/* Premium testimonial design */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#2DA5F3]/10 to-transparent rounded-bl-full"></div>
      
      {/* Quote icon */}
      <div className="text-[#2DA5F3] mb-6">
        <svg width="42" height="32" viewBox="0 0 42 32" fill="currentColor" opacity="0.2">
          <path d="M13.844 0C6.212 0 0 6.168 0 13.744 0 23.144 6.212 32 16.036 32L18 28.8C11.64 28.8 6.56 23.744 6.56 17.424 6.56 17.168 6.572 16.912 6.596 16.656 7.364 16.88 8.18 17 9.024 17 12.836 17 15.924 13.936 15.924 10.152 15.924 4.544 11.144 0 5.22 0H13.844ZM37.844 0C30.212 0 24 6.168 24 13.744 24 23.144 30.212 32 40.036 32L42 28.8C35.64 28.8 30.56 23.744 30.56 17.424 30.56 17.168 30.572 16.912 30.596 16.656 31.364 16.88 32.18 17 33.024 17 36.836 17 39.924 13.936 39.924 10.152 39.924 4.544 35.144 0 29.22 0H37.844Z"/>
        </svg>
      </div>
      
      {/* Quote text */}
      <blockquote className="text-gray-700 text-base sm:text-lg leading-relaxed font-normal mb-6 sm:mb-8 relative z-10">
        {quote}
      </blockquote>
      
      {/* Author section with better styling */}
      <div className="flex items-center gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-100">
        <div className="flex-shrink-0">
          <img
            src={avatar}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-[#2DA5F3]/20 group-hover:ring-[#2DA5F3]/40 transition-all duration-300"
            alt={`${author} avatar`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-gray-900 font-semibold text-sm sm:text-base leading-tight truncate">
            {author}
          </h4>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 truncate">
            {role}
          </p>
        </div>
        
        {/* Rating stars */}
        <div className="text-2xl text-[#ffa726] font-normal flex-shrink-0">
          {renderStars(rating)}
        </div>
      </div>
    </article>
  );
};

export default TestimonialCard;