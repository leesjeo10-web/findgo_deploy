import { Link } from 'react-router-dom';
export default function Brand() {
  return <Link to="/" className="brand" aria-label="찾Go 홈">
    <span className="brand-mark"><img src="/assets/4cb1c.svg" alt="" /></span><span>찾Go</span>
  </Link>;
}
