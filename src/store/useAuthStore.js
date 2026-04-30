import { create } from 'zustand';
import { supabase, fetchMyProfile } from '../lib/supabase';

const useAuthStore = create((set, get) => ({
  session:       null,
  profile:       null,
  loading:       true,
  // True once the user has completed (or deliberately skipped) profile setup,
  // OR once an existing user's profile is loaded with a non-empty full_name.
  setupComplete: false,

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
          set({ profile: null, loading: false, setupComplete: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  },

  loadProfile: async (userId) => {
    try {
      const profile = await fetchMyProfile(userId);
      // Returning user — skip setup screen if they already have a name set
      set({ profile, loading: false, setupComplete: !!profile?.full_name });
    } catch {
      // Profile row doesn't exist yet (brand-new user after email confirmation).
      // Create it now from the user metadata stored during sign-up.
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
        set({ profile, loading: false, setupComplete: !!profile?.full_name });
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
  completeSetup: () => set({ setupComplete: true }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null, setupComplete: false });
  },

  setProfile: (profile) => set({ profile }),
}));

export default useAuthStore;
