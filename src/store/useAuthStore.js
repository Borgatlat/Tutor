import { create } from 'zustand';
import { supabase, fetchMyProfile } from '../lib/supabase';

// ─── NO persist middleware — setupComplete comes from Supabase, not local storage ───
// Local storage can't be trusted because of hydration race conditions.
// The source of truth is profiles.setup_complete in the database.

const useAuthStore = create((set, get) => ({
  session:       null,
  profile:       null,
  loading:       true,
  setupComplete: false,

  /** Called once on app mount */
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

      // If profile exists but full_name is empty, sync from auth metadata
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

      // Source of truth: Supabase profile.setup_complete flag.
      // Fall back to full_name presence for accounts created before the column existed.
      const alreadySetup = !!profile?.setup_complete || !!profile?.full_name;

      set({ profile, loading: false, setupComplete: alreadySetup });
    } catch {
      // Profile row doesn't exist yet — create from signup metadata
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
          setupComplete: !!profile?.setup_complete || !!profile?.full_name,
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

  /** Called by ProfileSetupScreen after saving — marks the DB row AND local state */
  completeSetup: async () => {
    const userId = get().session?.user?.id;
    // Persist the flag to Supabase so it survives any reload / device change
    if (userId) {
      try {
        await supabase
          .from('profiles')
          .update({ setup_complete: true })
          .eq('id', userId);
      } catch (e) {
        if (__DEV__) console.warn('[completeSetup] DB update failed:', e);
      }
    }
    set({ setupComplete: true });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null, setupComplete: false });
  },

  setProfile: (profile) => set({ profile }),
}));

export default useAuthStore;
