import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import { getAuthSession } from '../../../shared/auth/session'
import { getRoleHomePath } from '../../../shared/auth/roleRouting'

export function ForbiddenPage() {
  const navigate = useNavigate()
  const session = getAuthSession()
  const home = session ? getRoleHomePath(session.role) : '/login'

  return <Result status="403" title="403" subTitle="Bạn không có quyền truy cập khu vực này." extra={<Button type="primary" onClick={() => navigate(home, { replace: true })}>Về trang phù hợp</Button>} />
}
