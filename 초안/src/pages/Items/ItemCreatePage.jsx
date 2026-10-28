import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageTitle, { BackLink } from '../../components/common/PageTitle';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { ErrorState, Loading } from '../../components/common/Feedback';
import { useItem } from '../../hooks/useItem';
import { useAuthStore } from '../../stores/useAuthStore';
import { useItemStore } from '../../stores/useItemStore';
import { useUIStore } from '../../stores/useUIStore';
import { typeLabel } from '../../data/items';
import { errorMessage } from '../../api/http';
import { prepareImage } from '../../utils/image';

export function EditItemPage() {
  const { id } = useParams();
  const { item, loading, error, retry } = useItem(id);
  const user = useAuthStore(state => state.user);
  if (loading) return <main className="page"><Loading /></main>;
  if (error) return <main className="page"><BackLink to="/mypage">마이페이지</BackLink><ErrorState message={error} retry={retry} /></main>;
  if (String(item.ownerId) !== String(user.id)) return <main className="page"><BackLink /><ErrorState message="직접 등록한 물건만 수정할 수 있어요." /></main>;
  return <ItemCreatePage key={id} type={item.type} initialItem={item} />;
}

export default function ItemCreatePage({ type, initialItem }) {
  const edit = !!initialItem;
  const found = type === 'found';
  const label = typeLabel(type);
  const user = useAuthStore(state => state.user);
  const saveItem = useItemStore(state => state.saveItem);
  const notify = useUIStore(state => state.notify);
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const [form, setForm] = useState({ name: initialItem?.name || '', description: initialItem?.description || '', place: initialItem?.place || '', date: initialItem?.date?.slice(0, 10) || '', storagePlace: initialItem?.storagePlace || '', status: initialItem?.status || (found ? 'stored' : 'searching') });
  const [image, setImage] = useState(initialItem?.image || null);
  const [imageFile, setImageFile] = useState(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  const backTo = edit ? '/mypage' : `/items/${type}`;
  const update = key => event => setForm(value => ({ ...value, [key]: event.target.value }));
  async function chooseImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageBusy(true); setImageError('');
    try { const preview = await prepareImage(file); setImage(preview); setImageFile(file); }
    catch (error) { setImageError(error.message || '사진을 읽을 수 없어요. 다른 사진을 선택해 주세요.'); }
    finally { setImageBusy(false); event.target.value = ''; }
  }
  async function submit(event) {
    event.preventDefault();
    if (busy || imageBusy) return;
    const values = { ...form, name: form.name.trim(), description: form.description.trim(), place: form.place.trim(), storagePlace: found ? form.storagePlace.trim() : '', image, imageFile, type };
    if (!values.name || !values.place || (found && !values.storagePlace) || !values.date || values.date > today) {
      setError('필수 항목과 날짜를 확인해 주세요. 공백만 입력할 수 없어요.'); return;
    }
    setBusy(true); setError('');
    try {
      const item = await saveItem(initialItem ? String(initialItem.id) : null, values, user);
      notify(edit ? '물건 정보를 수정했어요.' : `${label}이 등록됐어요.`);
      navigate(edit ? '/mypage' : `/items/detail/${item.id}`, { replace: true });
    } catch (error) { setError(errorMessage(error)); } finally { setBusy(false); }
  }
  return <main className="page flex flex-col gap-6"><BackLink to={backTo}>{edit ? '마이페이지' : '목록으로'}</BackLink>
    <PageTitle title={edit ? '물건 정보를 수정해 주세요' : found ? '어떤 물건을 주웠나요?' : '어떤 물건을 잃어버렸나요?'} description={edit ? '달라진 정보가 있다면 알려주세요.' : found ? '사진과 특징을 알려주면 주인이 더 쉽게 찾을 수 있어요.' : '물건의 특징과 마지막으로 본 장소를 알려주세요.'} />
    <form onSubmit={submit} className="registration-layout">
      <div className="flex flex-col gap-6">
        <input ref={fileInput} id="item-photo" hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} disabled={imageBusy || busy} aria-label="물건 사진 업로드" />
        <button type="button" className="photo-upload" onClick={() => fileInput.current?.click()} disabled={imageBusy || busy} aria-label={image || edit ? '물건 사진 변경' : '물건 사진 업로드'}>
          {image ? <img className="uploaded-photo" src={image} alt="선택한 물건 사진 미리보기" /> : edit && found ? <img src="/assets/b3964.svg" alt="지갑 일러스트" /> : <>
            <span className="camera-tile"><img src="/assets/3a6f7.svg" alt="" /></span><span>{imageBusy ? '사진을 준비하고 있어요…' : '사진을 올려주세요'}</span><span className="text-sm text-muted">물건의 특징이 잘 보이게 찍어주세요</span>
          </>}
        </button>
        {imageBusy && <p className="text-sm text-muted" role="status">사진을 준비하고 있어요…</p>}
        {imageError && <p className="field-error" role="alert">{imageError}</p>}
        {edit ? <Button variant="neutral" onClick={() => fileInput.current?.click()} disabled={imageBusy || busy}>사진 변경</Button> : <aside className="guide-panel"><h2>이렇게 등록해 주세요</h2><p>{found ? <>색상과 브랜드처럼 구분되는 특징을 적어주세요.<br />보관 장소는 주인이 찾을 수 있게 정확히 알려주세요.</> : <>마지막으로 본 장소와 날짜를 적어주세요.<br />개인정보가 보이는 사진은 피해 주세요.</>}</p></aside>}
      </div>
      <div className="form-fields">
        <Input label="물건 이름 *" value={form.name} onChange={update('name')} placeholder={found ? '예: 검은색 반지갑' : '예: 파란색 우산'} required maxLength={80} />
        {edit ? <Input label="특징 · 상세 설명" value={form.description} onChange={update('description')} maxLength={1000} /> : <div className="field"><label htmlFor="item-description">특징 · 상세 설명</label><textarea id="item-description" className="text-input" rows={3} placeholder="색상, 브랜드 등 알아볼 수 있는 특징을 적어주세요" value={form.description} onChange={update('description')} maxLength={1000} /></div>}
        {edit ? <Input label={`${found ? '습득' : '분실'} 장소 *`} value={form.place} onChange={update('place')} required maxLength={120} /> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Input label={`${found ? '습득' : '분실'} 장소 *`} placeholder="장소를 입력해 주세요" value={form.place} onChange={update('place')} required maxLength={120} /><Input label={`${found ? '습득' : '분실'} 날짜 *`} type="date" value={form.date} onChange={update('date')} max={today} required /></div>}
        {found && <Input label="보관 장소 *" placeholder="예: 학생회관 1층 분실물 보관함" value={form.storagePlace} onChange={update('storagePlace')} required maxLength={160} />}
        {edit ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Input label={`${found ? '습득' : '분실'} 날짜 *`} type="date" value={form.date} onChange={update('date')} max={today} required /><div className="field"><label htmlFor="item-status">상태</label><select id="item-status" className="text-input" value={form.status} onChange={update('status')}><option value={found ? 'stored' : 'searching'}>{found ? '보관 중' : '찾고 있어요'}</option><option value="returned">주인을 찾았어요</option></select></div></div> : <p className="text-xs text-muted">* 표시는 꼭 입력해 주세요.</p>}
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="form-actions"><Button variant="neutral" onClick={() => navigate(backTo)} disabled={busy}>취소</Button><Button type="submit" loading={busy} disabled={imageBusy}>{edit ? '변경 내용 저장' : `${label} 등록하기`}</Button></div>
      </div>
    </form>
  </main>;
}
