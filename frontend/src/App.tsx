import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProjectOwnerDashboard from "./pages/project-owner/ProjectOwnerDashboard";
import InvestorDashboard from "./pages/investor/InvestorDashboard";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import CaseStudies from "./pages/CaseStudies";
import CaseStudy from "./pages/CaseStudy";
import AuthTest from "./pages/AuthTest";
import NotFound from "./pages/NotFound";
import OAuthCallback from "./pages/auth/OAuthCallback";
import ProfileCompletion from "./pages/auth/ProfileCompletion";
import Startup from "./components/staticComponents/Startup";
import AboutUs from "./components/staticComponents/AboutUs";
import Investor from "./components/staticComponents/Investor";
import OurService from "./components/staticComponents/OurService";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/our-service" element={<OurService />} />
            <Route path="/investors" element={<Investor />} />
            <Route path="/startups" element={<Startup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/admin-login" element={<Login />} />
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']} requireApproval={false}>
                <ErrorBoundary>
                  <AdminDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/project-owner" element={
              <ProtectedRoute allowedRoles={['project_owner']} requireApproval={true}>
                <ErrorBoundary>
                  <ProjectOwnerDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/investor" element={
              <ProtectedRoute allowedRoles={['investor']} requireApproval={true}>
                <ErrorBoundary>
                  <InvestorDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            {/* Blog and Case Study routes */}
            <Route path="/blog" element={
              <ErrorBoundary>
                <Blog />
              </ErrorBoundary>
            } />
            <Route path="/blog/:slug" element={
              <ErrorBoundary>
                <BlogPost />
              </ErrorBoundary>
            } />
            <Route path="/case-studies" element={
              <ErrorBoundary>
                <CaseStudies />
              </ErrorBoundary>
            } />
            <Route path="/case-studies/:slug" element={
              <ErrorBoundary>
                <CaseStudy />
              </ErrorBoundary>
            } />
            {/* Enhanced Authentication Test */}
            <Route path="/auth-test" element={
              <ErrorBoundary>
                <AuthTest />
              </ErrorBoundary>
            } />
            {/* OAuth Callback Routes */}
            <Route path="/auth/callback/google" element={
              <ErrorBoundary>
                <OAuthCallback />
              </ErrorBoundary>
            } />
            <Route path="/auth/callback/linkedin" element={
              <ErrorBoundary>
                <OAuthCallback />
              </ErrorBoundary>
            } />
            <Route path="/auth/callback" element={
              <ErrorBoundary>
                <OAuthCallback />
              </ErrorBoundary>
            } />
            <Route path="/auth/profile-completion" element={
              <ErrorBoundary>
                <ProfileCompletion />
              </ErrorBoundary>
            } />
            {/* Backward compatibility routes */}
            <Route path="/dashboard" element={<Login />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
