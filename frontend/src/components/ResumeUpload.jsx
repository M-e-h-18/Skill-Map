import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

// Resume Upload Component
const ResumeUpload = ({ onUpload, isDark, loading }) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className={`p-6 rounded-xl border-2 backdrop-blur-sm mb-6 ${isDark ? 'border-cyan-400/30 bg-slate-800/70' : 'border-slate-300 bg-white/90'} shadow-2xl`}>
      <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-cyan-300' : 'text-slate-700'}`}>
        <Upload className="w-5 h-5" />
        Upload Resume
      </h3>

      <div className="flex gap-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf"
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all duration-300 ${
            isDark
              ? 'border-cyan-400/30 hover:border-cyan-400 text-cyan-400 bg-slate-800/50'
              : 'border-slate-300 hover:border-slate-500 text-slate-600 bg-white/80'
          } hover:scale-105 shadow-lg backdrop-blur-sm flex items-center justify-center gap-2 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Upload className="w-4 h-4" />
          {loading ? 'Processing Resume...' : 'Choose PDF File'}
        </button>
      </div>

      <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        Upload your resume to automatically extract skills
      </p>
    </div>
  );
};

export default ResumeUpload;