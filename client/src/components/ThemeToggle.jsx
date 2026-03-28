import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();

  const getIcon = () => {
    switch(theme) {
      case 'dark': return '🌙';
      case 'light': return '☀️';
      case 'system': return '💻';
      default: return '🌙';
    }
  };

  const getLabel = () => {
    switch(theme) {
      case 'dark': return 'Dark Mode';
      case 'light': return 'Light Mode';
      case 'system': return 'System Mode';
      default: return 'Theme';
    }
  };

  return (
    <button 
      onClick={cycleTheme}
      className="btn btn-ghost btn-icon"
      title={`Switch Theme (Current: ${getLabel()})`}
      style={{ fontSize: '1.25rem' }}
    >
      {getIcon()}
    </button>
  );
}
