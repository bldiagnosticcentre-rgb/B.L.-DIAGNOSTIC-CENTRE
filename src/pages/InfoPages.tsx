import React, { useState } from 'react';
import { BUSINESS_INFO } from '../types';
import { PublicPage } from '../components/layout/Header';
import { ContentRequiredBadge, Button } from '../components/ui/DesignSystem';
import { MapPin, Phone, Clock, Mail, CheckCircle2 } from 'lucide-react';
import { submitContactEnquiry } from '../services/adminService';

interface InfoPagesProps {
  type: 'about' | 'services' | 'contact' | 'faq' | 'login' | 'register';
  onNavigate: (page: PublicPage) => void;
}

export const InfoPages: React.FC<InfoPagesProps> = ({ type, onNavigate }) => {
  const [enqName, setEnqName] = useState('');
  const [enqPhone, setEnqPhone] = useState('');
  const [enqMsg, setEnqMsg] = useState('');
  const [enqSubmitting, setEnqSubmitting] = useState(false);
  const [enqSuccess, setEnqSuccess] = useState(false);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enqName.trim() || !enqPhone.trim() || !enqMsg.trim()) return;
    setEnqSubmitting(true);
    try {
      await submitContactEnquiry({
        name: enqName.trim(),
        phone: enqPhone.trim(),
        message: enqMsg.trim()
      });
      setEnqSuccess(true);
      setEnqName('');
      setEnqPhone('');
      setEnqMsg('');
    } catch (err) {
      console.error('Failed to submit enquiry:', err);
      alert('Unable to submit enquiry. Please call our direct helpline.');
    } finally {
      setEnqSubmitting(false);
    }
  };
  if (type === 'about') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">About {BUSINESS_INFO.name}</h1>
          <p className="text-xs text-slate-500 mt-1">&ldquo;{BUSINESS_INFO.tagline}&rdquo;</p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <p>
            <strong>{BUSINESS_INFO.name}</strong> is a dedicated pathology and diagnostic testing center located near the Post Office on Kumbha Marg, Sector 11, Pratap Nagar, Jaipur - 302033.
          </p>
          <p>
            We provide verified routine and specialized clinical pathology, hematology, biochemistry, and hormone diagnostic testing, alongside home sample collection services.
          </p>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h3 className="font-bold text-slate-900">Center Mission & Quality</h3>
            <p>
              To offer transparent, affordable, and accurate laboratory diagnostics for individual patients, families, and senior citizens.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h3 className="font-bold text-slate-900">Accreditations & Certifications</h3>
            <p className="text-xs text-slate-500">
              Official accreditation documents & registrations: <ContentRequiredBadge text="[CONTENT REQUIRED]" />
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'services') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Diagnostic Services</h1>
          <p className="text-xs text-slate-500 mt-1">Confirmed laboratory and diagnostic testing services</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Clinical Pathology & Specimen Analysis</h3>
            <p className="text-xs text-slate-600">Urine routine & microscopic examination, stool routine and occult blood testing.</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Hematology & Complete Blood Counts</h3>
            <p className="text-xs text-slate-600">CBC with ESR, Platelet counts, Hemoglobin, and ABO/Rh blood grouping.</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Biochemistry & Metabolic Panels</h3>
            <p className="text-xs text-slate-600">Blood Glucose (FBS/PPBS), HbA1c, Liver Function Tests (LFT), Kidney Function Tests (KFT), and Lipid Profile.</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Endocrine & Hormone Diagnostics</h3>
            <p className="text-xs text-slate-600">Thyroid Profile (T3, T4, TSH), Vitamin D, and Vitamin B12.</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Serology & Infectious Disease Screening</h3>
            <p className="text-xs text-slate-600">Widal Typhoid agglutination, Dengue NS1 & antibodies, CRP, RA factor, and VDRL.</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-xl border border-dashed border-slate-300 space-y-2">
            <h3 className="font-bold text-slate-700 text-sm">Radiology / Ultrasound / ECG</h3>
            <p className="text-xs text-slate-500">Additional imaging and diagnostic equipment: <ContentRequiredBadge text="[CONTENT REQUIRED]" /></p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'contact') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Contact & Center Location</h1>
          <p className="text-xs text-slate-500 mt-1">Get in touch with B.L. Diagnostic Center staff</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Center Information</h3>
            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Address:</span>
                  <span>{BUSINESS_INFO.address}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Direct Call / WhatsApp:</span>
                  <a href={`tel:${BUSINESS_INFO.phone}`} className="font-semibold text-emerald-700 hover:underline">
                    +91 {BUSINESS_INFO.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Center Operating Hours:</span>
                  <span>{BUSINESS_INFO.timings}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Send an Enquiry</h3>
            {enqSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-800 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Enquiry Received
                </div>
                <p>Thank you! Your message has been logged directly with our center team. A staff member will contact you on your mobile number shortly.</p>
                <button
                  type="button"
                  onClick={() => setEnqSuccess(false)}
                  className="text-xs font-semibold text-emerald-700 underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Your Full Name"
                  value={enqName}
                  onChange={(e) => setEnqName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
                <input
                  type="tel"
                  required
                  placeholder="10-digit Phone Number"
                  value={enqPhone}
                  onChange={(e) => setEnqPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
                <textarea
                  rows={3}
                  required
                  placeholder="Inquiry, test requirements, or home visit query..."
                  value={enqMsg}
                  onChange={(e) => setEnqMsg(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
                <Button variant="primary" size="sm" type="submit" disabled={enqSubmitting} className="w-full">
                  {enqSubmitting ? 'Sending Enquiry...' : 'Submit Enquiry'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'faq') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h1>
          <p className="text-xs text-slate-500 mt-1">Common patient questions regarding diagnostics and sample collection</p>
        </div>

        <div className="space-y-3">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1.5">
            <h3 className="text-sm font-bold text-slate-900">How do I book a home sample collection?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Click on &apos;Home Collection&apos; or &apos;Book Test&apos;, select your required tests, choose Home Collection mode, enter your Pratap Nagar address, and confirm. A staff member will arrive at your scheduled time slot.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1.5">
            <h3 className="text-sm font-bold text-slate-900">Do I need to pay online when booking?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              No. B.L. Diagnostic Center uses a request model with zero online payment gateways. You pay directly in cash or upon sample collection at your home or during your center visit.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1.5">
            <h3 className="text-sm font-bold text-slate-900">How long does it take to receive test results?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Most routine tests (CBC, Blood Sugar, LFT, KFT, Urine R/M) are prepared on the same day within 4-6 hours. Specialized vitamin profiles take 24 hours.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1.5">
            <h3 className="text-sm font-bold text-slate-900">Which tests require fasting?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fasting Blood Sugar (FBS), Lipid Profile, and Liver/Kidney Function tests generally require 8-12 hours of overnight fasting. Our test catalog explicitly marks each test with fasting guidelines.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Login / Register
  return (
    <div className="max-w-md mx-auto space-y-6 pb-20 pt-8">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {type === 'login' ? 'Patient Portal Sign In' : 'Create Patient Account'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Access previous test history and download verified diagnostic reports.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); alert('Session authentication initialized.'); }} className="space-y-3">
          <input
            type="tel"
            required
            placeholder="Registered 10-Digit Mobile Number"
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300"
          />
          <input
            type="password"
            required
            placeholder="Password / OTP"
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300"
          />
          <Button variant="primary" size="md" type="submit" className="w-full">
            {type === 'login' ? 'Sign In' : 'Register Account'}
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500">
          {type === 'login' ? (
            <p>
              Don&apos;t have an account?{' '}
              <button onClick={() => onNavigate('register')} className="text-emerald-700 font-bold hover:underline">
                Register
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button onClick={() => onNavigate('login')} className="text-emerald-700 font-bold hover:underline">
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
