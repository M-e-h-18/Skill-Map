import axios from "axios";

const BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:5000";

// Create an Axios instance
export const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 10000, // 10 second timeout
});
export const mapSkill = (payload) => api.post("/api/skills/map", payload); 
// --- Interceptor for JWT Token ---
// This interceptor will attach the JWT token to every outgoing request
// if a token exists in localStorage.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors globally
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      // You might want to redirect to login page here
      console.warn("Token expired or invalid, removed from storage");
    }
    
    // Handle network errors
    if (!error.response) {
      error.message = "Network error - please check your connection and ensure the backend is running";
    }
    
    return Promise.reject(error);
  }
);

// --- Auth Endpoints ---
export const signup = (payload) => api.post("/api/auth/signup", payload);

export const login = async (payload) => {
  const response = await api.post("/api/auth/login", payload);
  // On successful login, save the access token to localStorage
  if (response.data && response.data.access_token) {
    localStorage.setItem("access_token", response.data.access_token);
  }
  return response;
};

// Logout function (clears the token from localStorage)
export const logout = () => {
  localStorage.removeItem("access_token");
  // Optionally, you might want to redirect the user or clear user state in your app
};

export const getCurrentUser = () => api.get("/api/auth/me"); // Fetches details of the currently logged-in user

// --- Skills Endpoints ---
export const listSkills = () => api.get("/api/skills"); // Backend uses /api/skills for GET
export const addSkill = (payload) => api.post("/api/skills/add", payload); // Payload should be { skill: "Skill Name" }
export const removeSkill = (payload) => api.post("/api/skills/remove", payload); // Payload should be { skill: "Skill Name" }
export const getSkillSuggestions = (query) => api.get(`/api/skills/suggestions?query=${encodeURIComponent(query)}`); // For autocomplete
export const getAllSkills = () => api.get("/api/skills/all"); // Get all available skills

// --- Resume Endpoints ---
export const uploadResume = (formData) =>
  api.post("/api/resume/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }, // Essential for file uploads
    timeout: 30000, // 30 second timeout for file uploads
  });

// --- Analysis Endpoints ---
export const evaluateSkills = (payload) => api.post("/api/analysis/evaluate", payload); // Payload should be { skills: ["skill1", "skill2"] }
export const getAnalysisHistory = () => api.get("/api/history"); // Fetches the user's analysis history

// --- Utility Endpoints ---
export const ping = () => api.get("/api/ping"); // Simple endpoint to check if the backend is alive

// Export default for backward compatibility
export default {
  signup,
  login,
  logout,
  getCurrentUser,
  listSkills,
  addSkill,
  removeSkill,
  getSkillSuggestions,
  getAllSkills,
  uploadResume,
  evaluateSkills,
  getAnalysisHistory,
  ping,
};