import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Theme Toggle Component
const ThemeToggle = ({ isDark, onToggle }) => (
  <button
    onClick={onToggle}
    className={`p-3 rounded-xl border-2 transition-all duration-300 ${isDark ? 'border-cyan-400/30 hover:border-cyan-400 text-cyan-400 bg-slate-800/50' : 'border-slate-300 hover:border-slate-500 text-slate-600 bg-white/80'} hover:scale-105 shadow-lg backdrop-blur-sm`}
  >
    {isDark ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
  </button>
);

export default ThemeToggle;