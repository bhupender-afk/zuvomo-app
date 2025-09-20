import React from 'react';
import { DollarSign } from 'lucide-react';

interface InvestmentRangeSliderProps {
  selectedRange: string;
  onChange: (range: string) => void;
}

const investmentRanges = [
  { value: '0-10k', label: '$0 - $10K', description: 'Early-stage investments' },
  { value: '10k-50k', label: '$10K - $50K', description: 'Seed funding range' },
  { value: '50k-100k', label: '$50K - $100K', description: 'Growth investments' },
  { value: '100k-500k', label: '$100K - $500K', description: 'Series A range' },
  { value: '500k-1m', label: '$500K - $1M', description: 'Large investments' },
  { value: '1m+', label: '$1M+', description: 'Enterprise level' },
];

export const InvestmentRangeSlider: React.FC<InvestmentRangeSliderProps> = ({
  selectedRange,
  onChange
}) => {
  const currentIndex = investmentRanges.findIndex(range => range.value === selectedRange);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    onChange(investmentRanges[index].value);
  };

  return (
    <div className="space-y-4">
      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
        <DollarSign className="w-4 h-4" />
        <span>Investment Range *</span>
      </label>

      {/* Selected Range Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-blue-900">
              {selectedRange ? investmentRanges.find(r => r.value === selectedRange)?.label : 'Select a range'}
            </p>
            {selectedRange && (
              <p className="text-sm text-blue-600">
                {investmentRanges.find(r => r.value === selectedRange)?.description}
              </p>
            )}
          </div>
          <DollarSign className="w-8 h-8 text-blue-500" />
        </div>
      </div>

      {/* Range Slider */}
      <div className="space-y-4">
        <input
          type="range"
          min="0"
          max={investmentRanges.length - 1}
          value={currentIndex === -1 ? 0 : currentIndex}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((currentIndex + 1) / investmentRanges.length) * 100}%, #E5E7EB ${((currentIndex + 1) / investmentRanges.length) * 100}%, #E5E7EB 100%)`
          }}
        />

        {/* Range Labels */}
        <div className="flex justify-between text-xs text-gray-500 px-1">
          {investmentRanges.map((range, index) => (
            <div
              key={range.value}
              className={`text-center cursor-pointer ${
                index === currentIndex ? 'text-blue-600 font-medium' : ''
              }`}
              onClick={() => onChange(range.value)}
            >
              <div className="whitespace-nowrap">
                {range.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Range Options Grid (Alternative Selection) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
        {investmentRanges.map((range) => (
          <button
            key={range.value}
            type="button"
            onClick={() => onChange(range.value)}
            className={`p-3 text-sm border rounded-lg transition-all duration-200 ${
              selectedRange === range.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400 text-gray-700'
            }`}
          >
            <div className="font-medium">{range.label}</div>
            <div className="text-xs text-gray-500 mt-1">{range.description}</div>
          </button>
        ))}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default InvestmentRangeSlider;