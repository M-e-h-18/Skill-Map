import React, { useState, useRef } from 'react';
import { Search, Plus, RotateCcw, X } from 'lucide-react';
import * as api from '../api/api'; // Assuming api.js is in src/api

// Skills Input Component
const SkillsInput = ({ onAddSkill, onRemoveSkill, skills, isDark, loading, onResetSkills }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimeoutRef = useRef(null);

  const handleInputChange = (value) => {
    setInput(value);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(async () => {
      if (value.length > 1) {
        try {
          const response = await api.getSkillSuggestions(value);
          const filteredSuggestions = response.data.suggestions.filter(
            (s) => !skills.includes(s.name)
          );
          setSuggestions(filteredSuggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Error fetching skill suggestions:", error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  };

  const addSkill = async (skillName) => {
    if (skillName && !skills.includes(skillName)) {
      await onAddSkill(skillName);
      setInput('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  return (
    <div className={`p-6 rounded-xl border-2 backdrop-blur-sm ${isDark ? 'border-cyan-400/30 bg-slate-800/70' : 'border-slate-300 bg-white/90'} shadow-2xl`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-cyan-300' : 'text-slate-700'}`}>
          <Search className="w-5 h-5" />
          Add Skills
        </h3>

        <button
          onClick={onResetSkills}
          disabled={loading}
          className={`px-3 py-2 rounded-lg border transition-all duration-300 ${
            isDark
              ? 'border-red-400/30 hover:border-red-400 text-red-400 bg-slate-800/50'
              : 'border-red-500/30 hover:border-red-500 text-red-600 bg-white/80'
          } hover:scale-105 shadow-lg backdrop-blur-sm flex items-center gap-2 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addSkill(input)}
          onFocus={() => input.length > 1 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Search and add skills..."
          disabled={loading}
          className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
            isDark
              ? 'border-cyan-400/30 bg-slate-900/70 text-cyan-300 placeholder-cyan-500/50 focus:border-cyan-400'
              : 'border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:border-cyan-500'
          } focus:shadow-lg outline-none ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        />

        <button
          onClick={() => addSkill(input)}
          disabled={loading}
          className={`absolute right-2 top-2 p-2 rounded-lg transition-all duration-300 ${
            isDark
              ? 'hover:bg-cyan-400/20 text-cyan-400'
              : 'hover:bg-slate-100 text-slate-600'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Plus className="w-4 h-4" />
        </button>

        {showSuggestions && suggestions.length > 0 && (
          <div className={`absolute top-full left-0 right-0 mt-2 rounded-lg border backdrop-blur-sm ${
            isDark
              ? 'border-cyan-400/30 bg-slate-800/90'
              : 'border-slate-300 bg-white/90'
          } shadow-xl z-10 max-h-48 overflow-y-auto`}>
            {suggestions.slice(0, 8).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => addSkill(suggestion.name)}
                disabled={loading}
                className={`w-full px-4 py-3 text-left transition-all duration-200 ${
                  isDark
                    ? 'hover:bg-slate-700/50 text-cyan-300'
                    : 'hover:bg-slate-100 text-slate-700'
                } ${index === 0 ? 'rounded-t-lg' : ''} ${index === Math.min(7, suggestions.length - 1) ? 'rounded-b-lg' : ''} ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{suggestion.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {suggestion.category || 'General'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span
            key={index}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
              isDark
                ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
                : 'bg-cyan-100 text-cyan-700 border border-cyan-300'
            } hover:scale-105 shadow-lg flex items-center gap-1`}
          >
            {skill}
            <button
              onClick={() => onRemoveSkill(skill)}
              disabled={loading}
              className={`ml-1 ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'} transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default SkillsInput;