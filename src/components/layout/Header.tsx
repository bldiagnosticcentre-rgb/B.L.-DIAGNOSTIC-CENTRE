import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Calendar, 
  Menu, 
  X, 
  Search, 
  Home, 
  FileText, 
  ShieldCheck, 
  User, 
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { BUSINESS_INFO } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export type PublicPage = 
  | 'home'
  | 'about'
  | 'services'
  | 'tests'
  | 'test-details'
  | 'packages'
  | 'package-details'
  | 'home-collection'
  | 'book'
  | 'contact'
  | 'faq'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'admin';

interface HeaderProps {
  currentPage: PublicPage;
  onNavigate: (page: PublicPage, param?: string) => void;
  selectedTestsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  selectedTestsCount,
}) => {
  const { user, isStaffOrAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (page: PublicPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      {/* Top Official Info Bar */}
      <div className="bg-[#0F294A] text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-3 text-slate-300">
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Near Post Office, Kumbha Marg, Sector 11, Pratap Nagar, Jaipur - 302033</span>
              <span className="sm:hidden">Pratap Nagar, Jaipur</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-300 text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              {BUSINESS_INFO.timings}
            </span>
            <span className="bg-emerald-700/80 text-white font-semibold px-2 py-0.5 rounded text-[11px] uppercase">
              Home Collection Available
            </span>
            <a 
              href={`tel:${BUSINESS_INFO.phone}`}
              className="flex items-center gap-1.5 font-bold text-white hover:text-emerald-300 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{BUSINESS_INFO.phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Name */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-lg bg-[#0F294A] flex items-center justify-center text-white border border-emerald-500/40">
              <span className="text-lg font-black tracking-tighter">B.L.</span>
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black text-[#0F294A] tracking-tight block">
                {BUSINESS_INFO.name}
              </span>
              <span className="text-xs font-semibold text-emerald-700 block">
                {BUSINESS_INFO.tagline}
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => handleNavClick('home')}
              className={`px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors ${
                currentPage === 'home' ? 'text-[#0F294A] bg-slate-100' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className={`px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors ${
                currentPage === 'about' ? 'text-[#0F294A] bg-slate-100' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              About
            </button>
            <button
              onClick={() => handleNavClick('services')}
              className={`px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors ${
                currentPage === 'services' ? 'text-[#0F294A] bg-slate-100' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Services
            </button>
            <button
              onClick={() => handleNavClick('tests')}
              className={`px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors ${
                currentPage === 'tests' ? 'text-[#0F294A] bg-slate-100' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Diagnostic Tests
            </button>
            <button
              onClick={() => handleNavClick('packages')}
              className={`px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors ${
                currentPage === 'packages' ? 'text-[#0F294A] bg-slate-100' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Packages
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className={`px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors ${
                currentPage === 'contact' ? 'text-[#0F294A] bg-slate-100' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Contact
            </button>
            <button
              onClick={() => handleNavClick('faq')}
              className={`px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors ${
                currentPage === 'faq' ? 'text-[#0F294A] bg-slate-100' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              FAQ
            </button>
          </nav>

          {/* Action CTAs: Book Test & Home Collection */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => handleNavClick('home-collection')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                currentPage === 'home-collection'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-600'
                  : 'bg-white text-emerald-800 border-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-emerald-700" />
              Home Collection
            </button>

            <button
              onClick={() => handleNavClick('book')}
              className="bg-[#0F294A] hover:bg-[#16365D] text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Book Test</span>
              {selectedTestsCount > 0 && (
                <span className="bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                  {selectedTestsCount}
                </span>
              )}
            </button>

            {/* Account / Login / Dashboard */}
            {currentPage === 'dashboard' ? (
              <button
                onClick={() => handleNavClick('dashboard')}
                className="bg-emerald-50 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>My Portal</span>
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('login')}
                className="p-2 text-slate-600 hover:text-[#0F294A] hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1"
                title="Account / Patient Portal"
              >
                <User className="w-4 h-4" />
                <span className="hidden xl:inline text-xs">Portal</span>
              </button>
            )}

            {/* Admin Panel quick button for STAFF and ADMIN */}
            {isStaffOrAdmin && (
              <button
                onClick={() => handleNavClick('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  currentPage === 'admin'
                    ? 'bg-[#0F294A] text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
                }`}
                title="Diagnostic Center Operations Console"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Admin</span>
              </button>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => handleNavClick('book')}
              className="bg-[#0F294A] text-white px-2.5 py-1.5 rounded-md text-xs font-bold"
            >
              Book Test
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-md"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100">
            <button
              onClick={() => handleNavClick('book')}
              className="bg-[#0F294A] text-white py-2.5 rounded-lg text-xs font-bold text-center"
            >
              Book A Test
            </button>
            <button
              onClick={() => handleNavClick('home-collection')}
              className="bg-emerald-50 border border-emerald-600 text-emerald-800 py-2.5 rounded-lg text-xs font-bold text-center"
            >
              Home Collection
            </button>
          </div>

          <div className="space-y-1 text-sm font-medium text-slate-700">
            <button onClick={() => handleNavClick('home')} className="w-full text-left py-2 px-2 hover:bg-slate-50 rounded">Home</button>
            <button onClick={() => handleNavClick('about')} className="w-full text-left py-2 px-2 hover:bg-slate-50 rounded">About</button>
            <button onClick={() => handleNavClick('services')} className="w-full text-left py-2 px-2 hover:bg-slate-50 rounded">Services</button>
            <button onClick={() => handleNavClick('tests')} className="w-full text-left py-2 px-2 hover:bg-slate-50 rounded">Diagnostic Tests</button>
            <button onClick={() => handleNavClick('packages')} className="w-full text-left py-2 px-2 hover:bg-slate-50 rounded">Health Packages</button>
            <button onClick={() => handleNavClick('contact')} className="w-full text-left py-2 px-2 hover:bg-slate-50 rounded">Contact</button>
            <button onClick={() => handleNavClick('faq')} className="w-full text-left py-2 px-2 hover:bg-slate-50 rounded">FAQ</button>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button onClick={() => handleNavClick('login')} className="text-slate-600 font-bold">Patient Login</button>
              <button onClick={() => handleNavClick('admin')} className="text-amber-800 font-bold">Admin Portal</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
