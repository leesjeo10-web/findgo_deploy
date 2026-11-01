import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { authApi } from '../api/services';
import { setAccessToken } from '../api/http';
export const useAuthStore = create(persist(set => ({
  user: null, accessToken: null,
  async authenticate(mode, values) {
    const session = await authApi[mode](values);
    if (!session.user || !session.accessToken) throw new Error('로그인 응답 형식을 확인해 주세요.');
    setAccessToken(session.accessToken);
    set({ user: session.user, accessToken: session.accessToken });
  },
  clear() { setAccessToken(null); set({ user: null, accessToken: null }); },
  async logout() {
    await authApi.logout();
    setAccessToken(null);
    set({ user: null, accessToken: null });
  },
}), {
  name: 'chatgo-session', storage: createJSONStorage(() => sessionStorage),
  partialize: ({ user, accessToken }) => ({ user, accessToken }),
  onRehydrateStorage: () => state => setAccessToken(state?.accessToken || null),
}));
