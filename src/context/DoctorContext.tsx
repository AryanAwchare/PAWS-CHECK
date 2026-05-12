import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Demo vet ID for prototype mode
const DEMO_VET_ID = '11111111-1111-1111-1111-111111111111';

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
  // Joined data
  pet_name?: string;
  pet_breed?: string;
  pet_species?: string;
  owner_name?: string;
  reason?: string;
}

export interface Appointment {
  id: string;
  pet_id: string;
  owner_id: string;
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
  refreshQueue: () => Promise<void>;
  refreshAppointments: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

// Demo data for prototype (no DB dependency)
const DEMO_VET_PROFILE: VetProfile = {
  id: DEMO_VET_ID,
  license_number: 'VET-MH-2024-1847',
  specialization: 'General Practice & Dermatology',
  clinic_name: 'PawCare Veterinary Clinic',
  clinic_address: '42 MG Road, Pune, Maharashtra',
  clinic_phone: '+91 98765 43210',
  years_of_experience: 8,
  bio: 'Experienced veterinarian specializing in small animal medicine with a focus on dermatological conditions.',
  consultation_fee: 500,
  is_available: true,
  vacation_mode: false,
  rating: 4.7,
  total_consultations: 1243,
};

const DEMO_QUEUE: QueueItem[] = [
  {
    id: 'q1', appointment_id: 'a1', pet_id: 'p1', owner_id: 'o1',
    queue_position: 1, status: 'in_consultation', check_in_time: new Date(Date.now() - 25 * 60000).toISOString(),
    start_time: new Date(Date.now() - 10 * 60000).toISOString(),
    estimated_wait_minutes: 0, is_walk_in: false, is_emergency: false,
    pet_name: 'Bruno', pet_breed: 'Golden Retriever', pet_species: 'Dog', owner_name: 'Priya Sharma', reason: 'Skin rash — AI flagged as URGENT',
  },
  {
    id: 'q2', appointment_id: 'a2', pet_id: 'p2', owner_id: 'o2',
    queue_position: 2, status: 'waiting', check_in_time: new Date(Date.now() - 15 * 60000).toISOString(),
    estimated_wait_minutes: 12, is_walk_in: true, is_emergency: false,
    pet_name: 'Whiskers', pet_breed: 'Persian', pet_species: 'Cat', owner_name: 'Raj Patel', reason: 'Loss of appetite for 2 days',
  },
  {
    id: 'q3', appointment_id: 'a3', pet_id: 'p3', owner_id: 'o3',
    queue_position: 3, status: 'waiting', check_in_time: new Date(Date.now() - 5 * 60000).toISOString(),
    estimated_wait_minutes: 25, is_walk_in: false, is_emergency: false,
    pet_name: 'Rocky', pet_breed: 'Labrador', pet_species: 'Dog', owner_name: 'Amit Kumar', reason: 'Vaccination follow-up',
  },
];

const DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1', pet_id: 'p1', owner_id: 'o1', vet_id: DEMO_VET_ID,
    appointment_date: new Date().toISOString(), duration_minutes: 30,
    status: 'in_progress', type: 'scheduled', reason: 'Skin rash — AI flagged as URGENT',
    urgency_level: 'urgent', pet_name: 'Bruno', owner_name: 'Priya Sharma', pet_breed: 'Golden Retriever',
  },
  {
    id: 'apend1', pet_id: 'p4', owner_id: 'o4', vet_id: DEMO_VET_ID,
    appointment_date: new Date(Date.now() + 2 * 3600000).toISOString(), duration_minutes: 30,
    status: 'pending', type: 'scheduled', reason: 'Limping on left front leg since yesterday',
    urgency_level: 'normal', pet_name: 'Max', owner_name: 'Sneha Reddy', pet_breed: 'German Shepherd',
  },
  {
    id: 'apend2', pet_id: 'p5', owner_id: 'o5', vet_id: DEMO_VET_ID,
    appointment_date: new Date(Date.now() + 4 * 3600000).toISOString(), duration_minutes: 30,
    status: 'pending', type: 'emergency', reason: 'Vomiting blood — EMERGENCY',
    urgency_level: 'emergency', pet_name: 'Luna', owner_name: 'Kiran Desai', pet_breed: 'Beagle',
  },
  {
    id: 'a4', pet_id: 'p6', owner_id: 'o6', vet_id: DEMO_VET_ID,
    appointment_date: new Date(Date.now() + 24 * 3600000).toISOString(), duration_minutes: 45,
    status: 'approved', type: 'follow_up', reason: 'Post-surgery check — Spay recovery',
    urgency_level: 'normal', pet_name: 'Bella', owner_name: 'Meera Joshi', pet_breed: 'Indie',
  },
];

