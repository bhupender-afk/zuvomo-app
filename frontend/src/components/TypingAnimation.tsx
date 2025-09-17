import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TypingAnimationProps {
  words: string[];
  className?: string;
  typeSpeed?: number;
  deleteSpeed?: number;
  delaySpeed?: number;
  loop?: boolean;
}

const TypingAnimation: React.FC<TypingAnimationProps> = ({
  words,
  className = '',
  typeSpeed = 100,
  deleteSpeed = 50,
  delaySpeed = 2000,
  loop = true
}) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    
    const timeout = setTimeout(() => {
      if (isDeleting) {
        setCurrentText(currentWord.substring(0, currentText.length - 1));
        
        if (currentText === '') {
          setIsDeleting(false);
          if (loop) {
            setCurrentWordIndex((prevIndex) => 
              prevIndex === words.length - 1 ? 0 : prevIndex + 1
            );
          }
        }
      } else {
        setCurrentText(currentWord.substring(0, currentText.length + 1));
        
        if (currentText === currentWord) {
          if (loop || currentWordIndex < words.length - 1) {
            setTimeout(() => setIsDeleting(true), delaySpeed);
          }
        }
      }
    }, isDeleting ? deleteSpeed : typeSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, currentWordIndex, isDeleting, words, typeSpeed, deleteSpeed, delaySpeed, loop]);

  return (
    <div className={`${className} will-change-auto`}>
      <span style={{ minHeight: '1em', display: 'inline-block' }}>{currentText}</span>
      <span
        className="inline-block w-0.5 h-[1em] bg-current ml-1 animate-pulse"
      />
    </div>
  );
};

export default TypingAnimation;