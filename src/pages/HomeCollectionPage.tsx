import React, { useState } from 'react';
import { 
  Home as HomeIcon, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  ArrowRight,
  PhoneCall
} from 'lucide-react';
import { BUSINESS_INFO } from '../types';
import { PublicPage } from '../components/layout/Header';
import { ContentRequiredBadge, Button } from '../components/ui/DesignSystem';
import { submitHomeCollectionEnquiry, submitCallbackRequest } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';

interface HomeCollectionPageProps {
  onNavigate: (page: PublicPage, param?: string) => void;
}

export const HomeCollectionPage: React.FC<HomeCollectionPageProps> = ({ onNavigate }) => {
  const { isStaffOrAdmin } = useAuth();

  // Enquiry form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [testsRequired, setTestsRequired] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await submitHomeCollectionEnquiry({
        fullName,
        phone,
        address,
        testsRequired,
        preferredDate: preferredDate || undefined,
        notes: notes || undefined
      });

      setSubmitSuccess(true);
      setFullName('');
      setPhone('');
      setAddress('');
      setTestsRequired('');
      setPreferredDate('');
      setNotes('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit home collection request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Top Prominent Banner - Displays "Home Collection Available" */}
      <div className="bg-[#0F294A] text-white rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-emerald-600 text-white font-black text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-xs">
            <HomeIcon className="w-3.5 h-3.5" />
            Home Collection Available
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Doorstep Diagnostic & Pathology Sample Collection
          </h1>

          <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
            Provided directly by <strong>{BUSINESS_INFO.name}</strong> from our center located Near Post Office, Kumbha Marg, Sector 11, Pratap Nagar, Jaipur - 302033.
          </p>

          {/* Dual Pathways: Instant Booking vs Enquiry Form */}
          <div className="flex flex-wrap gap-3 pt-3">
            <button
              onClick={() => onNavigate('book')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-xs"
            >
              <Calendar className="w-4 h-4" />
              Book Home Collection Online
            </button>

            <a
              href={`tel:${BUSINESS_INFO.phone}`}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold px-5 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              Call: {BUSINESS_INFO.phone}
            </a>
          </div>
        </div>

        {/* Staff / Admin Fast Access */}
        {isStaffOrAdmin && (
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => onNavigate('admin', 'home-collection')}
              className="text-xs text-emerald-300 hover:text-white font-semibold flex items-center gap-1"
            >
              View Home Collection Dispatch Queue (/admin/home-collection) →
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Operational Parameters (Left 5 cols) + Doorstep Enquiry Pathway (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Confirmed Center Info & Unverified Content Indicators */}
        <div className="lg:col-span-5 space-y-6">
          {/* Confirmed Center Data */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin className="w-4 h-4 text-emerald-700" />
              Confirmed Center Base & Location
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <span className="font-bold text-slate-900 block">Diagnostic Center:</span>
                <span>{BUSINESS_INFO.name}</span>
              </div>

              <div>
                <span className="font-bold text-slate-900 block">Base Address:</span>
                <span>Near Post Office, Kumbha Marg, Sector 11, Pratap Nagar, Jaipur - 302033</span>
              </div>

              <div>
                <span className="font-bold text-slate-900 block">Direct Assistance:</span>
                <a href={`tel:${BUSINESS_INFO.phone}`} className="font-bold text-emerald-800 hover:underline">
                  +91 {BUSINESS_INFO.phone}
                </a>
              </div>

              <div>
                <span className="font-bold text-slate-900 block">Center Operating Hours:</span>
                <span>Mon - Sat: 07:00 AM - 08:00 PM | Sun: 07:00 AM - 02:00 PM</span>
              </div>
            </div>
          </div>

          {/* Strict Content Boundary Box: Anti-Invention Discipline */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              Home Collection Service Parameters
            </h3>

            <div className="space-y-3 text-slate-600">
              <div className="space-y-1">
                <span className="font-bold text-slate-800 block">Confirmed Service Locality:</span>
                <p>Near Post Office, Kumbha Marg, Sector 11, Pratap Nagar, Jaipur - 302033</p>
                <div className="pt-0.5">
                  <span className="text-[11px] text-slate-500">Extended service radius / boundaries: </span>
                  <ContentRequiredBadge text="[CONTENT REQUIRED]" />
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-800 block">Home Collection Charges:</span>
                <p className="text-[11px] text-slate-500">Official doorstep convenience / conveyance fees:</p>
                <ContentRequiredBadge text="[CONTENT REQUIRED]" />
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-800 block">Dedicated Phlebotomy Slot Windows:</span>
                <p className="text-[11px] text-slate-500">Specific morning home fasting collection windows beyond center hours:</p>
                <ContentRequiredBadge text="[CONTENT REQUIRED]" />
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-800 block">Assigned Phlebotomist Staff:</span>
                <p className="text-[11px] text-slate-500">Official staff roster & identification:</p>
                <ContentRequiredBadge text="[CONTENT REQUIRED]" />
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-800 block">Service Turnaround Guarantees:</span>
                <p className="text-[11px] text-slate-500">Guaranteed doorstep arrival timeframes:</p>
                <ContentRequiredBadge text="[CONTENT REQUIRED]" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Doorstep Enquiry / Request Pathway (Validated & Saved in Database as HOME_COLLECTION Lead) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Doorstep Request Pathway
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Request Doorstep Sample Collection
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Submit your patient details and collection address below. Our center phlebotomy desk will verify the location in Pratap Nagar and contact you to confirm the sample visit.
            </p>
          </div>

          {/* Success State */}
          {submitSuccess ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-emerald-950">Home Collection Request Received</h3>
              <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                Thank you! Your doorstep collection request has been recorded into our diagnostic database. Our phlebotomy coordinator will call you to confirm your address and schedule the sample pickup.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSubmitSuccess(false)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-xs"
                >
                  Submit Another Request
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('book')}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition-colors"
                >
                  Book Other Tests
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEnquirySubmit} className="space-y-4 text-xs">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Patient Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Surendra Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Mobile Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9649183422"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700 bg-white"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">For phone confirmation before phlebotomist dispatch</span>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Preferred Collection Date <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Doorstep Collection Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="House / Flat No., Street, Landmark (e.g. Near Post Office, Kumbha Marg, Sector 11, Pratap Nagar, Jaipur - 302033)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700 bg-white leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Diagnostic Tests / Packages Required <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC), Fasting Blood Sugar, Lipid Profile, Thyroid"
                  value={testsRequired}
                  onChange={(e) => setTestsRequired(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Special Instructions / Doctor Advice <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Senior citizen patient (age 72), fasting instructions, or preferred arrival time..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700 bg-white leading-relaxed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Submitting Doorstep Request...' : 'Submit Doorstep Collection Request'}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] space-y-0.5">
                <span className="font-bold text-slate-700 block">Zero Online Payment:</span>
                <p>Payment is collected in cash or direct UPI upon sample collection at your doorstep. No payment gateway charges.</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
