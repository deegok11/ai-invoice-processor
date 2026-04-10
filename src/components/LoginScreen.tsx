import type { UserRole } from '../types';

interface LoginScreenProps {
  onLogin: (role: UserRole) => void;
}

const ROLES: { role: UserRole; label: string; icon: string; description: string }[] = [
  { role: 'manager', label: 'Manager', icon: '👔', description: 'Can approve invoices up to ₹1,00,000' },
  { role: 'finance_head', label: 'Finance Head', icon: '🏦', description: 'Can give final approval for invoices over ₹1,00,000' },
  { role: 'employee', label: 'Regular Employee', icon: '👤', description: 'Can upload and process invoices' },
];

export function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <h1>🧾 AI Invoice Processor</h1>
          <p>Select your role to continue</p>
        </div>
        <div className="login-roles">
          {ROLES.map(({ role, label, icon, description }) => (
            <button
              key={role}
              className="login-role-btn"
              onClick={() => onLogin(role)}
            >
              <span className="login-role-icon">{icon}</span>
              <span className="login-role-label">{label}</span>
              <span className="login-role-desc">{description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
