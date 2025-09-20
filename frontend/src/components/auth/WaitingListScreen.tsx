import React from 'react';
import { Clock, CheckCircle, Mail, Phone, User, Building, Globe } from 'lucide-react';

interface WaitingListScreenProps {
  userType: 'investor' | 'project_owner';
  userName: string;
  userEmail: string;
  onContactSupport?: () => void;
}

export const WaitingListScreen: React.FC<WaitingListScreenProps> = ({
  userType,
  userName,
  userEmail,
  onContactSupport
}) => {
  const roleLabel = userType === 'investor' ? 'Venture Capital' : 'Project Owner';
  const roleDescription = userType === 'investor'
    ? 'investor account'
    : 'project owner account';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Application Under Review</h1>
          <p className="text-blue-100 text-lg">
            Your {roleDescription} is being processed by our team
          </p>
        </div>

        {/* Content Section */}
        <div className="p-8 space-y-6">
          {/* User Info Card */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Application Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{userEmail}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Building className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium text-gray-900">{roleLabel}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Application Status</h3>
            <div className="space-y-3">
              {/* Completed Step */}
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Application Submitted</p>
                  <p className="text-sm text-gray-500">Your registration has been received successfully</p>
                </div>
              </div>

              {/* Current Step */}
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Under Admin Review</p>
                  <p className="text-sm text-gray-500">Our team is reviewing your application details</p>
                </div>
              </div>

              {/* Pending Step */}
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-500">Account Activation</p>
                  <p className="text-sm text-gray-400">You'll receive access once approved</p>
                </div>
              </div>
            </div>
          </div>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">⏱️ Review Timeline</h4>
              <p className="text-sm text-blue-700">
                Most applications are reviewed within 24-48 hours during business days.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">📧 Email Notification</h4>
              <p className="text-sm text-green-700">
                You'll receive an email at {userEmail.split('@')[0]}@... once your account is approved.
              </p>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What Happens Next?</h3>
            <div className="space-y-3">
              {userType === 'investor' ? (
                <>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-indigo-500 rounded-full text-white text-xs flex items-center justify-center font-semibold">1</div>
                    <p className="text-sm text-gray-700">
                      <strong>Admin Review:</strong> Our team verifies your investor profile and credentials
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-indigo-500 rounded-full text-white text-xs flex items-center justify-center font-semibold">2</div>
                    <p className="text-sm text-gray-700">
                      <strong>Account Activation:</strong> You'll receive login credentials via email
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-indigo-500 rounded-full text-white text-xs flex items-center justify-center font-semibold">3</div>
                    <p className="text-sm text-gray-700">
                      <strong>Platform Access:</strong> Browse investment opportunities and connect with entrepreneurs
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-indigo-500 rounded-full text-white text-xs flex items-center justify-center font-semibold">1</div>
                    <p className="text-sm text-gray-700">
                      <strong>Profile Verification:</strong> Our team reviews your project owner credentials
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-indigo-500 rounded-full text-white text-xs flex items-center justify-center font-semibold">2</div>
                    <p className="text-sm text-gray-700">
                      <strong>Account Setup:</strong> You'll receive access to create and manage projects
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-indigo-500 rounded-full text-white text-xs flex items-center justify-center font-semibold">3</div>
                    <p className="text-sm text-gray-700">
                      <strong>Start Fundraising:</strong> Submit projects for investor review and funding
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Contact Section */}
          <div className="border-t pt-6">
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Have questions about your application?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={onContactSupport}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Contact Support</span>
                </button>
                <a
                  href="mailto:support@zuvomo.com"
                  className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>support@zuvomo.com</span>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WaitingListScreen;