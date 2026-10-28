import { create } from 'zustand';
import { itemsApi } from '../api/services';
import { errorMessage } from '../api/http';
let pendingFetch;
export const useItemStore = create(set => ({
  items: [], loading: false, error: '', loaded: false,
  fetchItems() {
    if (pendingFetch) return pendingFetch;
    set({ loading: true, error: '' });
    pendingFetch = itemsApi.list().then(items => {
      if (!Array.isArray(items)) throw new Error('목록 응답 형식을 확인해 주세요.');
      set({ items, loaded: true });
    }).catch(error => set({ error: errorMessage(error) }))
      .finally(() => { pendingFetch = null; set({ loading: false }); });
    return pendingFetch;
  },
  async saveItem(id, values, user) {
    const item = id ? await itemsApi.update(id, values, user) : await itemsApi.create(values, user);
    set(state => ({ items: id ? state.items.map(old => String(old.id) === id ? item : old) : [item, ...state.items] }));
    return item;
  },
  async deleteItem(id, user) {
    await itemsApi.remove(id, user);
    set(state => ({ items: state.items.filter(item => String(item.id) !== id) }));
  },
}));
