import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ThemeToggle() {
  const { preferences, updatePreference } = useAuth();
  const isLight = preferences.theme === 'light';

  const toggleTheme = () => {
    updatePreference('theme', isLight ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center w-14 h-7 rounded-full bg-surface border border-edge p-1 transition-all duration-500 ease-in-out hover:border-accent group overflow-hidden"
      aria-label="Toggle theme"
    >
      {/* Background glow/particles effect (optional for extra flair) */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isLight ? 'bg-amber-500/10' : 'bg-accent/10'}`} />

      {/* Sliding track thumb */}
      <div
        className={`relative z-10 flex items-center justify-center w-5 h-5 rounded-full shadow-lg transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isLight 
            ? 'translate-x-[26px] bg-white text-amber-500' 
            : 'translate-x-0 bg-dark text-accent'
        }`}
      >
        {isLight ? (
          <Sun className="w-3.5 h-3.5 fill-current animate-zoom-in" />
        ) : (
          <Moon className="w-3.5 h-3.5 fill-current animate-spin-in" />
        )}
      </div>

      {/* Static icons in background */}
      <div className="absolute inset-0 flex items-center justify-between px-2 text-muted/30">
        <Moon className={`w-3 h-3 transition-opacity duration-300 ${isLight ? 'opacity-100' : 'opacity-0'}`} />
        <Sun className={`w-3 h-3 transition-opacity duration-300 ${isLight ? 'opacity-0' : 'opacity-100'}`} />
      </div>
    </button>
  );
}
