// Utility function to construct full URL for uploaded files
export const getFullImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';

  // If already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Get the base URL for uploads - in production, nginx serves uploads on the same domain
  let baseUrl: string;

  if (import.meta.env.MODE === 'production') {
    // In production, use the current origin (nginx serves uploads on same domain)
    baseUrl = window.location.origin;

    // Port 80 is default for HTTP and 443 for HTTPS, so origin already includes them correctly
  } else {
    // Development: backend serves uploads
    baseUrl = 'http://localhost:3001';
  }

  // Ensure URL starts with /
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;

  return `${baseUrl}${cleanUrl}`;
};

 export function handleJoinNow() {
        window.location.href = '/signup';
    }


export const staticData = {
    servicesData: [
        {
            icon: "https://api.builder.io/api/v1/image/assets/TEMP/8ce8ef7ef8c4e0cabe8d01e9fdb2d1ccc5d95062?placeholderIfAbsent=true",
            title: "Advisory",
            description: "From tokenomics to listing, we design your growth roadmap."
        },
        {
            icon: "https://api.builder.io/api/v1/image/assets/TEMP/07aec0b2d4b918e6cf8f8693d05dd64ddf9021ac?placeholderIfAbsent=true",
            title: "Funding",
            description: "Connect with 1000+ VCs, angels, and syndicates."
        },
        {
            icon: "https://api.builder.io/api/v1/image/assets/TEMP/379ff523d56d512107ce8b080603ef92ecb938de?placeholderIfAbsent=true",
            title: "Marketing",
            description: "Battle-tested tactics. Network of 2k+ KOLs, 100+ PR"
        },
        {
            icon: "https://api.builder.io/api/v1/image/assets/TEMP/d39452372f8ded7c2fd8ba119ddad5acb8b1ff3d?placeholderIfAbsent=true",
            title: "Liquidity",
            description: "Pools, OTC, and volume for lasting token demand."
        }
    ],
    forgeContent: [
        {
            title: "Fundamentals (Advisory)",
            description: "From tokenomics to listings, we craft roadmaps that scale. Backed 100+ startups, boosting valuations up to $500M with launches 40% faster.",
            icon: "https://api.builder.io/api/v1/image/assets/TEMP/1c4e2f0a4f0f4e8b6e2b5c6d7f8a9b0c1d2e3f4g?placeholderIfAbsent=true",
            slug: "the-forge-web3-startup-growth-insights"
        },
        {
            title: "Opportunity (VC/Private)",
            description: "Access 1,000+ VCs, angels, and syndicates. Helped founders raise $800M+ across 100+ projects, securing capital 3x faster.",
            icon: "https://api.builder.io/api/v1/image/assets/TEMP/2b3c4d5e67f8a9b0c1d2e3f4g5h6i7j8k9l0m1n?placeholderIfAbsent=true",
            slug: "navigating-web3-funding-guide"
        },
        {
            title: "Reach (Community)",
            description: "Grow with 2,000+ KOLs and 100+ PR outlets. Campaigns delivered 50M+ reach and 20%+ monthly active retention.",
            icon: "https://api.builder.io/api/v1/image/assets/TEMP/3c4d5e6f7g8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o?placeholderIfAbsent=true",
            slug: "top-5-marketing-strategies-web3-startups"
        },
        {
            title: "Generation (Token)",
            description: "We design and launch tokens with sustainable demand. Engineered liquidity pools that kept tokens trading strong post-launch.",
            icon: "https://api.builder.io/api/v1/image/assets/TEMP/1c4e2f0a4f0f4e8b6e2b5c6d7f8a9b0c1d2e3f4g?placeholderIfAbsent=true",
            slug: "the-forge-web3-startup-growth-insights"
        },
        {
            title: "Exchange",
            description: "From onboarding to post-listing, we manage CEX and DEX relations. Secured tier-1 listings and ensured smooth secondary markets.",
            icon: "https://api.builder.io/api/v1/image/assets/TEMP/3c4d5e6f7g8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o?placeholderIfAbsent=true",
            slug: "top-5-marketing-strategies-web3-startups"
        },
        {
            title: "Relations (Liquidity/IR)",
            description: "Maintain investor trust with clear reporting and liquidity support. Retained institutional confidence and stability through market cycles.",
            icon: "https://api.builder.io/api/v1/image/assets/TEMP/1c4e2f0a4f0f4e8b6e2b5c6d7f8a9b0c1d2e3f4g?placeholderIfAbsent=true",
            slug: "the-forge-web3-startup-growth-insights"
        }
    ] 
  }