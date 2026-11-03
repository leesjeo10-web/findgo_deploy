import { create } from 'zustand';
import { authApi } from '../api/services';
import { isDemo } from '../api/http';
// Keep the user in memory; restore only from the actual server session on reload.
export const useAuthStore = create(set => ({
  user: null,
  async authenticate(mode, values) {
    const session = await authApi[mode](values);
    if (!session.user) throw new Error('로그인 응답 형식을 확인해 주세요.');
    set({ user: session.user });
  },
  clear() { set({ user: null }); },
  async logout() { await authApi.logout(); set({ user: null }); },
}));
if (!isDemo) {
  authApi.me().then(user => useAuthStore.setState({ user })).catch(() => {});
}
