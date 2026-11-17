import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { illustration } from '../../../shared/lib/assets.js';
import { todayLocal } from '../../../shared/lib/date.js';
import Button from '../../../shared/ui/Button.jsx';
import FormField from '../../../shared/ui/FormField.jsx';
import ItemImageInput from './ItemImageInput.jsx';
import ItemPreview from './ItemPreview.jsx';
import { emptyItem, validateItem, ITEM_CATEGORIES } from '../model/itemModel.js';
import { getCurrentUser } from '../../../shared/api/currentUser.js';
import { onBeforeUnauthorized } from '../../../shared/api/http.js';
import { draftKey, readDraft, saveDraft } from '../model/itemDraft.js';
import '../styles/form.css';
export default function ItemForm({
  initialValues,
  initialType,
  onSubmit,
  cancelTo = '/',
  cancelState,
  editing = false,
  itemId = 'new'
}) {
  const [values, setValues] = useState(() => ({
    ...emptyItem(initialType),
    ...initialValues,
    storageLocation: initialValues?.storageLocation || '',
    itemCategory: initialValues?.itemCategory || ''
  }));
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [user, setUser] = useState(null);
  const [accountError, setAccountError] = useState('');
  const [draftNotice, setDraftNotice] = useState('');
  const latest = useRef(values);
  latest.current = values;
  const keyRef = useRef(null);
  useEffect(() => {
    let active = true;
    getCurrentUser().then(account => {
      if (!active) return;
      setUser(account);
      keyRef.current = draftKey(account.id, itemId);
      try {
        const draft = readDraft(localStorage, keyRef.current);
        if (draft) {
          setValues(previous => ({
            ...previous,
            ...draft,
            itemCategory: draft.itemCategory || ''
          }));
          setDraftNotice('로그인 만료 전에 작성하던 내용을 불러왔어요. 확인 후 저장해주세요.');
        }
      } catch {
        setDraftNotice('브라우저 임시 저장소를 사용할 수 없어요. 만료 시 작성 내용을 복원하지 못할 수 있어요.');
      }
    }).catch(error => {
      if (active) setAccountError(error.message);
    });
    const unsubscribe = onBeforeUnauthorized(() => {
      if (!keyRef.current) return;
      try {
        saveDraft(localStorage, keyRef.current, latest.current);
      } catch {
        window.alert('임시 저장에 실패했어요. 입력 내용을 복사해 보관한 뒤 다시 로그인해주세요.');
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [itemId]);
  const submitting = useRef(false);
  const form = useRef(null);
  const found = values.type === 'FOUND';
  const update = (key, value) => {
    setValues(previous => ({
      ...previous,
      [key]: value,
      ...(key === 'type' && value === 'LOST' ? {
        storageLocation: ''
      } : {})
    }));
    setErrors(previous => ({
      ...previous,
      [key]: '',
      ...(key === 'type' ? {
        storageLocation: ''
      } : {})
    }));
    setFailure('');
  };
  const checkField = key => setErrors(previous => ({
    ...previous,
    [key]: validateItem(values)[key] || ''
  }));
  const fieldProps = key => ({
    id: key,
    name: key,
    value: values[key],
    disabled: busy || !user,
    'aria-invalid': !!errors[key],
    'aria-describedby': errors[key] ? key + '-error' : ['lostFoundAt', 'storageLocation'].includes(key) ? key + '-hint' : undefined,
    onChange: event => update(key, event.target.value),
    onBlur: () => checkField(key)
  });
  const submit = async event => {
    event.preventDefault();
    if (submitting.current || photoBusy || !user) return;
    if (editing && String(user.id) !== String(initialValues?.userId)) {
      setFailure('본인이 등록한 물품만 수정할 수 있어요.');
      return;
    }
    if (values.type === 'LOST' && !user.phone) {
      setFailure('분실물 등록 전에 마이페이지에서 전화번호를 입력해주세요.');
      return;
    }
    const nextErrors = validateItem(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || photoError) {
      const first = Object.keys(nextErrors)[0];
      if (first) form.current.elements.namedItem(first)?.focus();else document.getElementById('item-photo')?.focus();
      return;
    }
    submitting.current = true;
    setBusy(true);
    setFailure('');
    try {
      await onSubmit(values);
      if (keyRef.current) {
        try {
          localStorage.removeItem(keyRef.current);
        } catch {/* 저장 성공을 취소하지 않는다. */}
      }
    } catch (error) {
      setFailure(error.message || '저장하지 못했어요. 다시 시도해주세요.');
      if (error.fields) setErrors(error.fields);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  if (user && editing && String(user.id) !== String(initialValues?.userId)) {
    return <div role="alert"><p>본인이 등록한 물품만 수정할 수 있어요.</p><Link to={cancelTo}>상세로 돌아가기</Link></div>;
  }
  return <div className="item-editor">
      <h1 className="sr-only">{editing ? '물품 수정' : '물품 등록'}</h1>
      <div className="registration-tabs" role="radiogroup" aria-label="물품 구분">
        {[['FOUND', 'Package', '습득물'], ['LOST', 'Magnifying glass tilted left', '분실물']].map(([type, image, label]) => <label key={type}>
            <input type="radio" name="itemType" checked={values.type === type} disabled={busy || !user} onChange={() => update('type', type)} />
            <span>
              <img src={illustration(image)} alt="" width="30" height="30" />
              {label} {editing ? '수정' : '등록'}
            </span>
          </label>)}
      </div>
      <div className="editor-layout">
        <form ref={form} onSubmit={submit} noValidate className="item-form">
          {draftNotice && <p className="form-alert" role="status">{draftNotice}</p>}
          {accountError && <p className="form-alert" role="alert">{accountError}</p>}
          {failure && <p className="form-alert" role="alert">
              {failure} 입력한 내용은 그대로 남아 있어요.
            </p>}
          {editing && <section className="form-group">
              <h2>상태</h2>
              <div className="status-options" role="radiogroup" aria-label="물품 상태">
                {[['OPEN', '찾는 중', '아직 주인을 찾고 있어요'], ['RESOLVED', '해결 완료', '물건이 주인에게 돌아갔어요']].map(([status, title, description]) => <label key={status}>
                    <input type="radio" name="itemStatus" checked={values.status === status} disabled={busy || !user} onChange={() => update('status', status)} />
                    <span>
                      <b>{title}</b>
                      <small>{description}</small>
                    </span>
                  </label>)}
              </div>
            </section>}
          <section className="form-group">
            <h2>
              사진 <small>선택</small>
            </h2>
            <ItemImageInput value={values.imageUrl} disabled={busy || !user} onChange={value => update('imageUrl', value)} error={photoError || errors.imageBlob} onError={setPhotoError} onBusyChange={setPhotoBusy} />
          </section>
          <section className="form-group">
            <h2>물품 정보</h2>
            <FormField id="itemCategory" label="물품 종류" error={errors.itemCategory}>
              <select {...fieldProps('itemCategory')}><option value="">선택 안 함</option>{ITEM_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}</select>
            </FormField>
            <FormField id="name" label={found ? '습득물 명' : '분실물 명'} required count={values.name.length + '/100'} error={errors.name}>
              <input {...fieldProps('name')} maxLength={120} placeholder="예: 에어팟 프로, 남색 지갑" required />
            </FormField>
            <FormField id="description" label="특징·상세 설명" required count={values.description.length + '/2000'} error={errors.description}>
              <textarea {...fieldProps('description')} maxLength={2100} placeholder="색상, 브랜드, 스티커처럼 주인만 알 만한 특징을 적어 주세요" required onInput={event => {
              event.currentTarget.style.height = 'auto';
              event.currentTarget.style.height = Math.min(event.currentTarget.scrollHeight + 3, 360) + 'px';
            }} />
            </FormField>
            <div className="form-two">
              <FormField id="location" label={found ? '습득 장소' : '분실 장소'} required error={errors.location}>
                <input {...fieldProps('location')} maxLength={120} placeholder="예: 급식실, 기숙사 3층 휴게실" required />
              </FormField>
              <FormField id="lostFoundAt" label={found ? '습득 날짜' : '분실 날짜'} required error={errors.lostFoundAt} hint="오늘 이후 날짜는 고를 수 없어요">
                <input {...fieldProps('lostFoundAt')} type="date" max={todayLocal()} required />
              </FormField>
            </div>
            {found && <FormField id="storageLocation" label="보관 장소" required error={errors.storageLocation} hint="물건을 맡겨 둔 곳을 적어 주세요. 찾는 학생이 바로 갈 수 있어요.">
                <input {...fieldProps('storageLocation')} maxLength={120} placeholder="예: 학생부실, 행정실" required />
              </FormField>}
          </section>
          <div className="form-actions">
            {busy ? <Button variant="outline" disabled>
                취소
              </Button> : <Link to={cancelTo} state={cancelState} className="button button--outline">
                취소
              </Link>}
            <Button type="submit" loading={busy} disabled={photoBusy || !user || editing && String(user.id) !== String(initialValues?.userId)}>
              {busy ? editing ? '수정 중...' : '등록 중...' : editing ? '수정하기' : '등록하기'}
            </Button>
          </div>
        </form>
        <ItemPreview item={values} />
      </div>
    </div>;
}
