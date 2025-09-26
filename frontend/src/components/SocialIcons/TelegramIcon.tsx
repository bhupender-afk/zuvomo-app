import React from 'react';

interface TelegramIconProps {
    className?: string;
    href?: string;
}

const TelegramIcon: React.FC<TelegramIconProps> = ({
    className = "w-9 h-9",
    href = "https://telegram.org/@zuvomo"
}) => {
    return (
        <a href={href} className={`social-icon-link ${className}`} target="_blank" rel="noopener noreferrer" aria-label="Follow us on Telegram">
            <svg className="social-icon-svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.789L21.928 5.27c.316-1.24-.468-1.8-1.263-1.553z"></path>
            </svg>
        </a>
    );
};

export default TelegramIcon;