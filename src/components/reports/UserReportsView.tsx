import React, { useState, useEffect } from 'react';
import { DiagnosticReport } from '../../types/reports';
import { getReportsForUser } from '../../services/reportSecurityService';
import { useAuth } from '../../contexts/AuthContext';
import { SecureReportViewerModal } from './SecureReportViewerModal';
import { 
  FileText, 
  Download, 
  Eye, 
  Search, 
  Calendar, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw,
  Clock,
  Lock,
  ChevronRight
} from 'lucide-react';
import { Badge, Button, LoadingState, EmptyState } from '../ui/DesignSystem';

interface UserReportsViewProps {
  onNavigateToBooking?: (bookingId: string) => void;
}

export const UserReportsView: React.FC<UserReportsViewProps> = ({
  onNavigateToBooking,
}) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<DiagnosticReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [activeReportForModal, setActiveReportForModal] = useState<DiagnosticReport | null>(null);

  const loadReports = async () => {
    if (!user) return;
    setLoading(true);
    const list = await getReportsForUser(user.uid);
    setReports(list);
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, [user]);

  const filteredReports = reports.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.report_title.toLowerCase().includes(q) ||
      r.booking_id.toLowerCase().includes(q) ||
      r.patient_name.toLowerCase().includes(q) ||
      r.test_names.some(t => t.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return <LoadingState message="Loading your certified diagnostic reports..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Certified Diagnostic Reports
          </h2>
          <p className="text-xs text-slate-500">
            Pathologist-verified laboratory results. Access is encrypted and tied to your patient account.
          </p>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Restricted Private Access (IDOR Protected)</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search reports by title, test name, booking ID, or patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0F294A]"
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Clear
          </button>
        )}
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <EmptyState
          title="No Diagnostic Reports Found"
          description={search ? "No reports matched your search criteria." : "Certified laboratory reports will appear here once specimens are analyzed."}
        />
      ) : (
        <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {filteredReports.map((report) => (
            <div
              key={report.report_id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/70 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{report.report_title}</h3>
                  <Badge variant={report.is_active ? 'green' : 'amber'}>
                    {report.is_active ? 'Available' : 'Archived'}
                  </Badge>
                  <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {report.booking_id}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>Patient: <strong className="text-slate-800">{report.patient_name}</strong></span>
                  <span>•</span>
                  <span>Uploaded: <strong className="text-slate-700">{new Date(report.uploaded_at).toLocaleDateString()}</strong></span>
                  <span>•</span>
                  <span>Size: {(report.file_size / 1024).toFixed(1)} KB</span>
                </div>

                {/* Tests included */}
                {report.test_names && report.test_names.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {report.test_names.map((t, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {onNavigateToBooking && (
                  <button
                    onClick={() => onNavigateToBooking(report.booking_id)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline px-2"
                  >
                    View Booking
                  </button>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveReportForModal(report)}
                >
                  <Eye className="w-3.5 h-3.5" />
                  View & Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Secure Viewer Modal */}
      {activeReportForModal && (
        <SecureReportViewerModal
          report={activeReportForModal}
          onClose={() => setActiveReportForModal(null)}
        />
      )}
    </div>
  );
};
