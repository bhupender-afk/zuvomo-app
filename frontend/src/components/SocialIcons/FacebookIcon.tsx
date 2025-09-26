import React from 'react';
import './index.css';

interface FacebookIconProps {
  className?: string;
  href?: string;
}

const FacebookIcon: React.FC<FacebookIconProps> = ({
  className = "social-icon-medium",
  href = "https://www.facebook.com/Zuvomo/"
}) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`social-icon-link social-icon-facebook ${className}`}
      aria-label="Follow us on Facebook"
    >
      <svg
        className="social-icon-svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M24 12.0733C24 5.4054 18.6274 0 12 0S0 5.4054 0 12.0733C0 18.0995 4.38823 23.0943 10.125 24V15.5633H7.07813V12.0733H10.125V9.41343C10.125 6.38755 11.9165 4.71615 14.6576 4.71615C15.9705 4.71615 17.3438 4.95195 17.3438 4.95195V7.92313H15.8306C14.3399 7.92313 13.875 8.85381 13.875 9.80857V12.0733H17.2031L16.6711 15.5633H13.875V24C19.6118 23.0943 24 18.0995 24 12.0733Z"
          fill="#fff"
        />
      </svg>
    </a>
  );
};

export default FacebookIcon;