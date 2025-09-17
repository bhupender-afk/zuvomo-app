import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'card' | 'text' | 'circle' | 'rectangle';
  lines?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  variant = 'rectangle',
  lines = 1
}) => {
  const shimmerVariants = {
    initial: { x: '-100%' },
    animate: {
      x: '100%',
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: 'linear'
      }
    }
  };

  const baseClasses = 'bg-gray-200 relative overflow-hidden';
  
  const variantClasses = {
    card: 'rounded-lg h-64 w-full',
    text: 'rounded h-4 w-full',
    circle: 'rounded-full w-12 h-12',
    rectangle: 'rounded w-full h-8'
  };

  if (variant === 'card') {
    return (
      <div className={`${baseClasses} ${variantClasses.card} ${className}`}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
        />
        <div className="p-4 space-y-4">
          <div className={`${baseClasses} ${variantClasses.text} w-3/4`} />
          <div className={`${baseClasses} ${variantClasses.text} w-1/2`} />
          <div className={`${baseClasses} ${variantClasses.rectangle} h-24`} />
          <div className="flex space-x-2">
            <div className={`${baseClasses} ${variantClasses.text} w-16`} />
            <div className={`${baseClasses} ${variantClasses.text} w-16`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
          />
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;