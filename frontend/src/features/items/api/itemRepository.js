import { apiRequest } from '../../../shared/api/http.js';
import { normalizeItem, validateItem, PAGE_SIZE } from '../model/itemModel.js';
function query(options = {}) {
  const params = new URLSearchParams();
  for (const key of ['keyword', 'type', 'status', 'itemCategory', 'sort', 'page', 'size']) {
    const value = options[key];
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  return params.toString();
}
export const listItems = ({
  mine = false,
  ...options
} = {}) => apiRequest((mine ? '/me/items' : '/items') + '?' + query({
  size: PAGE_SIZE,
  ...options
}));
export const getItem = id => apiRequest('/items/' + encodeURIComponent(id));
function checked(values) {
  const fields = validateItem(values);
  if (Object.keys(fields).length) throw Object.assign(new Error('입력한 내용을 확인해주세요.'), {
    fields
  });
  const {
    imageBlob: _unused,
    ...body
  } = normalizeItem(values);
  return body;
}
export const createItem = values => apiRequest('/items', {
  method: 'POST',
  body: checked(values)
});
export const updateItem = (id, values) => apiRequest('/items/' + encodeURIComponent(id), {
  method: 'PUT',
  body: checked(values)
});
export const deleteItem = id => apiRequest('/items/' + encodeURIComponent(id), {
  method: 'DELETE'
});
export const updateItemStatus = (id, status) => apiRequest('/items/' + encodeURIComponent(id) + '/status', {
  method: 'PATCH',
  body: {
    status
  }
});
export async function getItemCounts() {
  const [found, lost] = await Promise.all(['FOUND', 'LOST'].map(type => listItems({
    mine: true,
    type,
    size: 1
  })));
  return {
    FOUND: found.totalElements,
    LOST: lost.totalElements
  };
}
