import { create } from 'zustand';
export const useUIStore = create(set => ({
  query: '', setQuery: query => set({ query }),
  toast: null, notify: message => set({ toast: { message, id: Date.now() } }), clearToast: () => set({ toast: null }),
}));
