import React from 'react';

interface ProjectData {
  name: string;
  logo: string;
  amountRaised: string;
  initialMcap: string;
  currentMcap: string;
  roi: string;
}

const ProjectTable = () => {
  const projects: ProjectData[] = [
    {
      name: "Vulcan Forged",
      logo: "/logos/vulcan logo.png",
      amountRaised: "$ 5.2 Million",
      initialMcap: "$ 8 Million",
      currentMcap: "$ 992 Million",
      roi: "12,300%"
    },
    {
      name: "Morpheus.Network",
      logo: "/logos/Morpheus logo.png",
      amountRaised: "$ 3.1 Million",
      initialMcap: "$ 12 Million",
      currentMcap: "$ 192 Million",
      roi: "1,500%"
    },
    {
      name: "Landshare",
      logo: "/logos/Landshare logo.png",
      amountRaised: "$ 2.8 Million",
      initialMcap: "$ 15 Million",
      currentMcap: "$ 277 Million",
      roi: "1,747%"
    },
    {
      name: "Pencils Protocol",
      logo: "/logos/Pencils protocol logo.png",
      amountRaised: "$ 4.5 Million",
      initialMcap: "$ 18 Million",
      currentMcap: "$ 67 Million",
      roi: "274%"
    },
    {
      name: "Zebec Protocol",
      logo: "/logos/Zebec logo.png",
      amountRaised: "$ 28 Million",
      initialMcap: "$ 85 Million",
      currentMcap: "$ 150 Million",
      roi: "76%"
    },
    {
      name: "Dexcheck",
      logo: "/logos/Dexcheck logo.png",
      amountRaised: "$ 1.8 Million",
      initialMcap: "$ 6 Million",
      currentMcap: "$ 110 Million",
      roi: "1,725%"
    },
    {
      name: "Fomo.Fund",
      logo: "/logos/FomoFund logo.png",
      amountRaised: "$ 3.7 Million",
      initialMcap: "$ 22 Million",
      currentMcap: "$ 80 Million",
      roi: "262%"
    }
  ];

  return (
    <section className="max-w-screen-2xl shadow-[0_8px_24px_0_rgba(0,0,0,0.10)] self-center min-h-[400px] lg:min-h-[500px] w-full overflow-hidden bg-white mt-6 sm:mt-8 lg:mt-[41px] rounded-[10px] max-md:max-w-full max-md:mt-10">
      {/* Safari-style browser header */}
      <div className="w-full bg-[#E8E8E8] rounded-t-[10px] px-4 py-2">
        <div className="flex items-center">
          {/* Traffic lights and browser controls */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#FF5F57] rounded-full" />
            <div className="w-3 h-3 bg-[#FFBD2E] rounded-full" />
            <div className="w-3 h-3 bg-[#28CA42] rounded-full" />
          </div>
          
          {/* Browser navigation icons */}
          <div className="flex items-center gap-4 ml-6">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-600">
              <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
              <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
              <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
              <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-600">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-600">
              <path d="M9 19l7-7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          {/* URL bar */}
          <div className="flex-1 max-w-[600px] mx-auto">
            <div className="flex items-center bg-white rounded-md px-3 py-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gray-400 mr-2">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span className="text-sm text-gray-600">zuvomo.com</span>
            </div>
          </div>
          
          {/* Right side icons */}
          <div className="flex items-center gap-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-600">
              <path d="M4 12h16M4 12l-3 3m3-3l-3-3m20 3l-3 3m3-3l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-600">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-600">
              <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M5 15H3a2 2 0 01-2-2V3a2 2 0 012-2h10a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Table content */}
      <div className="w-full bg-white">
        <div className="overflow-x-auto overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
             style={{ scrollbarWidth: 'thin' }}>
          <table className="w-full min-w-[800px] table-auto">
            {/* Table header */}
            <thead className="sticky top-0 bg-[#F8F9FA] z-10">
              <tr className="border-b border-gray-200">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 min-w-[200px]">Supported Projects</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 min-w-[120px]">Amount Raised</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 min-w-[120px]">Initial Mcap</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 min-w-[120px]">Current Mcap</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 min-w-[100px]">ROI</th>
              </tr>
            </thead>
            
            {/* Table body */}
            <tbody>
              {projects.map((project, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-2 sm:px-4 lg:px-6 py-3 lg:py-4 w-[40%] sm:w-[35%]">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <img
                        src={project.logo}
                        className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 object-contain flex-shrink-0"
                        alt={`${project.name} logo`}
                      />
                      <span className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 truncate">{project.name}</span>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 lg:px-6 py-3 lg:py-4 text-xs sm:text-sm lg:text-base text-gray-700 w-[20%] sm:w-[15%] hidden sm:table-cell">{project.amountRaised}</td>
                  <td className="px-2 sm:px-4 lg:px-6 py-3 lg:py-4 text-xs sm:text-sm lg:text-base text-gray-700 w-[15%] hidden md:table-cell">{project.initialMcap}</td>
                  <td className="px-2 sm:px-4 lg:px-6 py-3 lg:py-4 text-xs sm:text-sm lg:text-base text-gray-700 w-[15%] hidden md:table-cell">{project.currentMcap}</td>
                  <td className="px-2 sm:px-4 lg:px-6 py-3 lg:py-4 w-[60%] sm:w-[35%] md:w-[20%]">
                    <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-col sm:flex-row lg:flex-row">
                      {/* Green chart visualization - responsive */}
                      <svg width="40" height="16" viewBox="0 0 80 24" className="flex-shrink-0 sm:w-[60px] sm:h-[18px] lg:w-[80px] lg:h-[24px]">
                        <polyline
                          points="5,20 15,16 25,18 35,12 45,8 55,10 65,4 75,6"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="2"
                        />
                        <polyline
                          points="5,20 15,16 25,18 35,12 45,8 55,10 65,4 75,6 75,24 5,24"
                          fill={`url(#grad-${index})`}
                          fillOpacity="0.2"
                        />
                        <defs>
                          <linearGradient id={`grad-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#10B981" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <span className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 text-center sm:text-left">{project.roi}</span>
                    </div>
                    {/* Mobile-only additional info */}
                    <div className="sm:hidden mt-1 text-xs text-gray-600 space-y-0.5">
                      <div>Raised: {project.amountRaised}</div>
                      <div className="md:hidden">Current: {project.currentMcap}</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ProjectTable;