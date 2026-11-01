import { Link } from 'react-router-dom';
export function BackLink({ to = '/', children = '홈으로' }) {
  return <Link to={to} className="back-link"><img src="/assets/91329.svg" alt="" />{children}</Link>;
}
export default function PageTitle({ title, description }) {
  return <div className="page-title"><h1>{title}</h1>{description && <p>{description}</p>}</div>;
}
