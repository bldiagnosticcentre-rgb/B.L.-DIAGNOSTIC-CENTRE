import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PublicPage } from '../layout/Header';
import { DiagnosticTest, BUSINESS_INFO } from '../../types';
import { PatientRecord, CollectionType } from '../../types/bookingSystem';
import { getPatientsForUser, createPatient } from '../../services/patientService';
import { createBookingOrder } from '../../services/orderService';
import { PatientManager } from '../dashboard/PatientManager';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  AlertCircle, 
  Droplet, 
  Home, 
  Building2, 
  FileText,
  Trash2,
  Lock
} from 'lucide-react';
import { Button, Badge } from '../ui/DesignSystem';

interface CompleteBookingEngineProps {
  selectedTests: DiagnosticTest[];
  onAddTest: (test: DiagnosticTest) => void;
  onRemoveTest: (testId: string) => void;
  onClearSelectedTests: () => void;
  onNavigateToCatalog: () => void;
  onNavigate: (page: PublicPage, param?: string) => void;
}

export const CompleteBookingEngine: React.FC<CompleteBookingEngineProps> = ({
  selectedTests,
  onAddTest,
  onRemoveTest,
  onClearSelectedTests,
  onNavigateToCatalog,
  onNavigate,
}) => {
  const { user } = useAuth();

  // Booking Flow Steps:
  // Step 1: Select/Confirm Tests
  // Step 2: Select Patient
  // Step 3: Date & Time Slot
  // Step 4: Collection Type (Home Collection OR Center Visit)
  // Step 5: Review & Confirm
  // Step 6: Confirmation with BL-YYYY-000001
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [collectionType, setCollectionType] = useState<CollectionType>('CENTER_VISIT');
  
  // Date & Time
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [bookingDate, setBookingDate] = useState<string>(tomorrowStr);
  const [timeSlot, setTimeSlot] = useState<string>('07:00 AM - 08:00 AM');

  // Home Collection fields (Minimum required)
  const [homeAddress, setHomeAddress] = useState<string>('');
  const [area, setArea] = useState<string>('Sector 11, Pratap Nagar');
  const [pincode, setPincode] = useState<string>('302033');
  const [notes, setNotes] = useState<string>('');

  // Processing & Confirmation State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [confirmedBookingId, setConfirmedBookingId] = useState<string>('');

  const timeSlots = [
    '07:00 AM - 08:00 AM (Early Fasting)',
    '08:00 AM - 09:00 AM (Fasting)',
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '04:00 PM - 05:00 PM',
    '05:00 PM - 06:00 PM',
  ];

  // Auto-select patient if only 1 exists
  useEffect(() => {
    if (user && !selectedPatient) {
      getPatientsForUser(user.uid).then(list => {
        if (list.length > 0) {
          const active = list.find(p => p.is_active) || list[0];
          setSelectedPatient(active);
        }
      });
    }
  }, [user]);

  const totalAmount = selectedTests.reduce((acc, t) => acc + t.price, 0);

  // Authentication check before proceeding
  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 bg-white p-8 rounded-2xl border border-slate-200">
        <Lock className="w-10 h-10 text-emerald-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to Complete Booking</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          To ensure patient data privacy and link your test results securely, please sign in or register before scheduling.
        </p>
        <div className="flex gap-2 justify-center pt-2">
          <Button variant="primary" size="md" onClick={() => onNavigate('login')}>
            Sign In / Register
          </Button>
          <Button variant="outline" size="md" onClick={() => onNavigate('tests')}>
            Browse Tests
          </Button>
        </div>
      </div>
    );
  }

  // Handle final submission
  const handleConfirmBooking = async () => {
    if (!selectedPatient) {
      setErrorMessage('Please select or add a patient profile.');
      return;
    }
    if (selectedTests.length === 0) {
      setErrorMessage('Please add at least one test to your booking.');
      return;
    }
    if (collectionType === 'HOME_COLLECTION' && !homeAddress.trim()) {
      setErrorMessage('Please provide your home collection address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const order = await createBookingOrder({
        userId: user.uid,
        patientId: selectedPatient.patient_id,
        collectionType,
        bookingDate,
        timeSlot,
        homeAddress: collectionType === 'HOME_COLLECTION' ? homeAddress : undefined,
        area: collectionType === 'HOME_COLLECTION' ? area : undefined,
        pincode: collectionType === 'HOME_COLLECTION' ? pincode : undefined,
        notes,
        selectedTestIds: selectedTests.map(t => t.id)
      });

      setConfirmedBookingId(order.booking_id);
      setCurrentStep(6); // Move to Confirmation View
      onClearSelectedTests();
    } catch (err: any) {
      setErrorMessage(err.message || 'Booking submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Step Tracker Indicator */}
      {currentStep < 6 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#0F294A] text-white flex items-center justify-center font-bold text-xs">
              {currentStep}
            </span>
            <span className="font-bold text-slate-800">
              {currentStep === 1 && 'Step 1: Confirm Tests'}
              {currentStep === 2 && 'Step 2: Select Patient'}
              {currentStep === 3 && 'Step 3: Schedule Date & Time'}
              {currentStep === 4 && 'Step 4: Collection Mode'}
              {currentStep === 5 && 'Step 5: Review & Confirm'}
            </span>
          </div>

          <span className="text-slate-400 font-semibold text-[11px]">
            Step {currentStep} of 5
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: CONFIRM TESTS */}
      {currentStep === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Selected Diagnostic Tests</h2>
              <p className="text-xs text-slate-500">Review selected tests before scheduling sample collection.</p>
            </div>
            <button
              onClick={onNavigateToCatalog}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              + Add More Tests
            </button>
          </div>

          {selectedTests.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
              <Droplet className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600">No tests currently selected.</p>
              <Button variant="primary" size="sm" onClick={onNavigateToCatalog}>
                Browse Test Catalogue
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {selectedTests.map(t => (
                <div key={t.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{t.name}</h4>
                    <span className="text-[11px] text-slate-500">{t.category} • {t.sampleType}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-[#0F294A]">₹{t.price}</span>
                    <button
                      onClick={() => onRemoveTest(t.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="p-3.5 bg-slate-50 flex justify-between font-bold text-xs text-slate-800">
                <span>Total Amount (Pay at collection/visit):</span>
                <span className="text-base text-[#0F294A]">₹{totalAmount}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="primary"
              size="md"
              disabled={selectedTests.length === 0}
              onClick={() => setCurrentStep(2)}
            >
              Continue to Patient Selection
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT PATIENT */}
      {currentStep === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <PatientManager
            isSelectionMode={true}
            selectedPatientId={selectedPatient?.patient_id}
            onSelectPatient={(p) => setSelectedPatient(p)}
          />

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(1)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Tests
            </button>

            <Button
              variant="primary"
              size="md"
              disabled={!selectedPatient}
              onClick={() => setCurrentStep(3)}
            >
              Continue to Schedule
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: DATE & TIME */}
      {currentStep === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Select Date & Time Slot</h2>
            <p className="text-xs text-slate-500">Choose your preferred morning or evening timing for sample collection.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Date *</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Available Time Slots *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {timeSlots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTimeSlot(slot)}
                    className={`p-3 rounded-xl border text-xs text-left font-semibold transition-all ${
                      timeSlot === slot
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(2)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Patient
            </button>

            <Button
              variant="primary"
              size="md"
              onClick={() => setCurrentStep(4)}
            >
              Continue to Collection Mode
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: COLLECTION MODE */}
      {currentStep === 4 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Select Collection Type</h2>
            <p className="text-xs text-slate-500">Pick between doorstep home sample collection or center visit.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setCollectionType('HOME_COLLECTION')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                collectionType === 'HOME_COLLECTION'
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <Home className="w-6 h-6 text-emerald-700" />
                {collectionType === 'HOME_COLLECTION' && <Check className="w-5 h-5 text-emerald-700 stroke-[3]" />}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Home Collection</h3>
              <p className="text-xs text-slate-600">
                A phlebotomist arrives at your doorstep in Pratap Nagar or nearby Jaipur areas.
              </p>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded inline-block">
                Doorstep Service Active
              </span>
            </div>

            <div
              onClick={() => setCollectionType('CENTER_VISIT')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                collectionType === 'CENTER_VISIT'
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <Building2 className="w-6 h-6 text-[#0F294A]" />
                {collectionType === 'CENTER_VISIT' && <Check className="w-5 h-5 text-[#0F294A] stroke-[3]" />}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Center Visit</h3>
              <p className="text-xs text-slate-600">
                Visit our center near Post Office, Kumbha Marg, Sector 11, Pratap Nagar.
              </p>
              <span className="text-[11px] font-semibold text-slate-500">
                Timings: {BUSINESS_INFO.timings}
              </span>
            </div>
          </div>

          {/* Home Collection Address Fields (Minimum Required) */}
          {collectionType === 'HOME_COLLECTION' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Home Collection Address
              </span>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">House / Flat / Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House No. 42, Near Community Park"
                  value={homeAddress}
                  onChange={(e) => setHomeAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Locality / Sector</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Special Clinical or Landmark Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Patient is a senior citizen; please call before arriving..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(3)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Schedule
            </button>

            <Button
              variant="primary"
              size="md"
              onClick={() => setCurrentStep(5)}
            >
              Review Booking Summary
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW & CONFIRM */}
      {currentStep === 5 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Review Booking Summary</h2>
            <p className="text-xs text-slate-500">Verify all appointment parameters before final submission.</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Patient card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Patient Details</span>
                <h4 className="font-bold text-slate-900 text-sm">{selectedPatient?.full_name}</h4>
                <p className="text-slate-600">{selectedPatient?.age} Yrs • {selectedPatient?.gender} ({selectedPatient?.relation})</p>
                {selectedPatient?.phone && <p className="text-slate-500">+91 {selectedPatient.phone}</p>}
              </div>
              <button onClick={() => setCurrentStep(2)} className="text-emerald-700 font-bold hover:underline">
                Change
              </button>
            </div>

            {/* Schedule card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Appointment Slot</span>
                <p className="font-bold text-slate-900">{bookingDate} • {timeSlot}</p>
                <p className="text-slate-600 mt-0.5">
                  Type: <strong className="text-emerald-800">{collectionType === 'HOME_COLLECTION' ? 'Doorstep Home Collection' : 'Center Visit'}</strong>
                </p>
                {collectionType === 'HOME_COLLECTION' && (
                  <p className="text-slate-500 mt-1">{homeAddress}, {area} - {pincode}</p>
                )}
              </div>
              <button onClick={() => setCurrentStep(3)} className="text-emerald-700 font-bold hover:underline">
                Change
              </button>
            </div>

            {/* Tests summary */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Selected Tests ({selectedTests.length})</span>
              <div className="divide-y divide-slate-100">
                {selectedTests.map(t => (
                  <div key={t.id} className="py-2 flex justify-between items-center">
                    <span>{t.name}</span>
                    <span className="font-bold text-slate-800">₹{t.price}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-sm">
                <span>Total Amount:</span>
                <span className="text-lg font-black text-[#0F294A]">₹{totalAmount}</span>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                * Zero online payment. Pay directly at collection or center visit.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(4)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Collection Type
            </button>

            <Button
              variant="secondary"
              size="lg"
              isLoading={isSubmitting}
              onClick={handleConfirmBooking}
            >
              Confirm Booking (No Payment)
            </Button>
          </div>
        </div>
      )}

      {/* STEP 6: BOOKING CONFIRMATION SCREEN */}
      {currentStep === 6 && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              Booking Confirmed
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              Appointment Scheduled Successfully
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your appointment has been registered in the database. Phlebotomy staff has been alerted.
            </p>
          </div>

          {/* Prominent Human-Readable Booking Number */}
          <div className="p-4 bg-slate-50 border-2 border-dashed border-[#0F294A]/30 rounded-2xl max-w-sm mx-auto space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Official Booking ID
            </span>
            <span className="text-2xl font-mono font-black text-[#0F294A] tracking-wider block">
              {confirmedBookingId}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Quote this booking number upon visit or sample collection
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigate('dashboard')}
            >
              View in Patient Dashboard
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setCurrentStep(1);
                setConfirmedBookingId('');
              }}
            >
              Book Another Test
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
