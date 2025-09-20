import React from 'react';
import { Building2, TrendingUp } from 'lucide-react';

interface UserTypeSelectorProps {
  selectedType: 'investor' | 'project_owner' | '';
  onChange: (type: 'investor' | 'project_owner') => void;
}

export const UserTypeSelector: React.FC<UserTypeSelectorProps> = ({ selectedType, onChange }) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        I am joining as a *
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Venture Capital Option */}
        <label
          className={`relative flex items-center p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedType === 'investor'
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            type="radio"
            name="userType"
            value="investor"
            checked={selectedType === 'investor'}
            onChange={() => onChange('investor')}
            className="sr-only"
          />
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${
              selectedType === 'investor' ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <TrendingUp className={`w-6 h-6 ${
                selectedType === 'investor' ? 'text-blue-600' : 'text-gray-600'
              }`} />
            </div>
            <div>
              <h3 className={`font-semibold text-lg ${
                selectedType === 'investor' ? 'text-blue-900' : 'text-gray-900'
              }`}>
                VC
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                I want to discover and invest in innovative projects
              </p>
              <ul className="text-xs text-gray-500 mt-2 space-y-1">
                <li>• Browse investment opportunities</li>
                <li>• Access detailed project information</li>
                <li>• Connect with entrepreneurs</li>
              </ul>
            </div>
          </div>
          {selectedType === 'investor' && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </label>

        {/* Chief Executive Officer Option */}
        <label
          className={`relative flex items-center p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedType === 'project_owner'
              ? 'border-green-500 bg-green-50 shadow-md'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            type="radio"
            name="userType"
            value="project_owner"
            checked={selectedType === 'project_owner'}
            onChange={() => onChange('project_owner')}
            className="sr-only"
          />
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${
              selectedType === 'project_owner' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <Building2 className={`w-6 h-6 ${
                selectedType === 'project_owner' ? 'text-green-600' : 'text-gray-600'
              }`} />
            </div>
            <div>
              <h3 className={`font-semibold text-lg ${
                selectedType === 'project_owner' ? 'text-green-900' : 'text-gray-900'
              }`}>
               CEO
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                I want to raise funding for my project or startup
              </p>
              <ul className="text-xs text-gray-500 mt-2 space-y-1">
                <li>• Showcase your project</li>
                <li>• Connect with investors</li>
                <li>• Manage funding campaigns</li>
              </ul>
            </div>
          </div>
          {selectedType === 'project_owner' && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </label>
      </div>
    </div>
  );
};

export default UserTypeSelector;