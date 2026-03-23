import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  role: 'admin' | 'user' | null;
  isBlocked: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  setRole: (role: 'admin' | 'user' | null) => void;
  setIsBlocked: (blocked: boolean) => void;
  setLoading: (loading: boolean) => void;
  fetchUserRole: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isBlocked: false,
  loading: true,
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setIsBlocked: (blocked) => set({ isBlocked: blocked }),
  setLoading: (loading) => set({ loading }),
  
  fetchUserRole: async (userId: string) => {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_blocked')
      .eq('id', userId)
      .maybeSingle();
    
    set({
      role: (roleData?.role as 'admin' | 'user') || 'user',
      isBlocked: profileData?.is_blocked || false,
    });
  },
  
  signOut: async () => {
    // Expire active sessions
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('sessions')
        .update({ status: 'expired', logout_time: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('status', 'active');
    }
    await supabase.auth.signOut();
    set({ user: null, role: null, isBlocked: false });
  },
}));
