import React, { useState } from 'react';

// Authentication Component
const AuthModal = ({ show, onClose, onAuth, isDark, loading }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'user' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onAuth({ ...form, isSignup });
    setForm({ email: '', password: '', name: '', role: 'user' });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`p-8 rounded-xl border-2 w-full max-w-md mx-4 ${isDark ? 'border-cyan-400/30 bg-slate-800' : 'border-slate-300 bg-white'}`}>
        <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-cyan-300' : 'text-slate-700'}`}>
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className={`w-full px-4 py-3 rounded-lg border ${
                  isDark
                    ? 'border-cyan-400/30 bg-slate-900/50 text-cyan-300 placeholder-cyan-500/50'
                    : 'border-slate-300 bg-white text-slate-700 placeholder-slate-400'
                } outline-none focus:border-cyan-400`}
                required
              />
              <select
                value={form.role}
                onChange={(e) => setForm({...form, role: e.target.value})}
                className={`w-full px-4 py-3 rounded-lg border ${
                  isDark
                    ? 'border-cyan-400/30 bg-slate-900/50 text-cyan-300'
                    : 'border-slate-300 bg-white text-slate-700'
                } outline-none focus:border-cyan-400`}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="expert">Expert</option>
              </select>
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})}
            className={`w-full px-4 py-3 rounded-lg border ${
              isDark
                ? 'border-cyan-400/30 bg-slate-900/50 text-cyan-300 placeholder-cyan-500/50'
                : 'border-slate-300 bg-white text-slate-700 placeholder-slate-400'
            } outline-none focus:border-cyan-400`}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({...form, password: e.target.value})}
            className={`w-full px-4 py-3 rounded-lg border ${
              isDark
                ? 'border-cyan-400/30 bg-slate-900/50 text-cyan-300 placeholder-cyan-500/50'
                : 'border-slate-300 bg-white text-slate-700 placeholder-slate-400'
            } outline-none focus:border-cyan-400`}
            required
          />

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 rounded-lg border-2 ${
                isDark
                  ? 'border-cyan-400/30 hover:border-cyan-400 text-cyan-400'
                  : 'border-slate-300 hover:border-slate-400 text-slate-600'
              } transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : (isSignup ? 'Sign Up' : 'Login')}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`px-6 py-3 rounded-lg border ${
                isDark
                  ? 'border-red-400/30 hover:border-red-400 text-red-400'
                  : 'border-red-300 hover:border-red-400 text-red-600'
              } transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Cancel
            </button>
          </div>
        </form>

        <button
          onClick={() => setIsSignup(!isSignup)}
          disabled={loading}
          className={`mt-4 text-sm w-full text-center ${
            isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-slate-600 hover:text-slate-500'
          } transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSignup ? 'Already have an account? Login' : 'Need an account? Sign up'}
        </button>
      </div>
    </div>
  );
};

export default AuthModal;