import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ThemeToggle() {
  const { preferences, updatePreference } = useAuth();
  const isLight = preferences.theme === 'light';

  const toggleTheme = (mode) => {
    updatePreference('theme', mode);
  };

  return (
    <div className="flex items-center bg-dark/50 p-1 rounded-xl border border-edge backdrop-blur-md shadow-inner w-fit">
      <button
        onClick={() => toggleTheme('dark')}
        className={`relative flex items-center justify-center w-9 h-8 rounded-lg transition-all duration-300 group ${
          !isLight 
            ? 'bg-accent text-white shadow-lg shadow-accent/20' 
            : 'text-muted hover:text-primary hover:bg-surface'
        }`}
        aria-label="Dark Mode"
      >
        <Moon className={`w-4 h-4 z-10 ${!isLight ? 'fill-white/10' : ''}`} />
        {!isLight && (
          <div className="absolute inset-0 bg-accent rounded-lg animate-pulse opacity-20 blur-sm" />
        )}
      </button>

      <button
        onClick={() => toggleTheme('light')}
        className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 group ml-1 ${
          isLight 
            ? 'bg-warning text-dark shadow-lg shadow-warning/20' 
            : 'text-muted hover:text-primary hover:bg-surface'
        }`}
        aria-label="Light Mode"
      >
        <Sun className="w-4 h-4 z-10" />
        {isLight && (
          <div className="absolute inset-0 bg-warning rounded-lg animate-pulse opacity-40 blur-md scale-110" />
        )}
      </button>
    </div>
  );
}

