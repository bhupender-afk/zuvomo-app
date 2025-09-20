import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import EnhancedLoginForm from '../components/auth/EnhancedLoginForm';
import EnhancedSignupForm from '../components/auth/EnhancedSignupForm';
import OTPVerification from '../components/auth/OTPVerification';
import { useAuth } from '../contexts/AuthContext';
import authEnhancedService from '../services/authEnhanced';

export const AuthTest: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testResults, setTestResults] = useState<any>(null);

  // Test auth detection API
  const testAuthDetection = async () => {
    const result = await authEnhancedService.detectAuthMethods(testEmail);
    setTestResults(result);
  };

  // Test OTP request
  const testOTPRequest = async () => {
    const result = await authEnhancedService.resendOTP(testEmail, 'email_verification');
    setTestResults(result);
  };

  // Handle successful authentication
  const handleAuthSuccess = () => {
    console.log('Authentication successful!');
    // The auth context will automatically update
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Enhanced Authentication System Test
          </h1>
          <p className="text-gray-600">
            Test the intelligent authentication flow with OTP verification and OAuth integration
          </p>
        </div>

        {/* Current User Status */}
        {user && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-green-600">✅ Authentication Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>User:</strong> {user.first_name} {user.last_name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Verified:</strong> {user.is_verified ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Approval Status:</strong> {user.approval_status}</p>
                <button
                  onClick={() => logout()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* API Testing Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🧪 API Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Email
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email to test"
                  />
                </div>
                <button
                  onClick={testAuthDetection}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Test Auth Detection
                </button>
                <button
                  onClick={testOTPRequest}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Test OTP Request
                </button>
              </div>

              {testResults && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <h4 className="font-medium mb-2">API Response:</h4>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Authentication Components */}
        <Card>
          <CardHeader>
            <CardTitle>🔐 Authentication Components</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="login">Enhanced Login</TabsTrigger>
                <TabsTrigger value="signup">Enhanced Signup</TabsTrigger>
                <TabsTrigger value="otp">OTP Verification</TabsTrigger>
                <TabsTrigger value="features">Feature Test</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <div className="max-w-md mx-auto">
                  <EnhancedLoginForm
                    onSuccess={handleAuthSuccess}
                    onSwitchToSignup={() => setActiveTab('signup')}
                  />
                </div>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <div className="max-w-2xl mx-auto">
                  <EnhancedSignupForm
                    onSuccess={handleAuthSuccess}
                    onSwitchToLogin={() => setActiveTab('login')}
                  />
                </div>
              </TabsContent>

              <TabsContent value="otp" className="mt-6">
                <div className="max-w-md mx-auto">
                  <OTPVerification
                    email="test@example.com"
                    type="email_verification"
                    onSuccess={(data) => {
                      console.log('OTP verification success:', data);
                      setTestResults(data);
                    }}
                    title="Test OTP Verification"
                    description="This is a test of the OTP verification component"
                  />
                </div>
              </TabsContent>

              <TabsContent value="features" className="mt-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Feature Access Test */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Feature Access Control</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {user ? (
                          <div className="space-y-2">
                            {(() => {
                              const access = authEnhancedService.canAccessFeatures();
                              return (
                                <div>
                                  <p><strong>Can Login:</strong> {access.canLogin ? '✅' : '❌'}</p>
                                  <p><strong>Can Create Projects:</strong> {access.canCreateProjects ? '✅' : '❌'}</p>
                                  <p><strong>Can Invest:</strong> {access.canInvest ? '✅' : '❌'}</p>
                                  {access.message && (
                                    <p className="text-sm text-orange-600 mt-2">{access.message}</p>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <p className="text-gray-600">Please log in to test feature access</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Authentication Methods */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Authentication Methods</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {user ? (
                          <div className="space-y-2">
                            <p><strong>Authenticated:</strong> {authEnhancedService.isAuthenticated() ? '✅' : '❌'}</p>
                            <p><strong>Verified:</strong> {authEnhancedService.isVerified() ? '✅' : '❌'}</p>
                            <p><strong>Approved:</strong> {authEnhancedService.isApproved() ? '✅' : '❌'}</p>
                            <p><strong>Role:</strong> {user.role}</p>
                          </div>
                        ) : (
                          <p className="text-gray-600">Please log in to see authentication methods</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Test Scenarios */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Test Scenarios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium text-green-600 mb-2">✅ Test Scenario 1: Existing User Login</h4>
                          <p className="text-sm text-gray-600">
                            Try logging in with: <code className="bg-gray-100 px-2 py-1 rounded">admin@zuvomo.com</code> / <code className="bg-gray-100 px-2 py-1 rounded">admin123</code>
                          </p>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium text-blue-600 mb-2">🔄 Test Scenario 2: New User Signup</h4>
                          <p className="text-sm text-gray-600">
                            Create a new account and test the OTP verification flow
                          </p>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium text-purple-600 mb-2">🎯 Test Scenario 3: Auth Detection</h4>
                          <p className="text-sm text-gray-600">
                            Enter different email addresses in the login form to see intelligent authentication method detection
                          </p>
                        </div>

                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium text-orange-600 mb-2">🔐 Test Scenario 4: OTP Login</h4>
                          <p className="text-sm text-gray-600">
                            Use the "Email verification code" option in the login form to test passwordless authentication
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>📋 Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">1. Test Email Configuration</h4>
                <p className="text-sm text-gray-600">
                  OTP emails are currently configured to use Ethereal Email for testing.
                  Check the backend console for email links or modify the SMTP configuration in the .env file.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">2. Test Database</h4>
                <p className="text-sm text-gray-600">
                  The enhanced authentication system uses new database tables. Ensure the auth_enhancement.sql
                  script has been applied to your database.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">3. OAuth Testing</h4>
                <p className="text-sm text-gray-600">
                  Google OAuth requires proper client credentials in the .env file.
                  The OAuth button will appear when authentication methods support it.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">4. Feature Flow Testing</h4>
                <p className="text-sm text-gray-600">
                  Test the complete flow: Signup → Email Verification → Login → Feature Access Control
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthTest;