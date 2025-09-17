import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
  children: React.ReactNode[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showArrows?: boolean;
  showDots?: boolean;
  className?: string;
  itemsPerView?: number;
  gap?: number;
}

const Carousel: React.FC<CarouselProps> = ({
  children,
  autoPlay = false,
  autoPlayInterval = 3000,
  showArrows = true,
  showDots = true,
  className = '',
  itemsPerView = 1,
  gap = 16,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = Math.ceil(children.length / itemsPerView);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === totalSlides - 1 ? 0 : prevIndex + 1
    );
  }, [totalSlides]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? totalSlides - 1 : prevIndex - 1
    );
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (autoPlay) {
      const interval = setInterval(goToNext, autoPlayInterval);
      return () => clearInterval(interval);
    }
  }, [autoPlay, autoPlayInterval, goToNext]);

  return (
    <div className={`relative px-8 ${className}`}>
      <div className="overflow-hidden relative py-4">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            gap: `${gap}px`,
          }}
        >
          {children.map((child, index) => (
            <div
              key={index}
              className="flex-shrink-0 relative z-10 hover:z-20"
              style={{
                width: `calc(${100 / itemsPerView}% - ${gap * (itemsPerView - 1) / itemsPerView}px)`,
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows - contained within padding */}
      {showArrows && totalSlides > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:shadow-xl transition-shadow"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:shadow-xl transition-shadow"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-8 bg-[#2C91D5]' 
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;