import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BarChart3 } from "lucide-react";

const RoleReadinessChart = ({ analysis = [], isDark }) => {
  // Prepare chart data with color based on readiness
  const readinessData = analysis.map((item) => ({
    name: item.role || item.title, // fallback in case backend sends "title"
    readiness: item.readiness,
    fill:
      item.readiness >= 80
        ? isDark
          ? "#00ff41" // neon green
          : "#16a34a" // tailwind green-600
        : item.readiness >= 50
        ? isDark
          ? "#ffaa00" // amber/yellow
          : "#f59e0b" // tailwind amber-500
        : isDark
        ? "#ff4444" // bright red
        : "#dc2626", // tailwind red-600
  }));

  return (
    <div
      className={`p-6 rounded-xl border-2 backdrop-blur-sm ${
        isDark
          ? "border-cyan-400/30 bg-slate-800/70"
          : "border-slate-300 bg-white/90"
      } shadow-2xl`}
    >
      <h3
        className={`text-lg font-bold mb-4 flex items-center gap-2 ${
          isDark ? "text-cyan-300" : "text-slate-700"
        }`}
      >
        <BarChart3 className="w-5 h-5" />
        Role Readiness
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={readinessData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? "#334155" : "#e2e8f0"}
          />
          <XAxis
            dataKey="name"
            stroke={isDark ? "#64748b" : "#475569"}
            fontSize={10}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke={isDark ? "#64748b" : "#475569"} />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#1e293b" : "#f8fafc",
              border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
              borderRadius: "8px",
              color: isDark ? "#e2e8f0" : "#1e293b",
            }}
          />
          <Bar dataKey="readiness" radius={[4, 4, 0, 0]}>
            {readinessData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RoleReadinessChart;
