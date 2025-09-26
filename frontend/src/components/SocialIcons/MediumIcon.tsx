import React from 'react';

interface MediumIconProps {
    className?: string;
    href?: string;
}

const MediumIcon: React.FC<MediumIconProps> = ({
    className = "w-9 h-9",
    href = "https://medium.com/@zuvomo"
}) => {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Follow us on Medium"
            className={`p-2 rounded-lg flex items-centerjustify-center  social-icon-link ${className}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 72 72" fill="none">
                <path d="M28 36c0 7.732-6.268 14-14 14S0 43.732 0 36s6.268-14 14-14 14 6.268 14 14Z" fill="#fff" />
                <path d="M48 36c0 7.086-3.032 12.833-6.767 12.833S34.466 43.086 34.466 36s3.032-12.833 6.767-12.833S48 28.914 48 36Z" fill="#fff" />
                <path d="M58 36c0 6.724-1.073 12.167-2.396 12.167S53.208 42.724 53.208 36s1.073-12.167 2.396-12.167S58 29.276 58 36Z" fill="#fff" />
            </svg>
        </a>


    );
};

export default MediumIcon;