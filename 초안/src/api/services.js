import { http, isDemo } from './http';
import { demoUser, seedItems } from '../data/items';
const DATA_KEY = 'chatgo-demo-items-v1';
function readItems() {
  const saved = localStorage.getItem(DATA_KEY);
  if (!saved) return structuredClone(seedItems);
  try { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) return parsed; } catch { /* Recover invalid demo data. */ }
  return structuredClone(seedItems);
}
function writeItems(items) {
  try { localStorage.setItem(DATA_KEY, JSON.stringify(items)); }
  catch { throw new Error('브라우저 저장 공간이 부족해요. 더 작은 사진을 선택해 주세요.'); }
}
function assertOwner(item, userId) {
  if (!item) throw new Error('물건을 찾을 수 없어요.');
  if (item.ownerId !== userId) throw new Error('직접 등록한 물건만 변경할 수 있어요.');
}
function formData(values) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => { if (key !== 'image' && key !== 'imageFile' && value != null) data.append(key, value); });
  if (values.imageFile) data.append('image', values.imageFile);
  return data;
}
// REST contracts are documented in README.md. Demo data never goes to the API.
export const authApi = {
  async login(values) {
    if (isDemo) return { user: { ...demoUser, email: values.email }, accessToken: 'demo-session' };
    return (await http.post('/auth/login', values)).data;
  },
  async signup(values) {
    if (isDemo) return { user: { ...demoUser, name: values.name, email: values.email }, accessToken: 'demo-session' };
    return (await http.post('/auth/signup', values)).data;
  },
  async logout() { if (!isDemo) await http.post('/auth/logout'); },
};
export const itemsApi = {
  async list() {
    if (isDemo) return readItems();
    const data = (await http.get('/items')).data;
    return Array.isArray(data) ? data : data.items;
  },
  async get(id) {
    if (isDemo) {
      const item = readItems().find(item => String(item.id) === id);
      if (!item) throw new Error('물건을 찾을 수 없어요.');
      return item;
    }
    return (await http.get(`/items/${encodeURIComponent(id)}`)).data;
  },
  async create(values, user) {
    if (!isDemo) return (await http.post('/items', formData(values))).data;
    const { imageFile: _file, ...fields } = values;
    const item = { ...fields, id: crypto.randomUUID(), createdAt: new Date().toISOString(), ownerId: user.id, ownerName: user.name };
    writeItems([item, ...readItems()]);
    return item;
  },
  async update(id, values, user) {
    if (!isDemo) return (await http.patch(`/items/${encodeURIComponent(id)}`, formData(values))).data;
    const items = readItems();
    assertOwner(items.find(item => String(item.id) === id), user.id);
    const { imageFile: _file, ...fields } = values;
    const next = items.map(item => String(item.id) === id ? { ...item, ...fields } : item);
    writeItems(next);
    return next.find(item => String(item.id) === id);
  },
  async remove(id, user) {
    if (!isDemo) { await http.delete(`/items/${encodeURIComponent(id)}`); return; }
    const items = readItems();
    assertOwner(items.find(item => String(item.id) === id), user.id);
    writeItems(items.filter(item => String(item.id) !== id));
  },
};
