import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, fetchMyProfile } from '../lib/supabase';

const useAuthStore = create(
  persist(
    (set, get) => ({
      session:       null,
      profile:       null,
      loading:       true,
      setupComplete: false,
      // Track which userId completed setup so we never skip for a different user
      _setupUserId:  null,

      /** Called once on app mount — subscribes to Supabase auth state changes */
      init: () => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          set({ session });
          if (session?.user) {
            get().loadProfile(session.user.id);
          } else {
            set({ loading: false });
          }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            set({ session });
            if (session?.user) {
              get().loadProfile(session.user.id);
            } else {
              set({ profile: null, loading: false, setupComplete: false, _setupUserId: null });
            }
          }
        );

        return () => subscription.unsubscribe();
      },

      loadProfile: async (userId) => {
        try {
          const profile = await fetchMyProfile(userId);

          // If profile row exists but full_name is empty, sync from auth metadata
          if (!profile.full_name) {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              const meta = user?.user_metadata ?? {};
              if (meta.full_name) {
                await supabase.from('profiles').update({
                  full_name: meta.full_name,
                  role: meta.role || profile.role || 'student',
                }).eq('id', userId);
                profile.full_name = meta.full_name;
                profile.role = meta.role || profile.role || 'student';
              }
            } catch (e) {
              if (__DEV__) console.warn('[loadProfile] metadata sync:', e);
            }
          }

          const state = get();
          // Mark setup complete if:
          //  a) This user previously completed setup (persisted)
          //  b) Profile has a full_name (returning user)
          const alreadySetup =
            (state._setupUserId === userId && state.setupComplete) ||
            !!profile?.full_name;

          set({ profile, loading: false, setupComplete: alreadySetup });
        } catch {
          // Profile row doesn't exist — create from signup metadata
          try {
            const { data: { user } } = await supabase.auth.getUser();
            const meta = user?.user_metadata ?? {};
            await supabase.from('profiles').upsert({
              id:        userId,
              email:     user?.email ?? '',
              full_name: meta.full_name ?? '',
              role:      meta.role ?? 'student',
            }, { onConflict: 'id' });
            const profile = await fetchMyProfile(userId);
            set({
              profile,
              loading: false,
              setupComplete: !!profile?.full_name,
            });
          } catch {
            set({ loading: false, setupComplete: false });
          }
        }
      },

      refreshProfile: async () => {
        const userId = get().session?.user?.id;
        if (userId) await get().loadProfile(userId);
      },

      /** Called by ProfileSetupScreen when the user taps "Looks Good" or "Skip" */
      completeSetup: () => set({
        setupComplete: true,
        _setupUserId: get().session?.user?.id ?? null,
      }),

      signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, profile: null, setupComplete: false, _setupUserId: null });
      },

      setProfile: (profile) => set({ profile }),
    }),
    {
      name: 'strake-tutors-auth',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the flags we need — never persist sensitive session data
      partialize: (state) => ({
        setupComplete: state.setupComplete,
        _setupUserId:  state._setupUserId,
      }),
    }
  )
);

export default useAuthStore;
