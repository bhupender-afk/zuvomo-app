import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
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
import NotFound from "./pages/NotFound";

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
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/admin-login" element={<Login />} />
            <Route path="/admin" element={
              <ErrorBoundary>
                <AdminDashboard />
              </ErrorBoundary>
            } />
            <Route path="/project-owner" element={
              <ErrorBoundary>
                <ProjectOwnerDashboard />
              </ErrorBoundary>
            } />
            <Route path="/investor" element={
              <ErrorBoundary>
                <InvestorDashboard />
              </ErrorBoundary>
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
