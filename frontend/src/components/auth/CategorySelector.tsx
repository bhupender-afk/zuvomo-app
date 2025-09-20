import React from 'react';
import { Target, Check } from 'lucide-react';

interface CategorySelectorProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
}

const investmentCategories = [
  {
    value: 'layer1',
    label: 'Layer 1',
    description: 'Blockchain protocols and base layer networks',
    color: 'bg-purple-50 border-purple-200 text-purple-700'
  },
  {
    value: 'rwa',
    label: 'RWA',
    description: 'Real World Assets tokenization',
    color: 'bg-green-50 border-green-200 text-green-700'
  },
  {
    value: 'defi',
    label: 'DeFi',
    description: 'Decentralized Finance protocols',
    color: 'bg-blue-50 border-blue-200 text-blue-700'
  },
  {
    value: 'ai',
    label: 'AI',
    description: 'Artificial Intelligence and machine learning',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700'
  },
  {
    value: 'nfts-gaming',
    label: 'NFTs & Gaming',
    description: 'Non-fungible tokens and blockchain gaming',
    color: 'bg-pink-50 border-pink-200 text-pink-700'
  },
  {
    value: 'infrastructure-oracles',
    label: 'Infrastructure & Oracles',
    description: 'Blockchain infrastructure and data oracles',
    color: 'bg-orange-50 border-orange-200 text-orange-700'
  },
  {
    value: 'memecoins',
    label: 'Memecoins',
    description: 'Community-driven and meme-based tokens',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-700'
  },
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategories,
  onChange
}) => {
  const handleCategoryToggle = (categoryValue: string) => {
    if (selectedCategories.includes(categoryValue)) {
      onChange(selectedCategories.filter(cat => cat !== categoryValue));
    } else {
      onChange([...selectedCategories, categoryValue]);
    }
  };

  return (
    <div className="space-y-4">
      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
        <Target className="w-4 h-4" />
        <span>Investment Categories of Interest *</span>
      </label>

      <p className="text-sm text-gray-500">
        Select all categories that match your investment interests. You can choose multiple options.
      </p>

      {/* Selected count indicator */}
      {selectedCategories.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-blue-500" />
            <p className="text-sm font-medium text-blue-900">
              {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'} selected
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedCategories.map(catValue => {
              const category = investmentCategories.find(cat => cat.value === catValue);
              return (
                <span key={catValue} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {category?.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Category grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {investmentCategories.map((category) => {
          const isSelected = selectedCategories.includes(category.value);

          return (
            <label
              key={category.value}
              className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? category.color + ' shadow-md'
                  : 'border-gray-300 hover:border-gray-400 bg-white'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleCategoryToggle(category.value)}
                className="sr-only"
              />

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold text-sm ${
                    isSelected ? 'text-current' : 'text-gray-900'
                  }`}>
                    {category.label}
                  </h3>
                  {isSelected && (
                    <div className="w-5 h-5 bg-current rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <p className={`text-xs mt-1 ${
                  isSelected ? 'text-current opacity-80' : 'text-gray-500'
                }`}>
                  {category.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {/* Selection guidance */}
      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
        <p>💡 <strong>Tip:</strong> Select categories that align with your investment thesis and expertise. This helps us match you with relevant opportunities.</p>
      </div>
    </div>
  );
};

export default CategorySelector;