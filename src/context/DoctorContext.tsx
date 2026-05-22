import React, { createContext, useContext, useState, useEffect } from 'react';

export interface VetProfile {
  id: string;
  license_number: string;
  specialization: string;
  clinic_name: string;
  clinic_address: string;
  clinic_phone: string;
  years_of_experience: number;
  bio: string;
  consultation_fee: number;
  is_available: boolean;
  vacation_mode: boolean;
  rating: number;
  total_consultations: number;
}

export interface QueueItem {
  id: string;
  appointment_id: string;
  pet_id: string;
  owner_id: string;
  queue_position: number;
  status: 'waiting' | 'in_consultation' | 'completed' | 'skipped';
  check_in_time: string;
  start_time?: string;
  end_time?: string;
  estimated_wait_minutes?: number;
  is_walk_in: boolean;
  is_emergency: boolean;
  pet_name?: string;
  pet_breed?: string;
  pet_species?: string;
  owner_name?: string;
  owner_email?: string;
  reason?: string;
}

export interface Appointment {
  id: string;
  pet_id: string;
  owner_id: string;
  owner_email?: string;
  vet_id: string;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  type: string;
  reason: string;
  rejection_reason?: string;
  owner_notes?: string;
  urgency_level: string;
  pet_name?: string;
  owner_name?: string;
  pet_breed?: string;
  pet_weight?: string | number;
  pet_age?: number;
  pet_species?: string;
  previous_medications?: string;
}

interface DoctorContextType {
  vetProfile: VetProfile | null;
  vetId: string;
  queue: QueueItem[];
  appointments: Appointment[];
  pendingRequests: Appointment[];
  stats: {
    todayPatients: number;
    pendingCount: number;
    activePrescriptions: number;
    avgRating: number;
    totalConsultations: number;
  };
  loading: boolean;
  updateAppointmentStatus: (id: string, status: string, rejectionReason?: string) => void;
  refreshQueue: () => Promise<void>;
  refreshAppointments: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

// Vet profile pulled from localStorage when a vet logs in
const DEMO_VET_PROFILE: VetProfile = {
  id: 'vet-active',
  license_number: 'VET-MH-2024-1847',
  specialization: 'General Practice & Dermatology',
  clinic_name: 'PawCare Veterinary Clinic',
  clinic_address: '42 MG Road, Pune, Maharashtra',
  clinic_phone: '+91 98765 43210',
  years_of_experience: 8,
  bio: 'Experienced veterinarian specializing in small animal medicine.',
  consultation_fee: 500,
  is_available: true,
  vacation_mode: false,
  rating: 4.7,
  total_consultations: 0,
};

const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

// Key used in localStorage shared between customer and doctor portals
const SHARED_APPOINTMENTS_KEY = 'pawscheck_custom_appointments';

function loadRealAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(SHARED_APPOINTMENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Appointment[];
  } catch {
    return [];
  }
}

function saveAppointments(list: Appointment[]) {
  try {
    localStorage.setItem(SHARED_APPOINTMENTS_KEY, JSON.stringify(list));
  } catch {}
}

function mapToQueue(apts: Appointment[]): QueueItem[] {
  return apts
    .filter(a => a.status === 'pending' || a.status === 'approved' || a.status === 'in_progress')
    .map((a, index) => ({
      id: `q-${a.id}`,
      appointment_id: a.id,
      pet_id: a.pet_id,
      owner_id: a.owner_id,
      owner_email: a.owner_email,
      queue_position: index + 1,
      status: a.status === 'in_progress' ? 'in_consultation' : 'waiting',
      check_in_time: a.appointment_date,
      estimated_wait_minutes: 15 * index,
      is_walk_in: a.type === 'walk_in',
      is_emergency: a.urgency_level === 'emergency',
      pet_name: a.pet_name || 'Unknown Pet',
      pet_breed: a.pet_breed || 'Unknown',
      pet_species: 'Dog',
      owner_name: a.owner_name || 'Pet Owner',
      reason: a.reason,
    }));
}

export function DoctorProvider({ children }: { children: React.ReactNode }) {
  const [vetProfile] = useState<VetProfile>(DEMO_VET_PROFILE);
  const [appointments, setAppointments] = useState<Appointment[]>(loadRealAppointments);
  const [queue, setQueue] = useState<QueueItem[]>(() => mapToQueue(loadRealAppointments()));

  // Poll shared localStorage for new appointments written by customer portal
  useEffect(() => {
    const interval = setInterval(() => {
      const fresh = loadRealAppointments();
      setAppointments(fresh);
      setQueue(mapToQueue(fresh));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const updateAppointmentStatus = (id: string, status: string, rejectionReason?: string) => {
    setAppointments(prev => {
      const updated = prev.map(a =>
        a.id === id ? { ...a, status, ...(rejectionReason ? { rejection_reason: rejectionReason } : {}) } : a
      );
      saveAppointments(updated);
      setQueue(mapToQueue(updated));
      return updated;
    });
  };

  const pendingRequests = appointments.filter(a => a.status === 'pending');

  const stats = {
    todayPatients: appointments.filter(a => a.status === 'completed').length,
    pendingCount: pendingRequests.length,
    activePrescriptions: appointments.filter(a => a.status === 'approved').length,
    avgRating: vetProfile.rating,
    totalConsultations: vetProfile.total_consultations,
  };

  const refreshQueue = async () => {};
  const refreshAppointments = async () => {};
  const refreshAll = async () => {};

  return (
    <DoctorContext.Provider value={{
      vetProfile, vetId: vetProfile.id, queue, appointments, pendingRequests,
      stats, loading: false, updateAppointmentStatus, refreshQueue, refreshAppointments, refreshAll,
    }}>
      {children}
    </DoctorContext.Provider>
  );
}

export function useDoctor() {
  const context = useContext(DoctorContext);
  if (!context) throw new Error('useDoctor must be used within DoctorProvider');
  return context;
}
