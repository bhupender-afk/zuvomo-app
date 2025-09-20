import React from 'react';
import { BarChart3 } from 'lucide-react';

interface PortfolioSizeSelectorProps {
  selectedSize: string;
  onChange: (size: string) => void;
}

const portfolioSizes = [
  { value: '1-5', label: '1-5 companies', description: 'Small focused portfolio' },
  { value: '6-15', label: '6-15 companies', description: 'Medium diversified portfolio' },
  { value: '16-30', label: '16-30 companies', description: 'Large diversified portfolio' },
  { value: '30+', label: '30+ companies', description: 'Extensive investment portfolio' },
];

export const PortfolioSizeSelector: React.FC<PortfolioSizeSelectorProps> = ({
  selectedSize,
  onChange
}) => {
  return (
    <div className="space-y-3">
      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
        <BarChart3 className="w-4 h-4" />
        <span>Current Portfolio Size *</span>
      </label>

      <div className="relative">
        <select
          value={selectedSize}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
        >
          <option value="" disabled className="text-gray-500">
            Select your current portfolio size
          </option>
          {portfolioSizes.map((size) => (
            <option key={size.value} value={size.value} className="text-gray-900">
              {size.label}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Selected size description */}
      {selectedSize && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <div>
              <p className="font-medium text-blue-900">
                {portfolioSizes.find(s => s.value === selectedSize)?.label}
              </p>
              <p className="text-sm text-blue-600">
                {portfolioSizes.find(s => s.value === selectedSize)?.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alternative button selection */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {portfolioSizes.map((size) => (
          <button
            key={size.value}
            type="button"
            onClick={() => onChange(size.value)}
            className={`p-3 text-sm border rounded-lg transition-all duration-200 ${
              selectedSize === size.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400 text-gray-700'
            }`}
          >
            <div className="font-medium">{size.label}</div>
            <div className="text-xs text-gray-500 mt-1">{size.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PortfolioSizeSelector;