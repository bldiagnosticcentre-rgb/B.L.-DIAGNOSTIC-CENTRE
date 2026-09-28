import React, { useState, useEffect } from 'react';
import { RateRecord } from '../../types/catalogue';
import { getTestByIdFromDB } from '../../services/catalogueService';
import { PublicPage } from '../layout/Header';
import { BUSINESS_INFO } from '../../types';
import { 
  ArrowLeft, 
  Clock, 
  Droplet, 
  AlertCircle, 
  Calendar, 
  FlaskConical, 
  FileText, 
  ShieldCheck, 
  Check, 
  MapPin, 
  Phone,
  RefreshCw
} from 'lucide-react';
import { Badge, Button } from '../ui/DesignSystem';

interface TestDetailViewProps {
  testId: string;
  onNavigate: (page: PublicPage) => void;
  onBookThisTest: (record: RateRecord) => void;
  isBooked: boolean;
}

export const TestDetailView: React.FC<TestDetailViewProps> = ({
  testId,
  onNavigate,
  onBookThisTest,
  isBooked,
}) => {
  const [test, setTest] = useState<RateRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTestByIdFromDB(testId).then(data => {
      setTest(data);
      setLoading(false);
    });
  }, [testId]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-[#0F294A] mx-auto" />
        <p className="text-xs font-semibold text-slate-600">Retrieving test record from database...</p>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Test Record Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested test code <span className="font-mono font-bold">{testId}</span> does not exist in the database.
        </p>
        <button
          onClick={() => onNavigate('tests')}
          className="text-xs font-bold text-emerald-700 hover:underline"
        >
          Return to Test Catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Back button */}
      <button
        onClick={() => onNavigate('tests')}
        className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Diagnostic Tests Catalogue
      </button>

      {/* Main Detail Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header: Test Name, Category, ID */}
        <div className="border-b border-slate-100 pb-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="green">{test.category}</Badge>
            <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              TEST ID: {test.test_id}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            {test.test_name}
          </h1>

          {test.needs_review && (
            <div className="bg-amber-50 border border-amber-300 text-amber-800 text-xs p-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span><strong>REVIEW REQUIRED:</strong> {test.review_reason || 'Unconfirmed source field.'}</span>
            </div>
          )}
        </div>

        {/* Pricing Card (Database-driven, No Hardcoding) */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Official Database Rate
            </span>
            <div className="flex items-baseline gap-3 mt-0.5">
              <span className="text-3xl font-black text-[#0F294A]">
                {test.general_price !== null ? `₹${test.general_price}` : '[CONTENT REQUIRED]'}
              </span>
              {test.corporate_price !== null && (
                <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Corporate Rate: ₹{test.corporate_price}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Payment mode: Pay in cash or direct at sample collection or center visit.
            </span>
          </div>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => onBookThisTest(test)}
            className="w-full sm:w-auto"
          >
            {isBooked ? (
              <>
                <Check className="w-4 h-4 text-white" />
                Booked in Cart
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 text-white" />
                Book This Test
              </>
            )}
          </Button>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Method */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-slate-500" />
              Testing Method
            </span>
            <p className="text-xs font-bold text-slate-800">
              {test.method || <span className="text-slate-400 font-mono">[CONTENT REQUIRED]</span>}
            </p>
          </div>

          {/* Sample Type */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-red-500" />
              Specimen Sample
            </span>
            <p className="text-xs font-bold text-slate-800">
              {test.sample || <span className="text-slate-400 font-mono">[CONTENT REQUIRED]</span>}
            </p>
          </div>

          {/* Reporting Time */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              Reporting Turnaround Time
            </span>
            <p className="text-xs font-bold text-slate-800">
              {test.reporting_time || <span className="text-slate-400 font-mono">[CONTENT REQUIRED]</span>}
            </p>
          </div>

          {/* Active Status */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Catalogue Status
            </span>
            <p className="text-xs font-bold text-emerald-800">
              {test.is_active ? 'Active Diagnostic Test' : 'Inactive'}
            </p>
          </div>
        </div>

        {/* Sample Instructions */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Sample Collection Instructions
          </h3>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
            {test.sample_instructions ? (
              <p>{test.sample_instructions}</p>
            ) : (
              <p className="text-slate-400 font-mono">[CONTENT REQUIRED]</p>
            )}
          </div>
        </div>

        {/* Clinical Information */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Clinical Information & Diagnostic Utility
          </h3>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
            {test.clinical_information ? (
              <p>{test.clinical_information}</p>
            ) : (
              <p className="text-slate-400 font-mono">[CONTENT REQUIRED]</p>
            )}
          </div>
        </div>

        {/* Center note */}
        <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between text-xs text-slate-500 gap-2">
          <span>{BUSINESS_INFO.name} • {BUSINESS_INFO.address}</span>
          <span className="font-semibold text-slate-700">Doorstep Home Collection Available</span>
        </div>
      </div>
    </div>
  );
};
