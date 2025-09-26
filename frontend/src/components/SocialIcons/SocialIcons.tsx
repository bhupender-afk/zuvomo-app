import React from 'react';
import { LinkedInIcon, FacebookIcon, TwitterIcon, InstagramIcon } from './index';
import './index.css';
import MediumIcon from './MediumIcon';
import TelegramIcon from './TelegramIcon';

interface SocialIconsProps {
  className?: string;
  iconClassName?: string;
  showLabels?: boolean;
}

const SocialIcons: React.FC<SocialIconsProps> = ({
  className = "social-icons-group",
  iconClassName = "social-icon-medium",
  showLabels = true
}) => {
  return (
    <div className="social-icons-container">
      {/* {showLabels && (
        <div className="social-icons-label">
          <div className="social-icons-label-text">
            Follow us on:
          </div>
        </div>
      )} */}
      <div className={className}>
        <LinkedInIcon className={iconClassName} />
        <FacebookIcon className={iconClassName} />
        <TwitterIcon className={iconClassName} />
        <InstagramIcon className={iconClassName} />
         <TelegramIcon className={iconClassName} />
        <MediumIcon className={iconClassName} />
              </div>
    </div>
  );
};

export default SocialIcons;