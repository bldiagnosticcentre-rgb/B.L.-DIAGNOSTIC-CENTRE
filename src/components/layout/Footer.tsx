import React from 'react';
import { MapPin, Phone, Mail, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { BUSINESS_INFO } from '../../types';
import { PublicPage } from './Header';
import { ContentRequiredBadge } from '../ui/DesignSystem';

interface FooterProps {
  onNavigate: (page: PublicPage) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#0F294A] text-slate-300 border-t border-slate-700/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-white text-sm">
                BL
              </div>
              <span className="text-white font-bold text-base">{BUSINESS_INFO.name}</span>
            </div>
            <p className="text-xs text-emerald-400 font-semibold italic">
              &ldquo;{BUSINESS_INFO.tagline}&rdquo;
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Diagnostic and pathology center providing verified laboratory tests, health packages, and home sample collection.
            </p>
            <div className="pt-1">
              <span className="inline-block bg-emerald-900/60 border border-emerald-600/40 text-emerald-300 text-[11px] font-semibold px-2 py-0.5 rounded">
                Home Collection Available
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 text-xs">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  About Center
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  Services
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('tests')} className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  Diagnostic Tests & Rates
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('packages')} className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  Health Packages
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Booking & Access */}
          <div className="space-y-3 text-xs">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs">Appointments & Access</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('book')} className="hover:text-white transition-colors flex items-center gap-1.5 font-semibold text-emerald-400">
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  Book Test Appointment
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('home-collection')} className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  Home Sample Collection
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('login')} className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  Patient Login / Account
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin')} className="hover:text-white transition-colors flex items-center gap-1.5 text-amber-300">
                  <ChevronRight className="w-3.5 h-3.5 text-amber-300" />
                  Staff & Admin Processing
                </button>
              </li>
            </ul>

            <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-700/60">
              <span className="font-semibold text-white">Payment Notice:</span>
              <p className="mt-0.5">Pay at collection or during center visit. No online payment required.</p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3 text-xs">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs">Contact & Location</h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{BUSINESS_INFO.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`tel:${BUSINESS_INFO.phone}`} className="hover:text-emerald-300 font-bold">
                  +91 {BUSINESS_INFO.phone}
                </a>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{BUSINESS_INFO.timings}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal & Policy Row */}
        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} {BUSINESS_INFO.name}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span>Privacy Policy: <ContentRequiredBadge text="[CONTENT REQUIRED]" /></span>
            <span>Terms of Service: <ContentRequiredBadge text="[CONTENT REQUIRED]" /></span>
          </div>
        </div>
      </div>
    </footer>
  );
};
