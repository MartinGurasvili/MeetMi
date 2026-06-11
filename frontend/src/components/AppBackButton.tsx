import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  to?: string;
  label?: string;
}

export default function AppBackButton({ to = '/', label = 'Back to map' }: Props) {
  return (
    <Link to={to} className="app-back-button">
      <ArrowLeft size={18} aria-hidden />
      <span>{label}</span>
    </Link>
  );
}
