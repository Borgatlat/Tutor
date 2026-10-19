import { create } from 'zustand';
import { supabase, fetchMyProfile } from '../lib/supabase';
import { unregisterPush } from '../utils/push';

// ─── NO persist middleware: setupComplete comes from Supabase, not local storage ───
// Local storage can't be trusted because of hydration race conditions.
// The source of truth is profiles.setup_complete in the database.

/**
 * Source of truth: the profile's setup_complete flag. Email accounts made
 * before that column existed count as set up once they have a name; Google
 * accounts always arrive with a name, so they don't get that shortcut.
 */
function isSetUp(profile, session) {
  if (profile?.setup_complete) return true;
  return !!profile?.full_name && !!session?.user?.user_metadata?.role;
}

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

      const alreadySetup = isSetUp(profile, get().session);

      set({ profile, loading: false, setupComplete: alreadySetup });
    } catch {
      // Profile row doesn't exist yet: create from signup metadata
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const meta = user?.user_metadata ?? {};
        await supabase.from('profiles').upsert({
          id:        userId,
          email:     user?.email ?? '',
          full_name: meta.full_name ?? '',
          role:      meta.role ?? 'student',
          // Google accounts come with a profile photo
          ...(meta.avatar_url ? { avatar_url: meta.avatar_url } : {}),
        }, { onConflict: 'id' });
        const profile = await fetchMyProfile(userId);
        set({
          profile,
          loading: false,
          setupComplete: isSetUp(profile, get().session),
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

  /** Called by ProfileSetupScreen after saving: marks the DB row AND local state */
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

  /**
   * Permanently delete the account and everything tied to it: profile,
   * subjects, sessions, chats, reviews and push tokens (delete_my_account in
   * migration 003). Throws if the server refuses, so the screen can say so.
   */
  deleteAccount: async () => {
    const userId = get().session?.user?.id;
    if (!userId) return;
    // Storage files can't be removed from SQL, so clear the profile photo first.
    try {
      const { data: files } = await supabase.storage.from('avatars').list(userId);
      if (files?.length) {
        await supabase.storage.from('avatars').remove(files.map((f) => `${userId}/${f.name}`));
      }
    } catch (e) {
      if (__DEV__) console.warn('[deleteAccount] avatar cleanup:', e);
    }
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw error;
    // The login no longer exists on the server, so only clear this device.
    await supabase.auth.signOut({ scope: 'local' });
    set({ session: null, profile: null, setupComplete: false });
  },

  signOut: async () => {
    await unregisterPush(get().session?.user?.id);
    await supabase.auth.signOut();
    set({ session: null, profile: null, setupComplete: false });
  },

  setProfile: (profile) => set({ profile }),
}));

export default useAuthStore;
