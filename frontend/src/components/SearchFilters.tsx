import React, { useState, useEffect } from 'react';

interface SearchFiltersProps {
  onFiltersChange?: (filters: FilterState) => void;
  isLoading?: boolean;
}

interface FilterState {
  searchTerm: string;
  roundSize: string;
  geography: string;
  stage: string;
  fundingType?: string;
  industry?: string;
  foundedYear?: string;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ onFiltersChange, isLoading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roundSize, setRoundSize] = useState('');
  const [geography, setGeography] = useState('');
  const [stage, setStage] = useState('');
  const [fundingType, setFundingType] = useState('');
  const [industry, setIndustry] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [showAdvanceFilter, setShowAdvanceFilter] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search effect
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (onFiltersChange) {
        onFiltersChange({
          searchTerm,
          roundSize,
          geography,
          stage,
          fundingType,
          industry,
          foundedYear
        });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, roundSize, geography, stage, fundingType, industry, foundedYear, onFiltersChange]);

  const handleSearch = async () => {
    setIsSearching(true);
    
    const filters = {
      searchTerm,
      geography,
      stage,
      roundSize,
      fundingType,
      industry,
      foundedYear
    };

    console.log('Searching with filters:', filters);

    // Simulate search API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would make an API call here
      const resultsCount = Math.floor(Math.random() * 50) + 1;
      
      // Provide user feedback
      if (searchTerm || geography || stage || roundSize || fundingType || industry || foundedYear) {
        const filterSummary = [];
        if (searchTerm) filterSummary.push(`"${searchTerm}"`);
        if (geography) filterSummary.push(geography);
        if (stage) filterSummary.push(stage);
        if (roundSize) filterSummary.push(`$${roundSize}+`);
        
        alert(`🔍 Found ${resultsCount} projects matching: ${filterSummary.join(', ')}`);
      } else {
        alert(`📊 Showing all ${resultsCount} available projects`);
      }

      if (onFiltersChange) {
        onFiltersChange(filters);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('❌ Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdvanceFilter = () => {
    setShowAdvanceFilter(!showAdvanceFilter);
  };

  const handleReset = () => {
    setSearchTerm('');
    setGeography('');
    setStage('');
    setRoundSize('');
    setFundingType('');
    setIndustry('');
    setFoundedYear('');
    setShowAdvanceFilter(false);
    
    if (onFiltersChange) {
      onFiltersChange({
        searchTerm: '',
        roundSize: '',
        geography: '',
        stage: '',
        fundingType: '',
        industry: '',
        foundedYear: ''
      });
    }
  };

  const hasActiveFilters = searchTerm || geography || stage || roundSize || fundingType || industry || foundedYear;

  return (
    <div className="space-y-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-3 items-center bg-gray-50 p-4 rounded-xl">
        {/* Search Input - Wider */}
        <div className="relative flex-1 w-full lg:max-w-2xl">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9" 
                stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by industry type, name"
            className="w-full h-10 pl-10 pr-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Geography Dropdown - Medium size */}
        <select 
          value={geography}
          onChange={(e) => setGeography(e.target.value)}
          className="h-10 px-4 pr-10 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer min-w-[150px] w-full lg:w-auto bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-[right_0.75rem_center]"
        >
          <option value="">Geography</option>
          <option value="north-america">North America</option>
          <option value="europe">Europe</option>
          <option value="asia">Asia</option>
          <option value="africa">Africa</option>
          <option value="oceania">Oceania</option>
        </select>
        
        {/* Stage Dropdown - Medium size */}
        <select 
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="h-10 px-4 pr-10 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer min-w-[130px] w-full lg:w-auto bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-[right_0.75rem_center]"
        >
          <option value="">Stage</option>
          <option value="pre-seed">Pre-Seed</option>
          <option value="seed">Seed</option>
          <option value="series-a">Series A</option>
          <option value="series-b">Series B</option>
          <option value="series-c">Series C</option>
          <option value="ipo">IPO</option>
        </select>

        {/* Round Size Input - Compact */}
        <div className="flex items-center h-10 bg-white border border-gray-200 rounded-lg overflow-hidden w-full lg:w-auto">
          <div className="px-4 h-full flex items-center bg-gray-100 text-sm text-gray-600 font-medium border-r border-gray-200 whitespace-nowrap">
            Round Size ($)
          </div>
          <input
            type="text"
            value={roundSize}
            onChange={(e) => setRoundSize(e.target.value)}
            placeholder="Enter amount"
            className="px-3 h-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none w-[120px] bg-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={handleAdvanceFilter}
            className={`h-10 px-3 flex items-center gap-2 border rounded-lg text-sm font-medium transition-all duration-200 ${
              showAdvanceFilter 
                ? 'bg-[#2C91D5] text-white border-[#2C91D5]' 
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M14.667 2H1.333L6.667 8.44V13.333L9.333 12V8.44L14.667 2Z" 
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Advance Filter
          </button>
          
          {hasActiveFilters && (
            <button 
              onClick={handleReset}
              className="h-10 px-3 flex items-center gap-2 bg-gray-100 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all duration-200"
              title="Clear all filters"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Reset
            </button>
          )}
          
          <button 
            onClick={handleSearch}
            disabled={isSearching || isLoading}
            className={`h-10 px-8 bg-[#2C91D5] text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-md flex items-center gap-2 min-w-[100px] justify-center ${
              isSearching || isLoading 
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:bg-[#2475c2] active:bg-[#1c6fb0] hover:shadow-lg'
            }`}
          >
            {isSearching ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>
    
      {/* Advanced Filter Panel */}
      {showAdvanceFilter && (
        <div className="mt-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Advanced Filters</h3>
            {hasActiveFilters && (
              <span className="text-sm text-[#2C91D5] bg-blue-50 px-2 py-1 rounded-md">
                {[searchTerm, geography, stage, roundSize, fundingType, industry, foundedYear].filter(Boolean).length} active filters
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Funding Type</label>
              <select 
                value={fundingType}
                onChange={(e) => setFundingType(e.target.value)}
                className="w-full h-10 px-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-[right_0.75rem_center]"
              >
                <option value="">All Types</option>
                <option value="equity">Equity</option>
                <option value="debt">Debt</option>
                <option value="grants">Grants</option>
                <option value="token">Token Sale</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Industry</label>
              <select 
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full h-10 px-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-[right_0.75rem_center]"
              >
                <option value="">All Industries</option>
                <option value="fintech">FinTech</option>
                <option value="healthtech">HealthTech</option>
                <option value="edtech">EdTech</option>
                <option value="iot">IoT</option>
                <option value="ai">AI/ML</option>
                <option value="blockchain">Blockchain</option>
                <option value="defi">DeFi</option>
                <option value="gaming">Gaming</option>
                <option value="nft">NFT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Founded Year</label>
              <select 
                value={foundedYear}
                onChange={(e) => setFoundedYear(e.target.value)}
                className="w-full h-10 px-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-[right_0.75rem_center]"
              >
                <option value="">Any Year</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
                <option value="older">Before 2020</option>
              </select>
            </div>
          </div>
          
          {/* Apply filters button for advanced panel */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
            <button 
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Clear All
            </button>
            <button 
              onClick={() => {
                handleSearch();
                setShowAdvanceFilter(false);
              }}
              className="px-6 py-2 bg-[#2C91D5] text-white rounded-lg hover:bg-[#2475c2] transition-colors text-sm font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
export type { SearchFiltersProps, FilterState };