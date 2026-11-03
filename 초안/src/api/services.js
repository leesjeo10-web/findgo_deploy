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
function fromServer(item) {
  return { ...item, type: item.type.toLowerCase(),
    status: item.status === 'RESOLVED' ? 'returned' : item.type === 'FOUND' ? 'stored' : 'searching',
    ownerId: item.userId, place: item.location, storagePlace: item.storageLocation,
    date: item.lostFoundAt, image: item.imageUrl };
}
async function itemBody(values) {
  let imageUrl = values.image || null;
  if (values.imageFile) {
    const data = new FormData();
    // The preview is already resized and converted to JPEG, including WEBP inputs.
    const file = values.image?.startsWith('data:image/jpeg')
      ? await (await fetch(values.image)).blob() : values.imageFile;
    data.append('file', file, 'photo.jpg');
    imageUrl = (await http.post('/images', data)).data.imageUrl;
  }
  return { type: values.type.toUpperCase(), name: values.name, description: values.description,
    status: values.status === 'returned' ? 'RESOLVED' : 'OPEN', location: values.place,
    storageLocation: values.type === 'found' ? values.storagePlace : '',
    lostFoundAt: values.date, imageUrl };
}
// REST contracts are documented in README.md. Demo data never goes to the API.
export const authApi = {
  async me() { return (await http.get('/auth/me')).data; },
  async login(values) {
    if (isDemo) return { user: { ...demoUser, email: values.email }, accessToken: 'demo-session' };
    await http.post('/auth/login', new URLSearchParams({ email: values.email, password: values.password }));
    return { user: (await http.get('/auth/me')).data };
  },
  async signup(values) {
    if (isDemo) return { user: { ...demoUser, name: values.name, email: values.email }, accessToken: 'demo-session' };
    await http.post('/auth/signup', values);
    return authApi.login(values);
  },
  async logout() { if (!isDemo) await http.post('/auth/logout'); },
};
export const itemsApi = {
  async list() {
    if (isDemo) return readItems();
    const data = (await http.get('/items')).data;
    return (Array.isArray(data) ? data : data.content).map(fromServer);
  },
  async get(id) {
    if (isDemo) {
      const item = readItems().find(item => String(item.id) === id);
      if (!item) throw new Error('물건을 찾을 수 없어요.');
      return item;
    }
    return fromServer((await http.get(`/items/${encodeURIComponent(id)}`)).data);
  },
  async create(values, user) {
    if (!isDemo) return fromServer((await http.post('/items', await itemBody(values))).data);
    const { imageFile: _file, ...fields } = values;
    const item = { ...fields, id: crypto.randomUUID(), createdAt: new Date().toISOString(), ownerId: user.id, ownerName: user.name };
    writeItems([item, ...readItems()]);
    return item;
  },
  async update(id, values, user) {
    if (!isDemo) return fromServer((await http.put(`/items/${encodeURIComponent(id)}`, await itemBody(values))).data);
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
