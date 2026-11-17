import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout.jsx'
import StudentFormDialog, {
  initialPassword,
} from '../components/StudentFormDialog.jsx'
import {
  listStudents,
  deleteStudent,
  resetStudentPassword,
} from '../api/adminRepository.js'
import Button from '../../../shared/ui/Button.jsx'
import Dialog from '../../../shared/ui/Dialog.jsx'
import ConfirmDialog from '../../../shared/ui/ConfirmDialog.jsx'
import LoadingState from '../../../shared/ui/LoadingState.jsx'
import ErrorState from '../../../shared/ui/ErrorState.jsx'
import EmptyState from '../../../shared/ui/EmptyState.jsx'
import ItemSearchForm from '../../items/components/ItemSearchForm.jsx'
import { formatDate } from '../../../shared/lib/date.js'
import { useToast } from '../../../shared/ui/Toast.jsx'
const PAGE_SIZE = 10
export default function StudentManagementPage() {
  const [params, setParams] = useSearchParams(),
    notify = useToast()
  const [students, setStudents] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null),
    [revision, setRevision] = useState(0),
    [adding, setAdding] = useState(false),
    [action, setAction] = useState(null),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState(null),
    [credential, setCredential] = useState(null)
  const lock = useRef(false),
    keyword = (params.get('keyword') || '').slice(0, 100),
    status = params.get('status') || ''
  const rawPage = Number(params.get('page')),
    requestedPage = Number.isFinite(rawPage)
      ? Math.max(0, Math.floor(rawPage || 1) - 1)
      : 0
  useEffect(() => {
    let active = true
    setLoading(true)
    listStudents()
      .then((users) => {
        if (active) {
          setStudents(users)
          setError(null)
        }
      })
      .catch((failure) => {
        if (active) setError(failure)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [revision])
  const filtered = students.filter(
    (student) =>
      (!keyword ||
        student.name.includes(keyword) ||
        student.loginId.includes(keyword)) &&
      (!status ||
        (status === 'ready'
          ? !student.mustChangePassword && !!student.phone
          : student.mustChangePassword || !student.phone)),
  )
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE),
    page = Math.min(requestedPage, Math.max(0, totalPages - 1)),
    visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  function update(key, value) {
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      if (key !== 'page') next.delete('page')
      value ? next.set(key, value) : next.delete(key)
      return next
    })
  }
  function choose(kind, student) {
    setActionError(null)
    setAction({ kind, student })
  }
  async function confirm() {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setActionError(null)
    try {
      if (action.kind === 'delete') {
        await deleteStudent(action.student.id)
        notify('학생 계정과 해당 학생의 물품을 삭제했어요.')
      } else {
        const password = initialPassword()
        await resetStudentPassword(action.student.id, password)
        setCredential({
          loginId: action.student.loginId,
          name: action.student.name,
          password,
        })
        notify('학생 비밀번호를 초기화했어요.')
      }
      setAction(null)
      setRevision((value) => value + 1)
    } catch (failure) {
      setActionError(failure)
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return (
    <AdminLayout
      title="학생 계정 관리"
      description="학생 계정을 지급하고, 초기 설정 상태와 등록한 물품 수를 확인해요."
      action={<Button onClick={() => setAdding(true)}>+ 학생 추가</Button>}
    >
      <div className="student-overview">
        <span>
          전체 학생 <b>{loading ? '–' : students.length}</b>명
        </span>
        <span>
          초기 설정 필요{' '}
          <b>
            {loading
              ? '–'
              : students.filter(
                  (student) => student.mustChangePassword || !student.phone,
                ).length}
          </b>
          명
        </span>
      </div>
      <div className="student-toolbar">
        <ItemSearchForm
          id="student-search"
          label="학생 검색"
          placeholder="이름, 학생 아이디로 검색"
          keyword={keyword}
          onSearch={(value) => update('keyword', value)}
        />
        <label>
          <span className="sr-only">학생 계정 상태</span>
          <select
            value={status}
            onChange={(event) => update('status', event.target.value)}
          >
            <option value="">전체 상태</option>
            <option value="setup">초기 설정 필요</option>
            <option value="ready">사용 중</option>
          </select>
        </label>
      </div>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          error={error}
          onRetry={() => setRevision((value) => value + 1)}
        />
      ) : !filtered.length ? (
        <EmptyState
          title={
            keyword || status
              ? '조건에 맞는 학생이 없어요'
              : '아직 등록된 학생이 없어요'
          }
          description="학생 계정을 추가하고 아이디와 초기 비밀번호를 전달해 주세요."
        >
          {keyword || status ? (
            <Button variant="outline" onClick={() => setParams({})}>
              검색·필터 초기화
            </Button>
          ) : (
            <Button onClick={() => setAdding(true)}>첫 학생 추가</Button>
          )}
        </EmptyState>
      ) : (
        <>
          <p className="student-result" aria-live="polite">
            검색 결과 <b>{filtered.length}</b>명
          </p>
          <p className="admin-scroll-hint">
            표를 좌우로 밀면 계정 관리 버튼을 볼 수 있어요.
          </p>
          <div
            className="student-table-scroll"
            role="region"
            aria-label="학생 관리 표, 좌우로 스크롤 가능"
            tabIndex={0}
          >
            <table className="student-table">
              <caption className="sr-only">학생 계정 목록</caption>
              <thead>
                <tr>
                  <th>학생 이름</th>
                  <th>아이디</th>
                  <th>전화번호</th>
                  <th>등록 물품</th>
                  <th>계정 상태</th>
                  <th>추가일</th>
                  <th>계정 관리</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <strong>{student.name}</strong>
                    </td>
                    <td>{student.loginId}</td>
                    <td>{student.phone || '입력 전'}</td>
                    <td>{student.itemCount}개</td>
                    <td>
                      <span
                        className={
                          'student-status ' +
                          (student.mustChangePassword || !student.phone
                            ? 'student-status--setup'
                            : '')
                        }
                      >
                        {student.mustChangePassword
                          ? '비밀번호 변경 필요'
                          : !student.phone
                            ? '연락처 입력 필요'
                            : '사용 중'}
                      </span>
                    </td>
                    <td>{formatDate(student.createdAt)}</td>
                    <td>
                      <div className="student-actions">
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => choose('reset', student)}
                        >
                          비밀번호 초기화
                        </Button>
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => choose('delete', student)}
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="student-pagination">
            <span>
              {filtered.length}명 중 {page * PAGE_SIZE + 1}–
              {Math.min((page + 1) * PAGE_SIZE, filtered.length)}명
            </span>
            <nav aria-label="학생 목록 페이지">
              <Button
                size="small"
                variant="outline"
                disabled={page === 0}
                onClick={() => update('page', String(page))}
              >
                이전
              </Button>
              <span>
                {page + 1} / {totalPages}
              </span>
              <Button
                size="small"
                variant="outline"
                disabled={page + 1 >= totalPages}
                onClick={() => update('page', String(page + 2))}
              >
                다음
              </Button>
            </nav>
          </div>
        </>
      )}
      {adding && (
        <StudentFormDialog
          onClose={() => setAdding(false)}
          onCreated={(next) => {
            setAdding(false)
            setCredential(next)
            setRevision((value) => value + 1)
            notify('학생 계정을 추가했어요.')
          }}
        />
      )}
      <ConfirmDialog
        open={!!action}
        title={
          action?.kind === 'delete'
            ? '학생 계정을 삭제할까요?'
            : '비밀번호를 초기화할까요?'
        }
        busy={busy}
        busyLabel="처리 중..."
        confirmVariant={action?.kind === 'delete' ? 'danger-solid' : 'primary'}
        confirmLabel={action?.kind === 'delete' ? '학생 삭제' : '초기화하기'}
        error={actionError}
        onClose={() => {
          if (!busy) setAction(null)
        }}
        onConfirm={confirm}
      >
        {action?.kind === 'delete' ? (
          <p>
            {action.student.name} 학생({action.student.loginId})의 계정, 등록한
            모든 물품과 사진을 함께 삭제해요. 삭제하면 되돌릴 수 없습니다.
          </p>
        ) : (
          <p>
            {action?.student.name} 학생에게 새 초기 비밀번호를 발급해요. 기존
            로그인은 해제되고 다음 로그인 때 비밀번호를 다시 변경해야 해요.
          </p>
        )}
      </ConfirmDialog>
      <Dialog
        open={!!credential}
        title="학생에게 계정을 전달해 주세요"
        onClose={() => setCredential(null)}
      >
        <p className="dialog-description">
          초기 비밀번호는 이 안내를 닫으면 다시 표시하지 않아요. 학생에게
          안전하게 전달해 주세요.
        </p>
        {credential && (
          <dl className="student-credentials">
            <div>
              <dt>이름</dt>
              <dd>{credential.name}</dd>
            </div>
            <div>
              <dt>아이디</dt>
              <dd>{credential.loginId}</dd>
            </div>
            <div>
              <dt>초기 비밀번호</dt>
              <dd>
                <code>{credential.password}</code>
              </dd>
            </div>
          </dl>
        )}
        <p className="auth-field-note">
          학생은 처음 로그인한 뒤 비밀번호를 직접 변경해요.
        </p>
        <Button className="button--full" onClick={() => setCredential(null)}>
          확인했어요
        </Button>
      </Dialog>
    </AdminLayout>
  )
}
