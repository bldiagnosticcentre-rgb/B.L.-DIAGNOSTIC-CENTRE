import React from 'react';
import { MapPin, Navigation, ExternalLink, Phone, Clock, Compass, Building2, CheckCircle2 } from 'lucide-react';
import { BUSINESS_INFO } from '../../types';

interface CenterLocationCardProps {
  className?: string;
}

export const CenterLocationCard: React.FC<CenterLocationCardProps> = ({ className = '' }) => {
  const directionsQuery = encodeURIComponent('B.L. Diagnostic Center Near Post Office Kumbha Marg Sector 11 Pratap Nagar Jaipur 302033');
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${directionsQuery}`;

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs ${className}`}>
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-slate-900 to-[#0F294A] text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Physical Laboratory & Sample Collection Desk
            </span>
            <h3 className="text-lg font-bold text-white">
              B.L. Diagnostic Center — Pratap Nagar Branch
            </h3>
            <p className="text-xs text-slate-300">
              Sector 11, Kumbha Marg (Near Post Office), Jaipur, Rajasthan - 302033
            </p>
          </div>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
          >
            <Navigation className="w-3.5 h-3.5" />
            Open Directions
            <ExternalLink className="w-3 h-3 text-emerald-200" />
          </a>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Address & Landmarks */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-emerald-700" />
            Address & Landmarks
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Near Post Office, Kumbha Marg, Sector 11, Pratap Nagar, Sanganer, Jaipur, Rajasthan 302033
          </p>
          <div className="pt-1 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Opposite Post Office, Sector 11</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Easy parking for elderly & ambulances</span>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <Clock className="w-4 h-4 text-emerald-700" />
            Operating Timings
          </div>
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between py-0.5 border-b border-slate-100">
              <span className="font-medium text-slate-700">Monday – Saturday:</span>
              <span className="font-bold text-slate-900">07:00 AM – 08:00 PM</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-100">
              <span className="font-medium text-slate-700">Sunday:</span>
              <span className="font-bold text-slate-900">07:00 AM – 02:00 PM</span>
            </div>
            <div className="pt-1 text-[11px] text-emerald-700 font-semibold">
              Emergency blood sample drop-off available during operating hours.
            </div>
          </div>
        </div>

        {/* Contact & Phlebotomy Helpline */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <Phone className="w-4 h-4 text-emerald-700" />
            Direct Reception & Booking
          </div>
          <div className="space-y-1.5">
            <a 
              href="tel:9649183422" 
              className="text-base font-black text-slate-900 hover:text-emerald-700 block transition-colors"
            >
              +91 9649183422
            </a>
            <p className="text-xs text-slate-500">
              Call reception directly for test preparation instructions (e.g. fasting guidelines) or home collection booking.
            </p>
            <span className="inline-block bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Doorstep Phlebotomist Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
