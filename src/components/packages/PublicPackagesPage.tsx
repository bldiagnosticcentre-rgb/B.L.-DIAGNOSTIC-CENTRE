import React, { useState, useEffect } from 'react';
import { HealthPackage } from '../../types/packages';
import { getAllPackagesFromDB } from '../../services/packageService';
import { PublicPage } from '../layout/Header';
import { 
  BadgeCheck, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  Check, 
  Plus, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Droplet
} from 'lucide-react';
import { Badge, Button } from '../ui/DesignSystem';

interface PublicPackagesPageProps {
  onNavigate: (page: PublicPage, param?: string) => void;
  onBookPackage: (pkg: HealthPackage) => void;
  bookedPackageIds: string[];
}

export const PublicPackagesPage: React.FC<PublicPackagesPageProps> = ({
  onNavigate,
  onBookPackage,
  bookedPackageIds,
}) => {
  const [packages, setPackages] = useState<HealthPackage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showReviewItems, setShowReviewItems] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    // Fetch all packages. Public view filters active packages by default, but allows toggling unconfirmed/poster review packages for audit.
    getAllPackagesFromDB(false).then(list => {
      setPackages(list);
      setLoading(false);
    });
  }, []);

  const displayedPackages = packages.filter(p => {
    if (showReviewItems) return true; // show all including review required
    return p.is_active && !p.needs_review; // show confirmed active packages
  });

  return (
    <div className="space-y-8 pb-24">
      {/* Title & Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Preventive Health Checkup Packages
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Carefully curated diagnostic panels for routine wellness, metabolic screening, and senior care.
          </p>
        </div>

        {/* Audit Toggle for unconfirmed/review packages */}
        <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showReviewItems}
              onChange={(e) => setShowReviewItems(e.target.checked)}
              className="rounded text-[#0F294A] focus:ring-0"
            />
            Show Poster Reference Profiles ([REVIEW REQUIRED])
          </label>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin text-[#0F294A] mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Loading database packages...</p>
        </div>
      ) : displayedPackages.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No active packages currently listed</h4>
          <p className="text-xs text-slate-500">Enable poster reference profiles or check admin panel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedPackages.map((pkg) => {
            const isBooked = bookedPackageIds.includes(pkg.package_id);

            return (
              <div
                key={pkg.package_id}
                className={`bg-white rounded-2xl border p-6 flex flex-col justify-between space-y-5 transition-all ${
                  pkg.needs_review 
                    ? 'border-amber-300 ring-1 ring-amber-200 bg-amber-50/20' 
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar: Code & Review flag */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {pkg.package_id}
                    </span>
                    {pkg.needs_review ? (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        REVIEW REQUIRED
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        CONFIRMED B.L. PACKAGE
                      </span>
                    )}
                  </div>

                  {/* Package Name */}
                  <h3 
                    onClick={() => onNavigate('packages', pkg.package_id)}
                    className="text-lg font-bold text-slate-900 hover:text-[#0F294A] cursor-pointer leading-snug"
                  >
                    {pkg.package_name}
                  </h3>

                  {/* Review reason warning if applicable */}
                  {pkg.needs_review && pkg.review_reason && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 leading-tight">
                      <strong>Audit Notice:</strong> {pkg.review_reason}
                    </div>
                  )}

                  {/* Description */}
                  {pkg.description ? (
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {pkg.description}
                    </p>
                  ) : (
                    <p className="text-xs font-mono text-slate-400">[CONTENT REQUIRED]</p>
                  )}

                  {/* Fasting & Turnaround notice */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                    {pkg.fasting_required ? (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium">
                        {pkg.fasting_hours ? `${pkg.fasting_hours}h Fasting Req.` : 'Fasting Required'}
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                        No Fasting
                      </span>
                    )}
                    {pkg.turnaround_time && (
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {pkg.turnaround_time}
                      </span>
                    )}
                  </div>

                  {/* Included Tests Summary */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Includes {pkg.items.length} Diagnostic Tests / Parameters:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {pkg.items.slice(0, 4).map((it, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="truncate">{it.test_name}</span>
                        </li>
                      ))}
                      {pkg.items.length > 4 && (
                        <li className="text-[11px] font-semibold text-emerald-800 pt-0.5">
                          + {pkg.items.length - 4} more parameters...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Footer: Price & Booking Button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                      Package Rate
                    </span>
                    <span className="text-2xl font-black text-[#0F294A]">
                      ₹{pkg.price}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('packages', pkg.package_id)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline px-1"
                    >
                      View All Tests
                    </button>

                    <Button
                      variant={pkg.needs_review ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={() => onBookPackage(pkg)}
                    >
                      {isBooked ? 'Booked' : 'Book Package'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
