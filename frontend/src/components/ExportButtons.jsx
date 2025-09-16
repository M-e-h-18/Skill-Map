import React from 'react';
import { Download, FileImage, FileText } from 'lucide-react';

// Export Buttons Component
const ExportButtons = ({ onExportPNG, onExportSVG, onExportPDF, isDark }) => (
  <div className="flex gap-2">
    <button
      onClick={onExportPNG}
      className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
        isDark
          ? 'border-amber-400/30 hover:border-amber-400 text-amber-400 bg-slate-800/50'
          : 'border-amber-500/30 hover:border-amber-500 text-amber-600 bg-white/80'
      } hover:scale-105 shadow-lg backdrop-blur-sm flex items-center gap-2`}
    >
      <FileImage className="w-4 h-4" />
      PNG
    </button>

    <button
      onClick={onExportSVG}
      className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
        isDark
          ? 'border-green-400/30 hover:border-green-400 text-green-400 bg-slate-800/50'
          : 'border-green-500/30 hover:border-green-500 text-green-600 bg-white/80'
      } hover:scale-105 shadow-lg backdrop-blur-sm flex items-center gap-2`}
    >
      <Download className="w-4 h-4" />
      SVG
    </button>

    <button
      onClick={onExportPDF}
      className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
        isDark
          ? 'border-purple-400/30 hover:border-purple-400 text-purple-400 bg-slate-800/50'
          : 'border-purple-500/30 hover:border-purple-500 text-purple-600 bg-white/80'
      } hover:scale-105 shadow-lg backdrop-blur-sm flex items-center gap-2`}
    >
      <FileText className="w-4 h-4" />
      PDF
    </button>
  </div>
);

export default ExportButtons;