export function DoctorProvider({ children }: { children: React.ReactNode }) {
  const [vetProfile, setVetProfile] = useState<VetProfile | null>(DEMO_VET_PROFILE);
  
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const stored = localStorage.getItem('pawscheck_custom_appointments');
      if (stored) {
        const parsed = JSON.parse(stored);
        return [...parsed, ...DEMO_APPOINTMENTS];
      }
    } catch(e) {}
    return DEMO_APPOINTMENTS;
  });

  const [queue, setQueue] = useState<QueueItem[]>(() => {
    try {
      const stored = localStorage.getItem('pawscheck_custom_appointments');
      if (stored) {
        const parsed = JSON.parse(stored);
        const mappedQueueItems = parsed.map((a: any, index: number) => ({
          id: `q-custom-${a.id}`,
          appointment_id: a.id,
          pet_id: a.pet_id,
          owner_id: a.owner_id,
          queue_position: DEMO_QUEUE.length + index + 1,
          status: 'waiting',
          check_in_time: a.appointment_date,
          estimated_wait_minutes: 15 * (DEMO_QUEUE.length + index),
          is_walk_in: false,
          is_emergency: a.urgency_level === 'emergency',
          pet_name: a.pet_name || 'My Pet',
          pet_breed: a.pet_breed || 'Unknown',
          pet_species: 'Dog',
          owner_name: a.owner_name || 'Pet Owner',
          reason: a.reason
        }));
        return [...DEMO_QUEUE, ...mappedQueueItems];
      }
    } catch(e) {}
    return DEMO_QUEUE;
  });

  const [loading, setLoading] = useState(false);

  // Poll custom appointments list periodically to sync changes made by the customer seamlessly into the active clinic view
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const stored = localStorage.getItem('pawscheck_custom_appointments');
        if (stored) {
          const parsed = JSON.parse(stored);
          setAppointments(prev => {
            const map = new Map(prev.map(p => [p.id, p]));
            parsed.forEach((item: any) => map.set(item.id, item));
            return Array.from(map.values());
          });
          setQueue(prev => {
            const currentIds = new Set(prev.map(p => p.appointment_id));
            const newItems = parsed.filter((a: any) => !currentIds.has(a.id)).map((a: any, index: number) => ({
              id: `q-custom-${a.id}`,
              appointment_id: a.id,
              pet_id: a.pet_id,
              owner_id: a.owner_id,
              queue_position: prev.length + index + 1,
              status: 'waiting',
              check_in_time: a.appointment_date,
              estimated_wait_minutes: 15 * (prev.length + index),
              is_walk_in: false,
              is_emergency: a.urgency_level === 'emergency',
              pet_name: a.pet_name || 'My Pet',
              pet_breed: a.pet_breed || 'Unknown',
              pet_species: 'Dog',
              owner_name: a.owner_name || 'Pet Owner',
              reason: a.reason
            }));
            return [...prev, ...newItems];
          });
        }
      } catch(e) {}
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const pendingRequests = appointments.filter(a => a.status === 'pending');

  const stats = {
    todayPatients: queue.filter(q => q.status === 'completed').length + 1,
    pendingCount: pendingRequests.length,
    activePrescriptions: 7,
    avgRating: vetProfile?.rating || 4.5,
    totalConsultations: vetProfile?.total_consultations || 0,
  };

  const refreshQueue = async () => {};
  const refreshAppointments = async () => {};
  const refreshAll = async () => {
    await Promise.all([refreshQueue(), refreshAppointments()]);
  };

  return (
    <DoctorContext.Provider value={{
      vetProfile, vetId: DEMO_VET_ID, queue, appointments, pendingRequests,
      stats, loading, refreshQueue, refreshAppointments, refreshAll,
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
