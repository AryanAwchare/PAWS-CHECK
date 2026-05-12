import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000';

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  profile_picture_url?: string;
  medical_history?: string;
}

interface PetContextType {
  pets: Pet[];
  activePet: Pet | null;
  setActivePetId: (id: string) => void;
  loading: boolean;
  refreshPets: () => Promise<void>;
  userId: string;
  isGuest: boolean;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

export function PetProvider({ children, userId }: { children: React.ReactNode, userId: string }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isGuest = userId === GUEST_USER_ID;

  const fetchPets = async () => {
    // Check locally persisted storage and automatically scrub legacy Bruno profiles while upgrading legacy IDs to valid UUIDs
    const localSaved = localStorage.getItem('pawscheck_local_pets');
    let localPets: Pet[] = [];
    if (localSaved) {
      try {
        const parsed = JSON.parse(localSaved);
        localPets = Array.isArray(parsed) ? parsed.filter((p: Pet) => p.id !== 'demo-pet-1' && p.name !== 'Bruno').map((p: Pet) => {
          // Upgrade legacy string IDs to prevent Postgres foreign key validation failures
          if (!p.id.includes('-') || p.id.startsWith('local-pet-')) {
            const upgradedUuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
              const r = Math.random() * 16 | 0;
              const v = c === 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
            return { ...p, id: upgradedUuid };
          }
          return p;
        }) : [];
        localStorage.setItem('pawscheck_local_pets', JSON.stringify(localPets));
      } catch (e) {}
    }

    // Start completely authentic and clean without forcing fake pre-populated pets

    // If using prototype or demo unverified account, load local cache straight away
    if (!userId || isGuest || userId.includes('00000000')) {
      setPets(localPets);
      if (localPets.length > 0 && (!activePetId || !localPets.find(p => p.id === activePetId))) {
        setActivePetId(localPets[0].id);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Query remote database table
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (Array.isArray(data) && data.length > 0) {
        setPets(data);
        if (!activePetId || !data.find((p: Pet) => p.id === activePetId)) {
          setActivePetId(data[0].id);
        }
      } else {
        // Safe state merge: fall back to local offline pets if remote table returns empty rows
        setPets(localPets);
        if (localPets.length > 0 && (!activePetId || !localPets.find(p => p.id === activePetId))) {
          setActivePetId(localPets[0].id);
        }
      }
    } catch (err) {
      console.warn("Failed to retrieve remote pets, binding local persistence items:", err);
      setPets(localPets);
      if (localPets.length > 0 && (!activePetId || !localPets.find(p => p.id === activePetId))) {
        setActivePetId(localPets[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPets();
  }, [userId]);

  const activePet = pets.find(p => p.id === activePetId) || null;

  return (
    <PetContext.Provider value={{ pets, activePet, setActivePetId, loading, refreshPets: fetchPets, userId, isGuest }}>
      {children}
    </PetContext.Provider>
  );
}

export function usePet() {
  const context = useContext(PetContext);
  if (context === undefined) {
    throw new Error('usePet must be used within a PetProvider');
  }
  return context;
}
