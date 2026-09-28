import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Phone, 
  Clock, 
  Home as HomeIcon, 
  Calendar, 
  ArrowRight, 
  Check, 
  Droplet, 
  AlertCircle,
  ShieldCheck,
  FileCheck2,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { DiagnosticTest, BUSINESS_INFO } from '../types';
import { OFFICIAL_RATE_LIST } from '../data/rateList';
import { PublicPage } from '../components/layout/Header';
import { Button, Badge, ContentRequiredBadge } from '../components/ui/DesignSystem';

interface HomePageProps {
  onNavigate: (page: PublicPage, param?: string) => void;
  onSelectTestAndBook: (test: DiagnosticTest) => void;
  onToggleTest: (test: DiagnosticTest) => void;
  selectedTests: DiagnosticTest[];
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onSelectTestAndBook,
  onToggleTest,
  selectedTests,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Search filtered tests from official database/rate list
  const searchResults = OFFICIAL_RATE_LIST.filter(test => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return test.name.toLowerCase().includes(q) ||
      test.code.toLowerCase().includes(q) ||
      test.category.toLowerCase().includes(q);
  });

  // Featured / popular diagnostic tests from rate list
  const featuredTests = OFFICIAL_RATE_LIST.filter(t => t.category !== 'Preventive Health Packages').slice(0, 6);
  
  // Health Packages
  const healthPackages = OFFICIAL_RATE_LIST.filter(t => t.category === 'Preventive Health Packages');

  const isTestSelected = (id: string) => selectedTests.some(t => t.id === id);

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-b from-[#0F294A] to-[#143257] text-white rounded-3xl p-6 sm:p-12 border border-slate-700/60 shadow-xl relative overflow-hidden">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Home Collection Available
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {BUSINESS_INFO.name}
            </h1>
            <p className="text-xl sm:text-2xl font-semibold text-emerald-400">
              {BUSINESS_INFO.tagline}
            </p>
          </div>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Diagnostic & pathology testing center located at Kumbha Marg, Pratap Nagar, Jaipur. 
            Providing routine blood work, metabolic panels, and preventive health profiles with transparent rates and doorstep sample collection.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('book')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-3.5 rounded-xl text-sm transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-emerald-200" />
              BOOK A TEST
            </button>

            <button
              onClick={() => onNavigate('home-collection')}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-6 py-3.5 rounded-xl text-sm transition-all flex items-center gap-2"
            >
              <HomeIcon className="w-4 h-4 text-emerald-400" />
              HOME COLLECTION
            </button>
          </div>

          {/* Location & Quick Info */}
          <div className="pt-4 border-t border-slate-600/60 flex flex-wrap gap-6 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              Near Post Office, Kumbha Marg, Sector 11, Pratap Nagar, Jaipur
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              Direct Call: +91 {BUSINESS_INFO.phone}
            </span>
          </div>
        </div>
      </section>

      {/* 2. PROMINENT TEST SEARCH SECTION */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="max-w-2xl">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Search Diagnostic Tests
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Search verified tests and check sample requirements from our official rate list.
          </p>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Type test name (e.g., CBC, HbA1c, Liver Function, Lipid, Vitamin D)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F294A]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 bg-slate-100 rounded px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Real-time search dropdown/results */}
        {searchQuery.trim() && (
          <div className="pt-2">
            <div className="text-xs font-semibold text-slate-500 mb-2">
              Found {searchResults.length} matching tests in official rate list:
            </div>
            {searchResults.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-200">
                No matching tests found. You can browse all tests in the catalog.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-72 overflow-y-auto bg-white">
                {searchResults.map(test => (
                  <div key={test.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{test.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="font-mono text-[11px] bg-slate-100 px-1 rounded">{test.code}</span>
                        <span>{test.sampleType}</span>
                        {test.fastingRequired && <span className="text-amber-700 font-semibold">Fasting Req.</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-[#0F294A]">₹{test.price}</span>
                      <button
                        onClick={() => onSelectTestAndBook(test)}
                        className="bg-[#0F294A] hover:bg-[#16365D] text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                      >
                        Book Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. CONFIRMED SERVICES SECTION */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Pathology & Diagnostic Services
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Confirmed diagnostic departments and specimen testing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Confirmed Services */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
              Pathology
            </span>
            <h3 className="text-base font-bold text-slate-900">Hematology</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Complete blood count (CBC), hemoglobin, platelet counts, ESR, and blood typing.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
              Pathology
            </span>
            <h3 className="text-base font-bold text-slate-900">Biochemistry & Metabolic Panels</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Blood glucose (FBS/PPBS), HbA1c, Liver Function Tests (LFT), Kidney Function Tests (KFT), and Lipid Profiles.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
              Pathology
            </span>
            <h3 className="text-base font-bold text-slate-900">Serology & Immunology</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Widal typhoid screening, Dengue NS1 & antibodies, C-reactive protein (CRP), and Rheumatoid factor.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
              Pathology
            </span>
            <h3 className="text-base font-bold text-slate-900">Hormones & Vitamins</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Thyroid profile (T3, T4, TSH), Vitamin D, and Vitamin B12.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
              Clinical Specimen
            </span>
            <h3 className="text-base font-bold text-slate-900">Clinical Pathology</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Urine routine & microscopic examination, stool routine and occult blood analysis.
            </p>
          </div>

          {/* Any other unconfirmed service placeholder */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-300 space-y-2 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-500">Additional Diagnostic Services</span>
            <p className="text-xs text-slate-500">
              Additional imaging, ultrasound, or specialized diagnostic services:
            </p>
            <div>
              <ContentRequiredBadge text="[CONTENT REQUIRED]" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. DATABASE-DRIVEN DIAGNOSTIC TESTS PREVIEW */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Common Diagnostic Tests
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Rates sourced directly from B.L. Diagnostic Center rate list.
            </p>
          </div>
          <button
            onClick={() => onNavigate('tests')}
            className="text-xs font-bold text-[#0F294A] hover:text-[#16365D] flex items-center gap-1 self-start sm:self-auto"
          >
            View All Tests <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredTests.map(test => {
            const selected = isTestSelected(test.id);
            return (
              <div 
                key={test.id} 
                className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${
                  selected ? 'bg-emerald-50/50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-slate-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                      {test.category}
                    </span>
                    <span className="text-slate-400 font-mono">{test.code}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{test.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{test.description}</p>
                  
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Droplet className="w-3 h-3 text-red-500" />
                      {test.sampleType}
                    </span>
                    <span>•</span>
                    <span>{test.turnaroundTime}</span>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rate</span>
                    <span className="text-lg font-black text-[#0F294A]">₹{test.price}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleTest(test)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                        selected
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {selected ? 'Added' : 'Add'}
                    </button>
                    <button
                      onClick={() => onSelectTestAndBook(test)}
                      className="bg-[#0F294A] hover:bg-[#16365D] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Book
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. HEALTH PACKAGES SECTION */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Preventive Health Packages
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Comprehensive routine checkup bundles.
            </p>
          </div>
          <button
            onClick={() => onNavigate('packages')}
            className="text-xs font-bold text-[#0F294A] hover:text-[#16365D] flex items-center gap-1 self-start sm:self-auto"
          >
            View All Packages <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {healthPackages.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-4 shadow-xs">
              <div className="space-y-3">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block">
                  Package Code: {pkg.code}
                </span>
                <h3 className="text-base font-bold text-slate-900">{pkg.name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{pkg.description}</p>
                <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg font-medium">
                  {pkg.fastingRequired ? `10-12 Hours Fasting Recommended` : `No fasting required`}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Total Package Rate</span>
                  <span className="text-2xl font-black text-[#0F294A]">₹{pkg.price}</span>
                </div>
                <button
                  onClick={() => onSelectTestAndBook(pkg)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1"
                >
                  Book Package
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. HOW BOOKING WORKS */}
      <section className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            How Diagnostic Booking Works
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Simple 4-step request model. No online payments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F294A] text-white font-bold flex items-center justify-center text-xs">
              1
            </div>
            <h4 className="text-sm font-bold text-slate-900">Select Tests</h4>
            <p className="text-xs text-slate-600">
              Browse the official rate list and pick tests or packages.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F294A] text-white font-bold flex items-center justify-center text-xs">
              2
            </div>
            <h4 className="text-sm font-bold text-slate-900">Patient & Slot</h4>
            <p className="text-xs text-slate-600">
              Provide patient details and pick your convenient date and morning/evening time slot.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F294A] text-white font-bold flex items-center justify-center text-xs">
              3
            </div>
            <h4 className="text-sm font-bold text-slate-900">Home or Center</h4>
            <p className="text-xs text-slate-600">
              Request home sample collection or select center visit at Kumbha Marg, Pratap Nagar.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              4
            </div>
            <h4 className="text-sm font-bold text-slate-900">Collect & Pay</h4>
            <p className="text-xs text-slate-600">
              Receive unique Booking ID. Pay at collection or visit. Track reports online.
            </p>
          </div>
        </div>
      </section>

      {/* 7. HOME COLLECTION SECTION */}
      <section className="bg-emerald-900 text-white rounded-3xl p-6 sm:p-10 space-y-6">
        <div className="max-w-3xl space-y-3">
          <span className="inline-block bg-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Doorstep Diagnostic Service
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">
            Home Sample Collection Available
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
            Convenient sample collection at your home in Pratap Nagar and nearby Jaipur areas. 
            Trained phlebotomist visits with sterile single-use collection material.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-center pt-2">
          <button
            onClick={() => onNavigate('home-collection')}
            className="bg-white text-emerald-950 font-bold px-6 py-3 rounded-xl text-xs hover:bg-emerald-50 transition-colors"
          >
            Request Home Collection
          </button>
          <a
            href={`tel:${BUSINESS_INFO.phone}`}
            className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl text-xs flex items-center gap-2 transition-colors border border-emerald-700"
          >
            <Phone className="w-3.5 h-3.5" />
            Call: {BUSINESS_INFO.phone}
          </a>
        </div>
      </section>

      {/* 8. CONTACT & LOCATION SECTION */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">
            Center Location & Timings
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Visit our center in person for blood tests, urine collection, or collecting printed laboratory reports.
          </p>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Address:</span>
                <span>{BUSINESS_INFO.address}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Phone:</span>
                <a href={`tel:${BUSINESS_INFO.phone}`} className="font-semibold text-emerald-700 hover:underline">
                  +91 {BUSINESS_INFO.phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Center Working Hours:</span>
                <span>{BUSINESS_INFO.timings}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Location Map Placeholder / Landmark Directions */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Center Landmark Guide</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Located directly near the Post Office on Kumbha Marg, Sector 11 in Pratap Nagar, Jaipur - 302033. Easily accessible from Haldi Ghati Marg and Tonk Road.
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between">
            <span className="text-slate-600 font-medium">Google Maps Navigation:</span>
            <a 
              href="https://maps.google.com/?q=Post+Office+Kumbha+Marg+Sector+11+Pratap+Nagar+Jaipur" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
            >
              Open Directions <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
