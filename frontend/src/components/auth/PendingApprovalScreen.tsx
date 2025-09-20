import React from 'react';
import { Clock, Mail, Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface PendingApprovalScreenProps {
  userEmail?: string;
  userRole?: 'investor' | 'project_owner';
  onBackToLogin?: () => void;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({
  userEmail = '',
  userRole = 'investor',
  onBackToLogin
}) => {
  const roleLabel = userRole === 'investor' ? 'Investor' : 'Project Owner';
  const roleDescription = userRole === 'investor'
    ? 'investment opportunities and portfolio management'
    : 'project funding and management tools';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Account Pending Approval
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your {roleLabel.toLowerCase()} account is being reviewed
            </p>
          </div>

          {/* Status Information */}
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-amber-800 font-medium">Under Review</h3>
                  <p className="text-amber-700 text-sm mt-1">
                    Your application is currently being reviewed by our admin team.
                    This process typically takes 1-2 business days.
                  </p>
                </div>
              </div>
            </div>

            {userEmail && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-blue-800 font-medium">Email Confirmation</h3>
                    <p className="text-blue-700 text-sm mt-1">
                      We'll send approval notification to{' '}
                      <span className="font-medium">{userEmail}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* What's Next */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">What happens next?</h3>

              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100">
                      <span className="text-blue-600 text-sm font-medium">1</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">
                      Our team reviews your application and profile information
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100">
                      <span className="text-blue-600 text-sm font-medium">2</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">
                      You'll receive an email notification with the approval decision
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-100">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">
                      Once approved, you'll gain access to {roleDescription}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Type Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Account Type: {roleLabel}</h4>
              <p className="text-sm text-gray-600">
                {userRole === 'investor' ? (
                  <>
                    As an investor, you'll be able to browse investment opportunities,
                    access detailed project information, connect with entrepreneurs,
                    and manage your investment portfolio.
                  </>
                ) : (
                  <>
                    As a project owner, you'll be able to create and manage project listings,
                    upload pitch materials, communicate with potential investors,
                    and track funding progress.
                  </>
                )}
              </p>
            </div>

            {/* Additional Information */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">
                    <strong>Need help or have questions?</strong>
                    <br />
                    Contact our support team at{' '}
                    <a href="mailto:support@zuvomo.com" className="text-blue-600 hover:text-blue-500">
                      support@zuvomo.com
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Back to Login Button */}
            {onBackToLogin && (
              <div className="pt-4">
                <button
                  onClick={onBackToLogin}
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalScreen;