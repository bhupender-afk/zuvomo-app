// This is a replacement component with complete validation
// Will replace RejectionScreen.tsx after testing

// Add specific validation styling patterns for remaining fields:

// First Name field validation:
className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
  errors.first_name ? 'border-red-500' : 'border-gray-300'
}`}
{errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}

// Last Name field validation:
className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
  errors.last_name ? 'border-red-500' : 'border-gray-300'
}`}
{errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}

// Location field validation:
className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
  errors.location ? 'border-red-500' : 'border-gray-300'
}`}
{errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}

// Bio field validation:
className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
  errors.bio ? 'border-red-500' : 'border-gray-300'
}`}
{errors.bio && <p className="text-red-500 text-sm">{errors.bio}</p>}

// LinkedIn URL validation:
className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
  errors.linkedin ? 'border-red-500' : 'border-gray-300'
}`}
{errors.linkedin && <p className="text-red-500 text-sm mt-1">{errors.linkedin}</p>}

// Website URL validation:
className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
  errors.website_url ? 'border-red-500' : 'border-gray-300'
}`}
{errors.website_url && <p className="text-red-500 text-sm mt-1">{errors.website_url}</p>}

// Investment category validation:
className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
  errors.preferred_category ? 'border-red-500' : 'border-gray-300'
}`}
{errors.preferred_category && <p className="text-red-500 text-sm mt-1">{errors.preferred_category}</p>}

// Investment range validation:
className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
  errors.investment_range ? 'border-red-500' : 'border-gray-300'
}`}
{errors.investment_range && <p className="text-red-500 text-sm mt-1">{errors.investment_range}</p>}

// Portfolio size validation:
className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
  errors.current_portfolio_size ? 'border-red-500' : 'border-gray-300'
}`}
{errors.current_portfolio_size && <p className="text-red-500 text-sm mt-1">{errors.current_portfolio_size}</p>}

// Investment focus list validation:
{errors.investment_focus_list && <p className="text-red-500 text-sm mt-1">{errors.investment_focus_list}</p>}

// Submit button validation:
className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
  isLoading || !canSubmit
    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
}`}
disabled={isLoading || !canSubmit}