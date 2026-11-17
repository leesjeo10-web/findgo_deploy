export const DRAFT_TTL = 3 * 60 * 60 * 1000;
const prefix = 'finder-item-draft:';
export const draftKey = (userId, itemId = 'new') => prefix + userId + ':' + itemId;
export function saveDraft(storage, key, values, now = Date.now()) {
  const {
    type,
    name,
    description,
    location,
    storageLocation,
    lostFoundAt,
    status,
    imageUrl,
    itemCategory
  } = values;
  storage.setItem(key, JSON.stringify({
    expiresAt: now + DRAFT_TTL,
    values: {
      type,
      name,
      description,
      location,
      storageLocation,
      lostFoundAt,
      status,
      imageUrl,
      itemCategory
    }
  }));
}
export function readDraft(storage, key, now = Date.now()) {
  try {
    const draft = JSON.parse(storage.getItem(key));
    if (!draft || !Number.isFinite(draft.expiresAt) || draft.expiresAt <= now || !draft.values || typeof draft.values !== 'object') {
      storage.removeItem(key);
      return null;
    }
    const textFields = ['type', 'name', 'description', 'location', 'storageLocation', 'lostFoundAt', 'status'];
    if (textFields.some(field => typeof draft.values[field] !== 'string') || draft.values.imageUrl != null && typeof draft.values.imageUrl !== 'string' || draft.values.itemCategory != null && typeof draft.values.itemCategory !== 'string') {
      storage.removeItem(key);
      return null;
    }
    return draft.values;
  } catch {
    storage.removeItem(key);
    return null;
  }
}
export function findDrafts(storage, userId) {
  const accountPrefix = prefix + userId + ':';
  const keys = Array.from({
    length: storage.length
  }, (_, index) => storage.key(index));
  return keys.filter(key => key?.startsWith(accountPrefix)).flatMap(key => {
    const values = readDraft(storage, key);
    if (!values) return [];
    const itemId = key.slice(accountPrefix.length);
    return [{
      name: values.name || '작성 중인 물품',
      href: itemId === 'new' ? '/items/new' : '/items/' + encodeURIComponent(itemId) + '/edit'
    }];
  });
}
