import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import ChangePassword from './auth/ChangePassword';

const Header = () => {
  const { isAuthenticated, user, logout, isApproved } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Reusable navigation link styles
  const navLinkStyles = ({ isActive }: { isActive: boolean }) =>
    `relative px-6 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
      isActive
        ? "bg-brand-orange text-white shadow-lg"
        : "text-white hover:text-white hover:bg-white/10 hover:scale-105"
    }`;

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    window.location.href = '/login';
  };

  const handleSignUp = () => {
    window.location.href = '/signup';
  };

  const handleLogout = async () => {
    await logout();
  };

  const getDashboardUrl = () => {
    if (!user) return '/login';

    // Admin users always get access to dashboard regardless of approval status
    if (user.role === 'admin') {
      return '/admin';
    }

    // For non-admin users, check approval status
    if (!isApproved()) {
      console.log('Header: User not approved, redirecting to login', {
        userRole: user.role,
        approvalStatus: user.approval_status,
        isApproved: isApproved()
      });
      return '/login';
    }

    // Approved users get their respective dashboards
    switch (user.role) {
      case 'project_owner': return '/project-owner';
      case 'investor': return '/investor';
      default: return '/login';
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);
  return (
    <>
      {/* Top notification bar */}
      <div className="w-full bg-brand-light-blue py-2">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-center text-sm">
          <span className="text-brand-text-gray flex items-center gap-2">
            <span className="text-base">🔔</span>
            Monitor processor performance to mitigate the risk of financial loss.
          </span>
          <a href="#" className="text-brand-blue ml-3 hover:underline transition-colors duration-200 font-medium">
            Find out more →
          </a>
        </div>
      </div>

      {/* Main navigation */}
      <header className={`w-full bg-[#2F3A63] border-b border-[#2F3A63]/20 transition-all duration-300 sticky top-0 z-50
  ${isScrolled
          ? 'shadow-[0_4px_12px_0_rgba(47,58,99,0.35)]'  // darker, deeper shadow when scrolled
          : 'shadow-[0_2px_6px_0_rgba(47,58,99,0.20)]'   // subtle shadow by default
        }`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a href="/" className="flex-shrink-0 cursor-pointer">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/1dff84ef9a6b5c3ed5b94cf511907445481c3c6b?placeholderIfAbsent=true"
                className="h-10 w-auto hover:opacity-90 transition-opacity"
                alt="Zuvomo Logo"
              />
            </a>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-2">
              <NavLink to="/" className={navLinkStyles}>
                Explore
              </NavLink>
              <NavLink to="/startups" className={navLinkStyles}>
                Startups
              </NavLink>
              <NavLink to="/investors" className={navLinkStyles}>
                For Investors
              </NavLink>
              <NavLink to="/blog" className={navLinkStyles}>
                Blog
              </NavLink>
              <NavLink to="/case-studies" className={navLinkStyles}>
                Case Studies
              </NavLink>
              <NavLink to="/about-us" className={navLinkStyles}>
                About Us
              </NavLink>
              <NavLink to="/our-service" className={navLinkStyles}>
                Our Services
              </NavLink>
            </nav>

            {/* Auth buttons / User menu */}
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-navy"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                        <span className="text-brand-navy font-medium text-sm">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-white/80 capitalize">{user.role.replace('_', ' ')}</p>
                      </div>
                      <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border">
                      <a
                        href={getDashboardUrl()}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Dashboard
                      </a>
                      <a
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Profile Settings
                      </a>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowChangePassword(true);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Change Password
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    onClick={handleLogin}
                    className="px-5 py-2 text-[13px] text-[#2C91D5] bg-white font-medium rounded-full border border-[#2C91D5] hover:bg-[#2C91D5] hover:text-white transition-all duration-200 hover:scale-105"
                  >
                    Log In
                  </button>
                  <button
                    onClick={handleSignUp}
                    className="px-5 py-2 text-sm text-white bg-[#2C91D5] rounded-full border border-[#2C91D5] hover:opacity-90 transition-all duration-200 hover:scale-105"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMobileMenu();
              }}
              className="lg:hidden text-white hover:text-[#E3F2FD] transition-all duration-300 p-2 rounded-lg hover:bg-white/10 hover:scale-105"
              aria-label="Toggle mobile menu"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="relative">
                  {/* Hamburger lines with smooth animation */}
                  <span className={`block absolute h-0.5 w-6 bg-current transition-all duration-300 ${
                    isMobileMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-2'
                  }`}></span>
                  <span className={`block absolute h-0.5 w-6 bg-current transition-all duration-300 ${
                    isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}></span>
                  <span className={`block absolute h-0.5 w-6 bg-current transition-all duration-300 ${
                    isMobileMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-2'
                  }`}></span>
                </div>
              </div>
            </button>
          </div>

        {/* Mobile Navigation Backdrop */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={closeMobileMenu}
          />
        )}

        {/* Mobile Navigation Menu */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          isMobileMenuOpen
            ? 'max-h-screen opacity-100'
            : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-[#2F3A63] border-t border-white/10 pb-6">
            <nav className="flex flex-col space-y-1 pt-4 px-4">
              {/* Mobile Navigation Links */}
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-orange text-white shadow-lg'
                      : 'text-white hover:bg-white/10 hover:text-white'
                  }`
                }
                onClick={closeMobileMenu}
              >
                Explore
              </NavLink>
              <NavLink
                to="/startups"
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-orange text-white shadow-lg'
                      : 'text-white hover:bg-white/10 hover:text-white'
                  }`
                }
                onClick={closeMobileMenu}
              >
                Startups
              </NavLink>
              <NavLink
                to="/investors"
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-orange text-white shadow-lg'
                      : 'text-white hover:bg-white/10 hover:text-white'
                  }`
                }
                onClick={closeMobileMenu}
              >
                For Investors
              </NavLink>
              <NavLink
                to="/blog"
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-orange text-white shadow-lg'
                      : 'text-white hover:bg-white/10 hover:text-white'
                  }`
                }
                onClick={closeMobileMenu}
              >
                Blog
              </NavLink>
              <NavLink
                to="/case-studies"
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-orange text-white shadow-lg'
                      : 'text-white hover:bg-white/10 hover:text-white'
                  }`
                }
                onClick={closeMobileMenu}
              >
                Case Studies
              </NavLink>
              <NavLink
                to="/about-us"
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-orange text-white shadow-lg'
                      : 'text-white hover:bg-white/10 hover:text-white'
                  }`
                }
                onClick={closeMobileMenu}
              >
                About Us
              </NavLink>
              <NavLink
                to="/our-service"
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-orange text-white shadow-lg'
                      : 'text-white hover:bg-white/10 hover:text-white'
                  }`
                }
                onClick={closeMobileMenu}
              >
                Our Services
              </NavLink>

              {/* Mobile Auth Section */}
              <div className="pt-6 border-t border-white/10 mt-4">
                {isAuthenticated && user ? (
                  <>
                    <div className="flex items-center space-x-3 px-4 py-4 bg-white/5 rounded-xl mb-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <span className="text-brand-navy font-semibold text-sm">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-white/70 capitalize">{user.role.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <a
                        href={getDashboardUrl()}
                        className="w-full px-6 py-3 text-sm font-medium text-white bg-[#2C91D5] rounded-full border border-[#2C91D5] hover:opacity-90 transition-all duration-200 text-center block"
                        onClick={closeMobileMenu}
                      >
                        Dashboard
                      </a>
                      <button
                        onClick={() => {
                          closeMobileMenu();
                          handleLogout();
                        }}
                        className="w-full px-6 py-3 text-sm font-medium text-[#2C91D5] bg-white rounded-full border border-white hover:bg-gray-50 transition-all duration-200"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        handleLogin();
                      }}
                      className="w-full px-6 py-3 text-sm font-medium text-[#2C91D5] bg-white rounded-full border border-white hover:bg-gray-50 transition-all duration-200"
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        handleSignUp();
                      }}
                      className="w-full px-6 py-3 text-sm font-medium text-white bg-[#2C91D5] rounded-full border border-[#2C91D5] hover:opacity-90 transition-all duration-200"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
        </div>
      </header>

      {/* Change Password Modal */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <ChangePassword
            onSuccess={() => {
              setShowChangePassword(false);
            }}
            onCancel={() => setShowChangePassword(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;