import React from 'react';
import { BarChart2, Briefcase, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Helper to normalize string or array fields to arrays
const normalizeArray = val =>
  Array.isArray(val)
    ? val
    : typeof val === "string"
      ? val.split(/[,]|[\u0026]| /).map(s => s.trim()).filter(Boolean)
      : [];

const AnalysisPanel = ({ analysis, isDark, loading }) => {
  if (loading) {
    return (
      <div className={`p-6 rounded-xl border-2 backdrop-blur-sm ${isDark ? 'border-cyan-400/30 bg-slate-800/70' : 'border-slate-300 bg-white/90'} shadow-2xl`}>
        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-cyan-300' : 'text-slate-700'}`}>
          <Target className="w-5 h-5" />
          Career Role Analyses
        </h3>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  const chartData = Array.isArray(analysis)
    ? analysis.map(item => ({
        role: item.title.replace(" Readiness Assessment", "").replace(" Readiness Analysis", ""),
        readiness: item.readiness || 0,
        full: item,
      }))
    : [];

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const roleAnalysis = Array.isArray(analysis) ? analysis.find(item => item.title === label) : null;
      return (
        <div className={`p-3 rounded-lg shadow-md ${isDark ? 'bg-slate-700 text-cyan-200' : 'bg-white text-slate-700'}`}>
          <p className="font-bold text-lg">{label}</p>
          <p className="text-sm">Readiness: <span className="font-semibold">{payload[0].value}%</span></p>
          {roleAnalysis && (
            <>
              {normalizeArray(roleAnalysis.missingSkills).length > 0 && (
                <p className="text-xs mt-1">Missing: <span className="font-medium text-red-400">{normalizeArray(roleAnalysis.missingSkills).join(', ')}</span></p>
              )}
              {normalizeArray(roleAnalysis.suggestedSkills).length > 0 && (
                <p className="text-xs">Enhance with: <span className="font-medium text-amber-300">{normalizeArray(roleAnalysis.suggestedSkills).join(', ')}</span></p>
              )}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`p-6 rounded-xl border-2 backdrop-blur-sm ${isDark ? 'border-cyan-400/30 bg-slate-800/70' : 'border-slate-300 bg-white/90'} shadow-2xl`}>
      <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-cyan-300' : 'text-slate-700'}`}>
        <Target className="w-5 h-5" />
        Career Role Analyses
      </h3>

      {!Array.isArray(analysis) || analysis.length === 0 ? (
        <p className={`text-center py-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Add skills to see career recommendations
        </p>
      ) : (
        <>
          {/* Readiness Overview Chart */}
          <div className="mb-6">
            <h4 className={`font-bold mb-2 ${isDark ? 'text-cyan-300' : 'text-slate-700'} flex items-center gap-2`}>
              <BarChart2 className="w-4 h-4" /> Readiness Overview
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="role"
                  type="category"
                  width={120}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={value =>
                    value.length > 18 ? value.substring(0, 18) + "..." : value
                  }
                  style={{
                    fill: isDark ? '#a7f3d0' : '#475569',
                    fontSize: '0.75rem',
                  }}
                />
                <Tooltip content={CustomTooltip} />
                <defs>
                  <linearGradient id="colorReadinessDark" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                  <linearGradient id="colorReadinessLight" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="50%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                </defs>
                <Bar
                  dataKey="readiness"
                  fill={isDark ? "url(#colorReadinessDark)" : "url(#colorReadinessLight)"}
                  radius={[6, 6, 6, 6]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Role-Specific Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[32rem] overflow-y-auto pr-2">
            {analysis.map((item, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  isDark
                    ? 'border-slate-600/30 bg-slate-700/50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <h4
                  className={`font-bold mb-2 ${
                    isDark ? 'text-green-400' : 'text-green-600'
                  }`}
                >
                  <Briefcase className="inline-block w-4 h-4 mr-2" />
                  {item.title} ({item.readiness || 0}% ready)
                </h4>
                <p
                  className={`text-sm mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {item.description}
                </p>

                {/* Missing Skills */}
                {normalizeArray(item.missingSkills).length > 0 && (
                  <p
                    className={`text-xs ${
                      isDark ? 'text-red-300' : 'text-red-600'
                    } flex flex-wrap gap-1`}
                  >
                    <span className="font-semibold">Missing:</span>
                    {normalizeArray(item.missingSkills).map((skill, i) => (
                      <span
                        key={i}
                        className={`px-2 py-0.5 rounded-full ${
                          isDark ? 'bg-red-900/40' : 'bg-red-100'
                        } border ${
                          isDark
                            ? 'border-red-700/50'
                            : 'border-red-300'
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </p>
                )}

                {/* Suggested Skills */}
                {normalizeArray(item.suggestedSkills).length > 0 && (
                  <p
                    className={`text-xs mt-1 ${
                      isDark ? 'text-amber-300' : 'text-amber-600'
                    } flex flex-wrap gap-1`}
                  >
                    <span className="font-semibold">Suggested:</span>
                    {normalizeArray(item.suggestedSkills).map((skill, i) => (
                      <span
                        key={i}
                        className={`px-2 py-0.5 rounded-full ${
                          isDark ? 'bg-amber-900/40' : 'bg-amber-100'
                        } border ${
                          isDark
                            ? 'border-amber-700/50'
                            : 'border-amber-300'
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </p>
                )}

                {/* Pathways */}
                {normalizeArray(item.pathways).length > 0 && (
                  <div
                    className={`text-xs mt-2 ${
                      isDark ? 'text-slate-400' : 'text-slate-700'
                    }`}
                  >
                    <p className="font-semibold mb-1">
                      Learning Pathways:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {normalizeArray(item.pathways).map((path, i) => (
                        <li
                          key={i}
                          className={`${
                            isDark ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          {Array.isArray(path) ? path.join(' → ') : path}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AnalysisPanel;