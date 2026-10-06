import { create } from 'zustand';

// ─── Global toast state ──────────────────────────────────────────────────────
// Lives outside the navigators on purpose. The moment a session exists, App.js
// swaps AuthNavigator → ProfileSetup/AppNavigator and unmounts the auth screen,
// so a success message owned by LoginScreen would flash for one frame and die
// with it. Toast is rendered at the App root instead, so it survives the swap
// and the user actually reads "you're signed in".
// ─────────────────────────────────────────────────────────────────────────────

let _timer = null;

const useToastStore = create((set) => ({
  message: '',
  variant: 'success',
  visible: false,

  /** show('Signed in', 'success') - variant: success | error | info */
  show: (message, variant = 'success', duration = 3200) => {
    if (_timer) clearTimeout(_timer);
    set({ message, variant, visible: true });
    _timer = setTimeout(() => set({ visible: false }), duration);
  },

  hide: () => {
    if (_timer) clearTimeout(_timer);
    set({ visible: false });
  },
}));

export default useToastStore;
