import { useNavigate } from 'react-router-dom';
import './StatsCard.css';

export default function StatsCard({ icon, label, value, trend, color = 'primary', path }) {
  const navigate = useNavigate();
  return (
    <div 
      className={`stats-card glass-card color-${color} ${path ? 'clickable-stats' : ''}`}
      onClick={() => path && navigate(path)}
    >
      <div className="stats-icon-wrapper">
        <span className="stats-icon">{icon}</span>
      </div>
      <div className="stats-content">
        <span className="stats-value">{value}</span>
        <span className="stats-label">{label}</span>
      </div>
      {trend !== undefined && (
        <div className={`stats-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}
