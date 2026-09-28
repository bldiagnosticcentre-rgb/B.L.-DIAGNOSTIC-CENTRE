import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PatientRecord } from '../../types/bookingSystem';
import { 
  getPatientsForUser, 
  createPatient, 
  updatePatient, 
  togglePatientActive 
} from '../../services/patientService';
import { 
  Users, 
  Plus, 
  Edit3, 
  UserCheck, 
  UserX, 
  Check, 
  X, 
  AlertCircle, 
  Phone, 
  Calendar, 
  RefreshCw,
  ShieldCheck 
} from 'lucide-react';
import { Button, Badge, LoadingState, EmptyState } from '../ui/DesignSystem';

interface PatientManagerProps {
  onSelectPatient?: (patient: PatientRecord) => void;
  selectedPatientId?: string;
  isSelectionMode?: boolean;
}

export const PatientManager: React.FC<PatientManagerProps> = ({
  onSelectPatient,
  selectedPatientId,
  isSelectionMode = false,
}) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [relation, setRelation] = useState<PatientRecord['relation']>('Self');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadPatients = async () => {
    if (!user) return;
    setLoading(true);
    const list = await getPatientsForUser(user.uid);
    setPatients(list);
    setLoading(false);
  };

  useEffect(() => {
    loadPatients();
  }, [user]);

  const handleOpenAddModal = () => {
    setEditingPatient(null);
    setFullName('');
    setAge(30);
    setGender('Male');
    setRelation('Self');
    setPhone(user?.phone || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: PatientRecord) => {
    setEditingPatient(p);
    setFullName(p.full_name);
    setAge(p.age);
    setGender(p.gender);
    setRelation(p.relation);
    setPhone(p.phone || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!fullName.trim()) {
      setErrorMsg('Patient full name is required.');
      return;
    }

    try {
      if (editingPatient) {
        await updatePatient(editingPatient.patient_id, user.uid, {
          full_name: fullName.trim(),
          age: Number(age),
          gender,
          relation,
          phone: phone.trim() || undefined
        });
      } else {
        await createPatient({
          user_id: user.uid,
          full_name: fullName.trim(),
          age: Number(age),
          gender,
          relation,
          phone: phone.trim() || undefined
        });
      }
      setIsModalOpen(false);
      await loadPatients();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save patient profile.');
    }
  };

  const handleToggleStatus = async (p: PatientRecord) => {
    if (!user) return;
    await togglePatientActive(p.patient_id, user.uid, !p.is_active);
    await loadPatients();
  };

  if (loading) {
    return <LoadingState message="Loading saved family patient profiles..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {isSelectionMode ? 'Select or Add Patient' : 'Family Patients Management'}
          </h2>
          <p className="text-xs text-slate-500">
            {isSelectionMode 
              ? 'Select who this diagnostic test is for, or quickly add a family member.'
              : 'Add family profiles to book diagnostic tests without retyping personal details.'}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenAddModal}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Family Patient
        </Button>
      </div>

      {patients.length === 0 ? (
        <EmptyState
          title="No Patient Profiles Saved"
          description="Create your first patient profile (e.g. Self, Father, Mother) to proceed with test booking."
          actionText="Add Patient Now"
          onAction={handleOpenAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map(p => {
            const isSelected = selectedPatientId === p.patient_id;

            return (
              <div
                key={p.patient_id}
                onClick={() => {
                  if (isSelectionMode && p.is_active && onSelectPatient) {
                    onSelectPatient(p);
                  }
                }}
                className={`p-4 rounded-xl border transition-all ${
                  isSelectionMode ? 'cursor-pointer' : ''
                } ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 shadow-xs'
                    : p.is_active
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{p.full_name}</h4>
                      <Badge variant="navy">{p.relation}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {p.age} Years • {p.gender}
                    </p>
                    {p.phone && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        +91 {p.phone}
                      </p>
                    )}
                  </div>

                  {isSelectionMode ? (
                    isSelected && (
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    )
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEditModal(p); }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
                        title="Edit Patient"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(p); }}
                        className={`p-1.5 rounded-md ${p.is_active ? 'text-emerald-600 hover:text-amber-600' : 'text-slate-400 hover:text-emerald-600'}`}
                        title={p.is_active ? 'Deactivate Patient' : 'Activate Patient'}
                      >
                        {p.is_active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>

                {!p.is_active && (
                  <span className="inline-block mt-2 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Inactive Profile
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Patient Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingPatient ? 'Edit Patient Profile' : 'Add New Family Member'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSavePatient} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age (Years) *</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Relation *</label>
                  <select
                    value={relation}
                    onChange={(e) => setRelation(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Self">Self</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <Button type="submit" variant="primary" size="sm">
                  {editingPatient ? 'Update Patient' : 'Save Patient'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
