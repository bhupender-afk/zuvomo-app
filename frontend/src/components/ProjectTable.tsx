import React, { useState } from 'react';

interface ProjectData {
  name: string;
  logo: string;
  amountRaised: string;
  initialMcap: string;
  currentMcap: string;
  roi: string;
}

const ProjectTable = () => {
  const [expandedCards, setExpandedCards] = useState<number[]>([]);

  const toggleCard = (index: number) => {
    setExpandedCards(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const projects: ProjectData[] = [

    {
      name: "Morpheus.Network",
      logo: "/logos/Morpheus logo.png",
      amountRaised: "$9.88 Million",
      initialMcap: "$12 Million",
      currentMcap: "$204 Million",
      roi: "1,500%"
    },
    {
      name: "Zebec Protocol",
      logo: "/logos/Zebec logo.png",
      amountRaised: "$6 Million",
      initialMcap: "$85 Million",
      currentMcap: "$554 Million",
      roi: "76%"
    },

    {
      name: "Pencils Protocol",
      logo: "/logos/Pencils protocol logo.png",
      amountRaised: "$4.5 Million",
      initialMcap: "$18 Million",
      currentMcap: "$2.4 Million",
      roi: "274%"
    },
    {
      name: "Fomo.Fund",
      logo: "/logos/FomoFund logo.png",
      amountRaised: "$2 Million",
      initialMcap: "$22 Million",
      currentMcap: "$59 Million",
      roi: "262%"
    },
    {
      name: "Vulcan Forged",
      logo: "/logos/vulcan logo.png",
      amountRaised: "$2 Million",
      initialMcap: "$8 Million",
      currentMcap: "$928 Million",
      roi: "12,300%"
    },


    {
      name: "Dexcheck",
      logo: "/logos/Dexcheck logo.png",
      amountRaised: "$1 Million",
      initialMcap: "$6 Million",
      currentMcap: "$60 Million",
      roi: "1,725%"
    },
    {
      name: "Landshare",
      logo: "/logos/Landshare logo.png",
      amountRaised: "$1 Million",
      initialMcap: "$15 Million",
      currentMcap: "$27 Million",
      roi: "1,747%"
    },

  ];

  return (
    <section className="w-full max-w-screen-2xl shadow-[0_8px_24px_0_rgba(0,0,0,0.10)] self-center bg-white mt-4 sm:mt-6 lg:mt-[41px] rounded-lg overflow-hidden">
      {/* Responsive Safari-style browser header */}
      <div className="w-full bg-[#E8E8E8] rounded-t-lg px-2 sm:px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#FF5F57] rounded-full" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#FFBD2E] rounded-full" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#28CA42] rounded-full" />
          </div>

          {/* Navigation icons - hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2 lg:gap-4 ml-4 lg:ml-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-600 lg:w-5 lg:h-5">
              <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" />
              <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" />
              <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" />
              <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" />
            </svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-600 lg:w-5 lg:h-5">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-600 lg:w-5 lg:h-5">
              <path d="M9 19l7-7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* URL bar */}
          <div className="flex-1 max-w-[200px] sm:max-w-[400px] lg:max-w-[600px] mx-2 sm:mx-auto">
            <div className="flex items-center bg-white rounded px-2 sm:px-3 py-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-gray-400 mr-1 sm:mr-2 sm:w-[14px] sm:h-[14px]">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className="text-xs sm:text-sm text-gray-600 truncate">zuvomo.com</span>
            </div>
          </div>

          {/* Right side icons - simplified for mobile */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-600 lg:w-5 lg:h-5">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="hidden sm:block">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-600 lg:w-5 lg:h-5">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M5 15H3a2 2 0 01-2-2V3a2 2 0 012-2h10a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Card Layout (< 640px) */}
      <div className="sm:hidden">
        <div className="px-3 py-4 space-y-3 max-h-[500px] overflow-y-auto">
          {projects.map((project, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              {/* Project Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={project.logo}
                    className="w-8 h-8 object-contain flex-shrink-0"
                    alt={`${project.name} logo`}
                  />
                  <h3 className="font-semibold text-gray-900 truncate text-sm">{project.name}</h3>
                </div>
                <button
                  onClick={() => toggleCard(index)}
                  className="p-1 text-gray-500 hover:text-gray-700 flex-shrink-0"
                  aria-label={expandedCards.includes(index) ? "Show less" : "Show more"}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`transform transition-transform ${expandedCards.includes(index) ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <span className="text-xs text-gray-500 block">ROI</span>
                  <div className="flex items-center gap-2">
                    <svg width="30" height="12" viewBox="0 0 80 24" className="flex-shrink-0">
                      <polyline
                        points="5,20 15,16 25,18 35,12 45,8 55,10 65,4 75,6"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2"
                      />
                      <defs>
                        <linearGradient id={`grad-mobile-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="font-bold text-sm text-gray-900">{project.roi}</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Amount Raised</span>
                  <span className="font-medium text-sm text-gray-900">{project.amountRaised}</span>
                </div>
              </div>

              {/* Expandable Details */}
              {expandedCards.includes(index) && (
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-gray-500 block">Initial Mcap</span>
                      <span className="font-medium text-sm text-gray-900">{project.initialMcap}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Peak Mcap</span>
                      <span className="font-medium text-sm text-gray-900">{project.currentMcap}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tablet & Desktop Table Layout (≥ 640px) */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto">
          <div className="overflow-y-auto max-h-[500px]">
            <table className="w-full">
              {/* Table header */}
              <thead className="sticky top-0 bg-[#F8F9FA] z-10">
                <tr className="border-b border-gray-200">
                  <th className="text-left px-3 lg:px-6 py-3 lg:py-4 text-sm font-medium text-gray-700 min-w-[180px] lg:min-w-[220px]">
                    Supported Projects
                  </th>
                  <th className="text-left px-3 lg:px-6 py-3 lg:py-4 text-sm font-medium text-gray-700 min-w-[110px] lg:min-w-[140px]">
                    Amount Raised
                  </th>
                  <th className="text-left px-3 lg:px-6 py-3 lg:py-4 text-sm font-medium text-gray-700 min-w-[100px] lg:min-w-[130px] hidden md:table-cell">
                    Initial Mcap
                  </th>
                  <th className="text-left px-3 lg:px-6 py-3 lg:py-4 text-sm font-medium text-gray-700 min-w-[100px] lg:min-w-[130px]">
                    Peak Mcap
                  </th>
                  <th className="text-left px-3 lg:px-6 py-3 lg:py-4 text-sm font-medium text-gray-700 min-w-[120px] lg:min-w-[160px]">
                    ROI
                  </th>
                </tr>
              </thead>

              {/* Table body */}
              <tbody>
                {projects.map((project, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-3 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <img
                          src={project.logo}
                          className="w-8 h-8 lg:w-10 lg:h-10 object-contain flex-shrink-0"
                          alt={`${project.name} logo`}
                        />
                        <span className="text-sm lg:text-base font-semibold text-gray-900 truncate max-w-[120px] lg:max-w-[160px]">
                          {project.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4 text-sm lg:text-base text-gray-700">
                      {project.amountRaised}
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4 text-sm lg:text-base text-gray-700 hidden md:table-cell">
                      {project.initialMcap}
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4 text-sm lg:text-base text-gray-700">
                      {project.currentMcap}
                    </td>
                    <td className="px-3 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <svg width="50" height="18" viewBox="0 0 80 24" className="flex-shrink-0 lg:w-[70px] lg:h-[22px]">
                          <polyline
                            points="5,20 15,16 25,18 35,12 45,8 55,10 65,4 75,6"
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="2"
                          />
                          <polyline
                            points="5,20 15,16 25,18 35,12 45,8 55,10 65,4 75,6 75,24 5,24"
                            fill={`url(#grad-desktop-${index})`}
                            fillOpacity="0.2"
                          />
                          <defs>
                            <linearGradient id={`grad-desktop-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#10B981" />
                              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <span className="text-sm lg:text-base font-semibold text-gray-900">
                          {project.roi}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectTable;