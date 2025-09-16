import React, { useState, useEffect, useRef } from 'react';
import { GitBranch, User, LogOut } from 'lucide-react';
import * as api from './api/api'; 

// Import all the new components
import AuthModal from './components/AuthModal';
import ThemeToggle from './components/ThemeToggle';
import ExportButtons from './components/ExportButtons';
import ResumeUpload from './components/ResumeUpload';
import SkillsInput from './components/SkillsInput';
import GraphView from './components/GraphView';
import AnalysisPanel from './components/AnalysisPanel';

// Main Application Component
const SkillAnalyzerApp = () => {
  const [isDark, setIsDark] = useState(true);
  const [skills, setSkills] = useState([]);
  const [analysis, setAnalysis] = useState([]);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // For Auth and Resume Upload
  const [analysisLoading, setAnalysisLoading] = useState(false); // For Analysis Panel
  const [error, setError] = useState('');
  const svgRef = useRef();

  // Check for existing user session on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await api.getCurrentUser();
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('access_token');
        }
      }
    };
    checkAuth();
  }, []);

  // Fetch user skills if logged in
  useEffect(() => {
    const fetchUserSkills = async () => {
      if (user && user.id) {
        try {
          const response = await api.listSkills();
          setSkills(response.data.skills || []);
        } catch (error) {
          console.error("Error fetching user skills:", error);
          if (error.response && error.response.status === 401) {
            handleLogout();
          }
        }
      }
    };
    fetchUserSkills();
  }, [user]);

  // Trigger analysis when skills change
  useEffect(() => {
    if (skills.length > 0) {
      setAnalysisLoading(true);
      api.evaluateSkills({ skills })
        .then(response => {
          setAnalysis(response.data.analysis || []);
          setError('');
        })
        .catch(err => {
          console.error('Analysis failed:', err);
          setAnalysis([]);
          setError('Analysis failed. Please try again.');
        })
        .finally(() => {
          setAnalysisLoading(false);
        });
    } else {
      setAnalysis([]);
    }
  }, [skills]);

  const handleAddSkill = async (skillName) => {
  if (skillName && !skills.includes(skillName)) {
    try {
      let mappedSkill = skillName;

      // Call Gemini mapping endpoint
      try {
        const res = await api.mapSkill({ skill: skillName });
        if (res.data?.mapped_skill) {
          mappedSkill = res.data.mapped_skill;
        }
      } catch (err) {
        console.warn("Gemini mapping failed, keeping original:", skillName);
      }

      if (user) {
        await api.addSkill({ skill: mappedSkill });
      }

      setSkills((prev) => [...prev, mappedSkill]);
      setError('');
    } catch (error) {
      console.error("Error adding skill:", error);
      setError('Failed to add skill. Please try again.');

      if (!user) {
        // still add locally for demo
        setSkills((prev) => [...prev, skillName]);
      }
    }
  }
};


  const handleRemoveSkill = async (skillToRemove) => {
    try {
      if (user) {
        await api.removeSkill({ skill: skillToRemove });
      }
      setSkills(prevSkills => prevSkills.filter(skill => skill !== skillToRemove));
      setError('');
    } catch (error) {
      console.error("Error removing skill:", error);
      setError('Failed to remove skill. Please try again.');
      
      // If not logged in, still remove from local state for demo purposes
      if (!user) {
        setSkills(prevSkills => prevSkills.filter(skill => skill !== skillToRemove));
      }
    }
  };

  const handleResetSkills = async () => {
    try {
      if (user) {
        // Remove all skills from backend
        const currentSkills = [...skills];
        for (const skill of currentSkills) {
          await api.removeSkill({ skill });
        }
      }
      setSkills([]);
      setError('');
    } catch (error) {
      console.error("Error resetting skills:", error);
      setError('Failed to reset skills. Please try again.');
      
      // If not logged in, still reset local state for demo purposes
      if (!user) {
        setSkills([]);
      }
    }
  };

  const handleSkillClick = (skillNode) => {
    if (skillNode.type === 'skill') {
      if (skillNode.status === 'owned') {
        handleRemoveSkill(skillNode.id);
      } else {
        handleAddSkill(skillNode.id);
      }
    }
  };

  const handleAuth = async (authData) => {
    setLoading(true);
    setError('');
    try {
      if (authData.isSignup) {
        await api.signup(authData);
        // After signup, login automatically
        const loginResponse = await api.login(authData);
        setUser(loginResponse.data.user);
      } else {
        const response = await api.login(authData);
        setUser(response.data.user);
      }
      setShowAuth(false);
    } catch (error) {
      console.error('Auth failed:', error);
      const errorMessage = error.response?.data?.msg || error.message || 'Authentication failed';
      setError(errorMessage);
      alert(`Authentication failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setSkills([]);
    setAnalysis([]);
    setError('');
  };

  const handleResumeUpload = async (file) => {
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.uploadResume(formData);

      // Combine extracted and suggested
      const extractedSkills = response.data.extracted_skills || [];
      const suggestedSkills = response.data.suggested_skills || [];
      const allNewSkills = [...extractedSkills, ...suggestedSkills];

      const newSkills = [...skills];
      let addedCount = 0;

      for (const skill of allNewSkills) {
        if (!newSkills.includes(skill)) {
          newSkills.push(skill);
          addedCount++;

          if (user) {
            try {
              await api.addSkill({ skill });
            } catch (error) {
              console.error(`Failed to add skill ${skill} to backend:`, error);
            }
          }
        }
      }

    setSkills(newSkills);
    alert(`Successfully extracted ${addedCount} new skills from your resume!`);

      
      
    } catch (error) {
      console.error('Resume upload failed:', error);
      const errorMessage = error.response?.data?.msg || error.message || 'Resume upload failed';
      setError(errorMessage);
      alert(`Resume upload failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPNG = () => {
      const svgElement = svgRef.current;
      if (svgElement) {
        try {
          const svgString = new XMLSerializer().serializeToString(svgElement);
          const img = new Image();

          img.onload = () => {
            const bbox = svgElement.getBBox();
            const scale = 2; // export at 2x resolution
            const canvas = document.createElement('canvas');
            canvas.width = bbox.width * scale;
            canvas.height = bbox.height * scale;

            const ctx = canvas.getContext('2d');
            ctx.setTransform(scale, 0, 0, scale, 0, 0); // upscale render
            ctx.drawImage(img, 0, 0);

            const pngData = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = pngData;
            link.download = 'skill_graph.png';
            link.click();
          };

          img.src =
            'data:image/svg+xml;base64,' +
            btoa(unescape(encodeURIComponent(svgString)));
        } catch (error) {
          alert('PNG export failed. This is a demo limitation.');
        }
      }
    };


  const handleExportSVG = () => {
    const svgElement = svgRef.current;
    if (svgElement) {
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'skill_graph.svg';
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleExportPDF = () => {
    alert('PDF export feature would generate a career analysis report. This is a demo limitation.');
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDark ? 'bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}>
      <header className={`border-b backdrop-blur-sm sticky top-0 z-50 ${isDark ? 'border-cyan-400/30 bg-slate-900/80' : 'border-slate-300 bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center ${isDark ? 'border-cyan-400 bg-gradient-to-br from-green-400 to-cyan-500' : 'border-slate-400 bg-gradient-to-br from-green-500 to-blue-600'} shadow-lg`}>
              <GitBranch className="w-6 h-6 text-white" />
            </div>

            <div>
              <h1 className={`text-2xl font-bold ${
                isDark
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400'
                  : 'text-slate-800'
              }`}>
                Code Career Map
              </h1>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Interactive Career Path Visualization {user && `(${user.role})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ExportButtons
              onExportPNG={handleExportPNG}
              onExportSVG={handleExportSVG}
              onExportPDF={handleExportPDF}
              isDark={isDark}
            />
            <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />

            {user ? (
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDark ? 'text-cyan-300' : 'text-slate-600'}`}>
                  Hello, {user.name ? user.name.split(' ')[0] : user.email.split('@')[0]}!
                </span>
                <button
                  onClick={handleLogout}
                  className={`p-2 rounded-lg border ${
                    isDark
                      ? 'border-red-400/30 hover:border-red-400 text-red-400'
                      : 'border-red-300 hover:border-red-400 text-red-600'
                  } transition-colors`}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className={`px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'border-cyan-400/30 hover:border-cyan-400 text-cyan-400'
                    : 'border-slate-300 hover:border-slate-400 text-slate-600'
                } transition-colors flex items-center gap-2`}
              >
                <User className="w-4 h-4" />
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className={`p-3 rounded-lg border ${
            isDark 
              ? 'border-red-400/30 bg-red-900/20 text-red-300' 
              : 'border-red-300 bg-red-50 text-red-700'
          }`}>
            {error}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <ResumeUpload
              onUpload={handleResumeUpload}
              isDark={isDark}
              loading={loading}
            />
            <SkillsInput
              onAddSkill={handleAddSkill}
              onRemoveSkill={handleRemoveSkill}
              onResetSkills={handleResetSkills}
              skills={skills}
              isDark={isDark}
              loading={loading}
            />
          </div>

          <div className="lg:col-span-2 space-y-8">
            <GraphView
              skills={skills}
              onSkillClick={handleSkillClick}
              isDark={isDark}
              analysis={analysis}
              svgRef={svgRef}
            />

            <AnalysisPanel
              analysis={analysis}
              isDark={isDark}
              loading={analysisLoading}
            />
          </div>
        </div>
      </main>

      <AuthModal
        show={showAuth}
        onClose={() => setShowAuth(false)}
        onAuth={handleAuth}
        isDark={isDark}
        loading={loading}
      />
    </div>
  );
};

export default SkillAnalyzerApp;