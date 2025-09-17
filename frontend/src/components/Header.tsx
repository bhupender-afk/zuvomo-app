import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
    switch (user.role) {
      case 'admin': return '/admin';
      case 'project_owner': return '/project-owner';
      case 'investor': return '/investor';
      default: return '/login';
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = (sectionId: string, event: React.MouseEvent) => {
    event.preventDefault();
    
    // Close mobile menu if open
    setIsMobileMenuOpen(false);
    
    // Smooth scroll to section
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleExternalLink = (url: string, event: React.MouseEvent) => {
    event.preventDefault();
    setIsMobileMenuOpen(false);
    window.open(url, '_blank', 'noopener,noreferrer');
  };
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
      <header className={`w-full bg-[#2C91D5] shadow-[0_2px_6px_0_rgba(44,145,213,0.20)] border-b border-[#2C91D5]/20 transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''} sticky top-0 z-50`}>
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
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              <a 
                href="#projects" 
                onClick={(e) => handleNavClick('projects', e)}
                className="text-white px-4 py-1.5 bg-brand-orange rounded-full text-sm hover:bg-orange-600 transition-colors"
              >
                Explore
              </a>
              <a 
                href="#projects" 
                onClick={(e) => handleNavClick('projects', e)}
                className="text-white hover:text-[#E3F2FD] transition-colors text-sm"
              >
                Startups
              </a>
              <a 
                href="#services" 
                onClick={(e) => handleNavClick('services', e)}
                className="text-white hover:text-[#E3F2FD] transition-colors text-sm"
              >
                For Investors
              </a>
              <a 
                href="#team" 
                onClick={(e) => handleNavClick('team', e)}
                className="text-white hover:text-[#E3F2FD] transition-colors text-sm"
              >
                About Us
              </a>
              <a 
                href="#services" 
                onClick={(e) => handleNavClick('services', e)}
                className="text-white hover:text-[#E3F2FD] transition-colors text-sm"
              >
                Our Services
              </a>
              <Link 
                to="/blog"
                className="text-white hover:text-[#E3F2FD] transition-colors text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Blog
              </Link>
              <Link 
                to="/case-studies"
                className="text-white hover:text-[#E3F2FD] transition-colors text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Case Studies
              </Link>
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
              onClick={toggleMobileMenu}
              className="lg:hidden text-white hover:text-[#E3F2FD] transition-colors"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                />
              </svg>
            </button>
          </div>
          
          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t border-white/20">
              <nav className="flex flex-col space-y-3 pt-4">
                <a 
                  href="#projects" 
                  onClick={(e) => handleNavClick('projects', e)}
                  className="text-white px-4 py-2 bg-brand-orange rounded-full text-sm text-center hover:bg-orange-600 transition-colors"
                >
                  Explore
                </a>
                <a 
                  href="#projects" 
                  onClick={(e) => handleNavClick('projects', e)}
                  className="text-white hover:text-[#E3F2FD] transition-colors text-sm px-4 py-2"
                >
                  Startups
                </a>
                <a 
                  href="#services" 
                  onClick={(e) => handleNavClick('services', e)}
                  className="text-white hover:text-[#E3F2FD] transition-colors text-sm px-4 py-2"
                >
                  For Investors
                </a>
                <a 
                  href="#team" 
                  onClick={(e) => handleNavClick('team', e)}
                  className="text-white hover:text-[#E3F2FD] transition-colors text-sm px-4 py-2"
                >
                  About Us
                </a>
                <a 
                  href="#services" 
                  onClick={(e) => handleNavClick('services', e)}
                  className="text-white hover:text-[#E3F2FD] transition-colors text-sm px-4 py-2"
                >
                  Our Services
                </a>
                <Link 
                  to="/blog"
                  className="text-white hover:text-[#E3F2FD] transition-colors text-sm px-4 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Blog
                </Link>
                <Link 
                  to="/case-studies"
                  className="text-white hover:text-[#E3F2FD] transition-colors text-sm px-4 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Case Studies
                </Link>
                
                {/* Mobile auth buttons / User menu */}
                <div className="flex flex-col gap-2 pt-4">
                  {isAuthenticated && user ? (
                    <>
                      <div className="flex items-center space-x-3 px-4 py-3 bg-white/10 rounded-lg mb-2">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                          <span className="text-brand-navy font-medium">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-white/80 capitalize">{user.role.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <a
                        href={getDashboardUrl()}
                        className="px-5 py-2 text-sm text-white bg-[#2C91D5] rounded-full border border-[#2C91D5] hover:opacity-90 transition-opacity text-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Dashboard
                      </a>
                      <button 
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleLogout();
                        }}
                        className="px-5 py-2 text-[13px] text-[#2C91D5] bg-white font-medium rounded-full border border-[#2C91D5] hover:bg-[#2C91D5] hover:text-white transition-colors"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={handleLogin}
                        className="px-5 py-2 text-[13px] text-[#2C91D5] bg-white font-medium rounded-full border border-[#2C91D5] hover:bg-[#2C91D5] hover:text-white transition-colors"
                      >
                        Log In
                      </button>
                      <button 
                        onClick={handleSignUp}
                        className="px-5 py-2 text-sm text-white bg-[#2C91D5] rounded-full border border-[#2C91D5] hover:opacity-90 transition-opacity"
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;