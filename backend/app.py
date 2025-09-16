from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import pymongo
from flask_jwt_extended import (
    create_access_token, JWTManager, jwt_required, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
import os, datetime, fitz, json, re
import google.generativeai as genai
from dotenv import load_dotenv
from bson import ObjectId
import re
import json
import fitz  # PyMuPDF
from collections import defaultdict
load_dotenv()

# ------------------------------
# Flask App Setup
# ------------------------------
app = Flask(__name__)
CORS(app, supports_credentials=True)

# JWT Setup
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", "super-secret-jwt-key")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = datetime.timedelta(hours=24)
jwt = JWTManager(app)

# MongoDB Setup
MONGO_URI = os.getenv("MONGODB_URI")
MONGO_DBNAME = os.getenv("MONGO_DBNAME", "skill_graph_db")
client = MongoClient(MONGO_URI)
db = client[MONGO_DBNAME]

# Create unique index on email field
try:
    db.users.create_index("email", unique=True)
except Exception as e:
    print(f"Index creation warning: {e}")

# Gemini API Setup
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel("gemini-1.5-flash")
else:
    print("⚠️ GEMINI_API_KEY not found. Gemini features disabled.")
    gemini_model = None

# Uploads folder
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ------------------------------
# PDF Text Extraction Function (MISSING FROM ORIGINAL)
# ------------------------------
def extract_text_from_pdf(file_path):
    """Extract text from PDF file"""
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""




# ------------------------------
# Enhanced Skills Database
# ------------------------------
COMPREHENSIVE_SKILLS_DB = {
    # Programming Languages
    "JavaScript": {"category": "Programming Languages", "aliases": ["js", "javascript", "ecmascript"], "weight": 1.0},
    "Python": {"category": "Programming Languages", "aliases": ["python3", "py"], "weight": 1.0},
    "Java": {"category": "Programming Languages", "aliases": ["java"], "weight": 1.0},
    "TypeScript": {"category": "Programming Languages", "aliases": ["ts", "typescript"], "weight": 1.0},
    "C++": {"category": "Programming Languages", "aliases": ["cpp", "c++", "cplusplus"], "weight": 1.0},
    "C#": {"category": "Programming Languages", "aliases": ["csharp", "c#"], "weight": 1.0},
    "C": {"category": "Programming Languages", "aliases": ["c"], "weight": 1.0},
    "Go": {"category": "Programming Languages", "aliases": ["golang", "go"], "weight": 1.0},
    "Rust": {"category": "Programming Languages", "aliases": ["rust"], "weight": 1.0},
    "PHP": {"category": "Programming Languages", "aliases": ["php"], "weight": 1.0},
    "Ruby": {"category": "Programming Languages", "aliases": ["ruby"], "weight": 1.0},
    "Swift": {"category": "Programming Languages", "aliases": ["swift"], "weight": 1.0},
    "Kotlin": {"category": "Programming Languages", "aliases": ["kotlin"], "weight": 1.0},
    "Dart": {"category": "Programming Languages", "aliases": ["dart"], "weight": 1.0},
    "Scala": {"category": "Programming Languages", "aliases": ["scala"], "weight": 1.0},
    "R": {"category": "Programming Languages", "aliases": ["r"], "weight": 1.0},
    "MATLAB": {"category": "Programming Languages", "aliases": ["matlab"], "weight": 1.0},
    
    # Web Technologies - Frontend
    "React": {"category": "Frontend Frameworks", "aliases": ["reactjs", "react.js"], "weight": 1.0},
    "Angular": {"category": "Frontend Frameworks", "aliases": ["angularjs", "angular"], "weight": 1.0},
    "Vue.js": {"category": "Frontend Frameworks", "aliases": ["vue", "vuejs"], "weight": 1.0},
    "Next.js": {"category": "Frontend Frameworks", "aliases": ["nextjs", "next"], "weight": 1.0},
    "Nuxt.js": {"category": "Frontend Frameworks", "aliases": ["nuxtjs", "nuxt"], "weight": 1.0},
    "Svelte": {"category": "Frontend Frameworks", "aliases": ["svelte"], "weight": 1.0},
    "HTML": {"category": "Web Technologies", "aliases": ["html5", "html"], "weight": 0.8},
    "CSS": {"category": "Web Technologies", "aliases": ["css3", "css"], "weight": 0.8},
    "Sass": {"category": "Web Technologies", "aliases": ["scss", "sass"], "weight": 0.9},
    "Tailwind CSS": {"category": "Web Technologies", "aliases": ["tailwind", "tailwindcss"], "weight": 0.9},
    "Bootstrap": {"category": "Web Technologies", "aliases": ["bootstrap"], "weight": 0.8},
    "jQuery": {"category": "Web Technologies", "aliases": ["jquery"], "weight": 0.7},
    
    # Backend Technologies
    "Node.js": {"category": "Backend Technologies", "aliases": ["nodejs", "node"], "weight": 1.0},
    "Express.js": {"category": "Backend Technologies", "aliases": ["express", "expressjs"], "weight": 0.9},
    "Django": {"category": "Backend Technologies", "aliases": ["django"], "weight": 1.0},
    "Flask": {"category": "Backend Technologies", "aliases": ["flask"], "weight": 0.9},
    "FastAPI": {"category": "Backend Technologies", "aliases": ["fastapi"], "weight": 0.9},
    "Spring": {"category": "Backend Technologies", "aliases": ["spring boot", "spring"], "weight": 1.0},
    "ASP.NET": {"category": "Backend Technologies", "aliases": ["asp.net", "aspnet"], "weight": 1.0},
    "Laravel": {"category": "Backend Technologies", "aliases": ["laravel"], "weight": 0.9},
    "Ruby on Rails": {"category": "Backend Technologies", "aliases": ["rails", "ror"], "weight": 1.0},
    
    # Databases
    "MySQL": {"category": "Databases", "aliases": ["mysql"], "weight": 1.0},
    "PostgreSQL": {"category": "Databases", "aliases": ["postgres", "postgresql"], "weight": 1.0},
    "MongoDB": {"category": "Databases", "aliases": ["mongo", "mongodb"], "weight": 1.0},
    "Redis": {"category": "Databases", "aliases": ["redis"], "weight": 0.9},
    "SQLite": {"category": "Databases", "aliases": ["sqlite"], "weight": 0.8},
    "Oracle": {"category": "Databases", "aliases": ["oracle db", "oracle"], "weight": 1.0},
    "SQL Server": {"category": "Databases", "aliases": ["sqlserver", "mssql"], "weight": 1.0},
    "Cassandra": {"category": "Databases", "aliases": ["cassandra"], "weight": 0.9},
    "DynamoDB": {"category": "Databases", "aliases": ["dynamodb"], "weight": 0.9},
    "Elasticsearch": {"category": "Databases", "aliases": ["elasticsearch", "elastic"], "weight": 0.9},
    
    # Cloud Platforms
    "AWS": {"category": "Cloud Platforms", "aliases": ["amazon web services", "aws"], "weight": 1.0},
    "Azure": {"category": "Cloud Platforms", "aliases": ["microsoft azure", "azure"], "weight": 1.0},
    "GCP": {"category": "Cloud Platforms", "aliases": ["google cloud", "gcp", "google cloud platform"], "weight": 1.0},
    "Heroku": {"category": "Cloud Platforms", "aliases": ["heroku"], "weight": 0.8},
    "DigitalOcean": {"category": "Cloud Platforms", "aliases": ["digitalocean", "digital ocean"], "weight": 0.8},
    "Vercel": {"category": "Cloud Platforms", "aliases": ["vercel"], "weight": 0.7},
    "Netlify": {"category": "Cloud Platforms", "aliases": ["netlify"], "weight": 0.7},
    
    # DevOps & Tools
    "Docker": {"category": "DevOps Tools", "aliases": ["docker"], "weight": 1.0},
    "Kubernetes": {"category": "DevOps Tools", "aliases": ["k8s", "kubernetes"], "weight": 1.0},
    "Jenkins": {"category": "DevOps Tools", "aliases": ["jenkins"], "weight": 0.9},
    "GitLab CI": {"category": "DevOps Tools", "aliases": ["gitlab ci/cd", "gitlab ci"], "weight": 0.9},
    "GitHub Actions": {"category": "DevOps Tools", "aliases": ["github actions"], "weight": 0.9},
    "Terraform": {"category": "DevOps Tools", "aliases": ["terraform"], "weight": 1.0},
    "Ansible": {"category": "DevOps Tools", "aliases": ["ansible"], "weight": 0.9},
    "Vagrant": {"category": "DevOps Tools", "aliases": ["vagrant"], "weight": 0.8},
    
    # Version Control
    "Git": {"category": "Version Control", "aliases": ["git"], "weight": 0.9},
    "GitHub": {"category": "Version Control", "aliases": ["github"], "weight": 0.8},
    "GitLab": {"category": "Version Control", "aliases": ["gitlab"], "weight": 0.8},
    "Bitbucket": {"category": "Version Control", "aliases": ["bitbucket"], "weight": 0.8},
    "SVN": {"category": "Version Control", "aliases": ["subversion", "svn"], "weight": 0.7},
    
    # Mobile Development
    "React Native": {"category": "Mobile Development", "aliases": ["react native", "react-native"], "weight": 1.0},
    "Flutter": {"category": "Mobile Development", "aliases": ["flutter"], "weight": 1.0},
    "iOS Development": {"category": "Mobile Development", "aliases": ["ios", "ios development"], "weight": 1.0},
    "Android Development": {"category": "Mobile Development", "aliases": ["android", "android development"], "weight": 1.0},
    "Xamarin": {"category": "Mobile Development", "aliases": ["xamarin"], "weight": 0.9},
    "Ionic": {"category": "Mobile Development", "aliases": ["ionic"], "weight": 0.8},
    
    # Data Science & AI/ML
    "Machine Learning": {"category": "Data Science & AI", "aliases": ["ml", "machine learning"], "weight": 1.0},
    "Deep Learning": {"category": "Data Science & AI", "aliases": ["deep learning", "dl"], "weight": 1.0},
    "TensorFlow": {"category": "Data Science & AI", "aliases": ["tensorflow", "tf"], "weight": 1.0},
    "PyTorch": {"category": "Data Science & AI", "aliases": ["pytorch", "torch"], "weight": 1.0},
    "Scikit-learn": {"category": "Data Science & AI", "aliases": ["sklearn", "scikit-learn"], "weight": 0.9},
    "Pandas": {"category": "Data Science & AI", "aliases": ["pandas"], "weight": 0.9},
    "NumPy": {"category": "Data Science & AI", "aliases": ["numpy"], "weight": 0.9},
    "Matplotlib": {"category": "Data Science & AI", "aliases": ["matplotlib"], "weight": 0.8},
    "Seaborn": {"category": "Data Science & AI", "aliases": ["seaborn"], "weight": 0.8},
    "Jupyter": {"category": "Data Science & AI", "aliases": ["jupyter notebook", "jupyter"], "weight": 0.8},
    "OpenCV": {"category": "Data Science & AI", "aliases": ["opencv", "cv2"], "weight": 0.9},
    "NLP": {"category": "Data Science & AI", "aliases": ["natural language processing", "nlp"], "weight": 0.9},
    "Computer Vision": {"category": "Data Science & AI", "aliases": ["computer vision", "cv"], "weight": 0.9},
    
    # Testing
    "Jest": {"category": "Testing", "aliases": ["jest"], "weight": 0.8},
    "Mocha": {"category": "Testing", "aliases": ["mocha"], "weight": 0.8},
    "Cypress": {"category": "Testing", "aliases": ["cypress"], "weight": 0.8},
    "Selenium": {"category": "Testing", "aliases": ["selenium"], "weight": 0.9},
    "Pytest": {"category": "Testing", "aliases": ["pytest"], "weight": 0.8},
    "Unit Testing": {"category": "Testing", "aliases": ["unit testing", "unit test"], "weight": 0.7},
    
    # Operating Systems
    "Linux": {"category": "Operating Systems", "aliases": ["linux", "ubuntu", "centos"], "weight": 0.9},
    "Windows": {"category": "Operating Systems", "aliases": ["windows"], "weight": 0.7},
    "macOS": {"category": "Operating Systems", "aliases": ["macos", "mac os"], "weight": 0.7},
    
    # Other Important Skills
    "GraphQL": {"category": "APIs", "aliases": ["graphql"], "weight": 0.9},
    "REST API": {"category": "APIs", "aliases": ["rest", "restful", "rest api"], "weight": 0.9},
    "Microservices": {"category": "Architecture", "aliases": ["microservices"], "weight": 1.0},
    "API Design": {"category": "APIs", "aliases": ["api design"], "weight": 0.8},
    "Agile": {"category": "Methodologies", "aliases": ["agile", "scrum"], "weight": 0.7},
    "CI/CD": {"category": "DevOps Tools", "aliases": ["ci/cd", "continuous integration"], "weight": 0.9},
}
# Create mock skills list and data from the comprehensive database
mock_skills_list = list(COMPREHENSIVE_SKILLS_DB.keys())
mock_skills_data = {}

for skill, info in COMPREHENSIVE_SKILLS_DB.items():
    mock_skills_data[skill] = {
        "category": info["category"],
        "weight": info["weight"],
        "aliases": info.get("aliases", [])
    }
# ------------------------------
# Helper Functions
# ------------------------------
def enhanced_skill_extraction_from_text(text):
    """Extract skills from resume text with high precision"""
    if not text or len(text.strip()) < 10:
        return []
    
    # Clean and normalize text
    text = re.sub(r'\s+', ' ', text)
    text_lower = text.lower()
    
    found_skills = {}
    
    for skill_name, skill_info in COMPREHENSIVE_SKILLS_DB.items():
        max_confidence = 0
        
        # Check main skill name and all aliases
        all_names = [skill_name] + skill_info.get("aliases", [])
        
        for name in all_names:
            name_lower = name.lower()
            
            # Skip very short names that could be false positives
            if len(name_lower) <= 1:
                continue
                
            # Find all occurrences
            positions = []
            start = 0
            while True:
                pos = text_lower.find(name_lower, start)
                if pos == -1:
                    break
                positions.append(pos)
                start = pos + 1
            
            for pos in positions:
                # Check if it's a complete word
                before_ok = (pos == 0 or not text_lower[pos-1].isalnum())
                after_ok = (pos + len(name_lower) >= len(text_lower) or 
                           not text_lower[pos + len(name_lower)].isalnum())
                
                if before_ok and after_ok:
                    confidence = calculate_skill_confidence(text_lower, pos, name_lower, skill_info)
                    max_confidence = max(max_confidence, confidence)
        
        if max_confidence > 0.3:
            found_skills[skill_name] = max_confidence * skill_info.get("weight", 1.0)
    
    # Sort by confidence and return top skills
    sorted_skills = sorted(found_skills.items(), key=lambda x: x[1], reverse=True)
    
    result_skills = []
    for skill_name, confidence in sorted_skills:
        if confidence > 0.4 and len(result_skills) < 25:
            result_skills.append(skill_name)
    
    return result_skills

def calculate_skill_confidence(text, position, skill_name, skill_info):
    """Calculate confidence score for a skill based on surrounding context"""
    confidence = 0.5  # Base confidence
    
    # Define context window
    context_start = max(0, position - 100)
    context_end = min(len(text), position + len(skill_name) + 100)
    context = text[context_start:context_end]
    
    # Positive indicators
    positive_indicators = [
        "experience", "worked", "using", "with", "in", "knowledge", "familiar", 
        "proficient", "expert", "skilled", "developed", "built", "created", 
        "implemented", "programming", "coding", "development", "project",
        "years", "months", "framework", "library", "language", "database",
        "tool", "platform", "technology", "stack", "api", "application"
    ]
    
    # Negative indicators
    negative_indicators = [
        "learning", "want to learn", "interested in", "planning to", 
        "considering", "might", "could", "should", "wish", "hope"
    ]
    
    # Check positive context
    positive_count = sum(1 for indicator in positive_indicators if indicator in context)
    confidence += min(0.3, positive_count * 0.1)
    
    # Check negative context
    negative_count = sum(1 for indicator in negative_indicators if indicator in context)
    confidence -= min(0.4, negative_count * 0.2)
    
    # Bonus for technical sections
    technical_sections = [
        "technical skills", "programming", "technologies", "experience", 
        "projects", "work experience", "skills", "expertise", "tools"
    ]
    if any(section in context for section in technical_sections):
        confidence += 0.2
    
    return min(1.0, max(0.0, confidence))

def create_improved_gemini_prompt(resume_text):
    """Create a focused prompt for Gemini skill extraction"""
    example_skills = list(COMPREHENSIVE_SKILLS_DB.keys())[:30]
    
    return f"""
CRITICAL: Extract ONLY technical skills that are explicitly mentioned in this resume. Do NOT invent skills.

Return ONLY valid JSON in this format:
{{
    "extractedSkills": ["skill1", "skill2", "skill3"]
}}

RULES:
1. ONLY include skills clearly mentioned in the resume
2. Use standard names (e.g., "JavaScript" not "JS")
3. Maximum 15 skills to avoid noise
4. Focus on technical skills: programming languages, frameworks, tools, databases
5. Examples: {', '.join(example_skills[:15])}

Resume Text:
{resume_text[:2500]}

Return only JSON, no explanation.
"""

def suggest_complementary_skills(extracted_skills, max_suggestions=6):
    """Suggest skills that complement the extracted skills"""
    if not extracted_skills:
        return ["Git", "Linux", "Docker", "REST API", "SQL", "Testing"]
    
    suggestions = set()
    
    # Skill pairings
    skill_pairings = {
        "JavaScript": ["TypeScript", "Node.js", "React", "HTML", "CSS"],
        "Python": ["Django", "Flask", "Pandas", "NumPy", "SQL"],
        "React": ["JavaScript", "TypeScript", "Redux", "Next.js"],
        "Java": ["Spring", "Maven", "Hibernate", "JUnit"],
        "Node.js": ["Express.js", "MongoDB", "JavaScript", "npm"],
        "HTML": ["CSS", "JavaScript", "Bootstrap"],
        "CSS": ["HTML", "JavaScript", "Sass", "Bootstrap"],
        "AWS": ["Docker", "Kubernetes", "Linux", "Terraform"],
        "Docker": ["Kubernetes", "Linux", "CI/CD"],
        "SQL": ["MySQL", "PostgreSQL", "Database Design"],
        "Git": ["GitHub", "GitLab", "CI/CD"],
    }
    
    # Add complementary skills
    for skill in extracted_skills:
        if skill in skill_pairings:
            for complement in skill_pairings[skill]:
                if complement not in extracted_skills:
                    suggestions.add(complement)
    
    # Add universal skills
    universal_skills = ["Git", "Linux", "Docker", "Testing", "CI/CD", "REST API"]
    for skill in universal_skills:
        if skill not in extracted_skills:
            suggestions.add(skill)
    
    return list(suggestions)[:max_suggestions]

def repair_json_string(text):
    """Attempt to repair malformed JSON"""
    try:
        # Remove markdown code blocks
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        # Remove trailing commas
        text = re.sub(r',(\s*[}\]])', r'\1', text)
        
        # If truncated, try to close properly
        if text.strip().endswith(','):
            text = text.strip()[:-1]
        
        # Balance brackets
        open_braces = text.count('{') - text.count('}')
        open_brackets = text.count('[') - text.count(']')
        
        text += '}' * max(0, open_braces)
        text += ']' * max(0, open_brackets)
        
        return text
    except:
        return text

def extract_skills_from_partial_json(partial_text):
    """Extract skills from malformed JSON using regex"""
    try:
        skill_pattern = r'"([A-Za-z][A-Za-z0-9\s\.\+\-/]+)"'
        matches = re.findall(skill_pattern, partial_text)
        
        exclude_terms = {'extractedSkills', 'suggestedSkills', 'title', 'description', 'readiness', 'missingSkills', 'pathways'}
        
        skills = []
        for match in matches:
            if (len(match) > 2 and 
                match not in exclude_terms and 
                not match.isdigit() and
                len(match.split()) <= 3):
                skills.append(match.strip())
        
        return list(set(skills))
    except:
        return []

def gemini_analyze_text(prompt, max_output_tokens=3000):
    """Enhanced Gemini API call with better error handling"""
    if not gemini_model:
        print("Gemini model not available")
        return None
    
    try:
        response = gemini_model.generate_content(
            prompt,
            generation_config={
                "max_output_tokens": max_output_tokens,
                "temperature": 0.1,
                "top_p": 0.8,
                "top_k": 40
            }
        )
        
        if response and response.candidates:
            candidate = response.candidates[0]
            if candidate.content and candidate.content.parts:
                raw_text = candidate.content.parts[0].text.strip()
                print(f"Raw Gemini response: {raw_text[:200]}...")
                
                try:
                    repaired_text = repair_json_string(raw_text)
                    parsed = json.loads(repaired_text)
                    print("Successfully parsed JSON from Gemini")
                    return parsed
                except json.JSONDecodeError as e:
                    print(f"JSON parsing failed: {e}")
                    extracted_skills = extract_skills_from_partial_json(raw_text)
                    if extracted_skills:
                        return {
                            "extractedSkills": extracted_skills[:8],
                            "suggestedSkills": ["Docker", "Kubernetes", "AWS", "Git", "CI/CD"]
                        }
                    return None
            else:
                print("No content in Gemini response")
        else:
            print("No candidates in Gemini response")
            
    except Exception as e:
        print(f"Gemini API error: {e}")
    
    return None

# ------------------------------
# Routes
# ------------------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({"ok": True, "msg": "Welcome to Skill Graph API"})

@app.route("/api/ping", methods=["GET"])
def ping():
    return jsonify({"ok": True, "msg": "Backend alive"})

# Auth Routes
@app.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.json or {}
    email, password = data.get("email"), data.get("password")
    if not email or not password:
        return jsonify({"ok": False, "msg": "Email and password required"}), 400
    if db.users.find_one({"email": email}):
        return jsonify({"ok": False, "msg": "User already exists"}), 409

    hashed_pw = generate_password_hash(password, method="pbkdf2:sha256")
    user_doc = {
        "email": email,
        "password": hashed_pw,
        "name": data.get("name", ""),
        "role": data.get("role", "user"),
        "createdAt": datetime.datetime.utcnow(),
        "skills": [],
        "analysis_history": []
    }
    db.users.insert_one(user_doc)
    return jsonify({"ok": True, "msg": "User created successfully"}), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    email, password = data.get("email"), data.get("password")
    user = db.users.find_one({"email": email})
    if not user or not check_password_hash(user["password"], password):
        return jsonify({"ok": False, "msg": "Invalid credentials"}), 401
    token = create_access_token(identity=str(user["_id"]))
    return jsonify({
        "ok": True,
        "access_token": token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name", ""),
            "role": user.get("role", "user")
        }
    })

@app.route("/api/auth/me", methods=["GET"])
@jwt_required()
def me():
    uid = get_jwt_identity()
    user = db.users.find_one({"_id": ObjectId(uid)}, {"password": 0})
    if not user:
        return jsonify({"ok": False, "msg": "User not found"}), 404
    user["_id"] = str(user["_id"])
    user["role"] = user.get("role", "user")
    return jsonify({"ok": True, "user": user})

# Skills Routes
@app.route("/api/skills/all", methods=["GET"])
def get_all_skills():
    return jsonify({"ok": True, "skills": mock_skills_list, "skills_data": mock_skills_data})

@app.route("/api/skills", methods=["GET"])
@jwt_required()
def get_user_skills():
    uid = get_jwt_identity()
    user = db.users.find_one({"_id": ObjectId(uid)})
    if not user:
        return jsonify({"ok": False, "msg": "User not found"}), 404
    return jsonify({"ok": True, "skills": user.get("skills", [])})

@app.route("/api/skills/add", methods=["POST"])
@jwt_required()
def add_skill():
    uid = get_jwt_identity()
    skill = request.json.get("skill")
    if not skill:
        return jsonify({"ok": False, "msg": "Skill required"}), 400
    db.users.update_one({"_id": ObjectId(uid)}, {"$addToSet": {"skills": skill}})
    return jsonify({"ok": True, "msg": f"Skill '{skill}' added"})

@app.route("/api/skills/remove", methods=["POST"])
@jwt_required()
def remove_skill():
    uid = get_jwt_identity()
    skill = request.json.get("skill")
    if not skill:
        return jsonify({"ok": False, "msg": "Skill required"}), 400
    db.users.update_one({"_id": ObjectId(uid)}, {"$pull": {"skills": skill}})
    return jsonify({"ok": True, "msg": f"Skill '{skill}' removed"})

@app.route("/api/skills/suggestions", methods=["GET"])
def skill_suggestions():
    query = request.args.get("query", "").strip().lower()
    if not query:
        return jsonify({"ok": True, "suggestions": []})

    suggestions = [
        {"name": skill, "category": mock_skills_data[skill].get("category", "General")}
        for skill in mock_skills_data
        if skill.lower().startswith(query) or query in skill.lower()
    ]

    return jsonify({"ok": True, "suggestions": suggestions[:10]})

# Resume Upload

@app.route("/api/resume/upload", methods=["POST"])
@jwt_required(optional=True)
def upload_resume():
    """Resume upload with enhanced skill extraction"""
    file = request.files.get("file")
    if not file or file.filename == "":
        return jsonify({"ok": False, "msg": "No file uploaded"}), 400

    file_extension = file.filename.split('.')[-1].lower()
    if file_extension != 'pdf':
        return jsonify({"ok": False, "msg": "Only PDF files are supported"}), 400

    filename = datetime.datetime.utcnow().strftime("%Y%m%d%H%M%S_") + file.filename
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    try:
        file.save(filepath)
        raw_text = extract_text_from_pdf(filepath)

        if not isinstance(raw_text, str) or not raw_text.strip():
            return jsonify({
                "ok": False,
                "msg": "Could not extract text from PDF. The file may be image-based or corrupted.",
                "extracted_skills": [],
                "suggested_skills": []
            }), 400

        print(f"Extracted {len(raw_text)} characters from PDF")
        print(f"Sample text: {raw_text[:200]}...")

        # Primary extraction: Enhanced keyword matching
        extracted_skills = enhanced_skill_extraction_from_text(raw_text)
        print(f"Enhanced extraction found: {extracted_skills}")

        # Secondary extraction: Gemini (as backup/validation)
        gemini_skills = []
        if gemini_model and len(raw_text) > 50:
            try:
                improved_prompt = create_improved_gemini_prompt(raw_text)
                gemini_result = gemini_analyze_text(improved_prompt, max_output_tokens=800)
                if gemini_result and isinstance(gemini_result, dict):
                    gemini_skills = gemini_result.get("extractedSkills", [])
                    print(f"Gemini extraction found: {gemini_skills}")
                    # Combine and validate results
                    for skill in gemini_skills:
                        if skill in COMPREHENSIVE_SKILLS_DB and skill not in extracted_skills:
                            if skill.lower() in raw_text.lower():
                                extracted_skills.append(skill)
                else:
                    print("Gemini analysis failed or returned invalid format")
            except Exception as e:
                print(f"Gemini analysis error: {e}")

        # Remove duplicates while preserving order
        extracted_skills = list(dict.fromkeys(extracted_skills))
        extracted_skills = extracted_skills[:20]

        # Generate smart suggestions
        suggested_skills = suggest_complementary_skills(extracted_skills)

        # If no skills found, provide basic suggestions
        if not extracted_skills:
            extracted_skills = []
            suggested_skills = ["Git", "Linux", "Problem Solving", "Communication", "Teamwork"]
            print("No technical skills found in resume")

        print(f"Final extracted skills: {extracted_skills}")
        print(f"Suggested skills: {suggested_skills}")

        # Categorize skills for better display
        skills_by_category = {}
        for skill in extracted_skills:
            if skill in COMPREHENSIVE_SKILLS_DB:
                category = COMPREHENSIVE_SKILLS_DB[skill]["category"]
                if category not in skills_by_category:
                    skills_by_category[category] = []
                skills_by_category[category].append(skill)

        # Save to user profile if authenticated
        uid = get_jwt_identity()
        if uid and extracted_skills:
            try:
                db.users.update_one(
                    {"_id": ObjectId(uid)},
                    {
                        "$addToSet": {"skills": {"$each": extracted_skills}},
                        "$set": {
                            "last_resume_analysis": {
                                "timestamp": datetime.datetime.utcnow(),
                                "extracted_skills": extracted_skills,
                                "suggested_skills": suggested_skills,
                                "skills_by_category": skills_by_category
                            }
                        }
                    }
                )
                print(f"Saved {len(extracted_skills)} skills to user profile")
            except Exception as e:
                print(f"Database update error: {e}")

        return jsonify({
            "ok": True,
            "extracted_skills": extracted_skills,
            "suggested_skills": suggested_skills,
            "skills_by_category": skills_by_category,
            "extraction_method": "enhanced_keyword_matching" + (" + gemini" if gemini_skills else ""),
            "text_preview": raw_text[:400] + ("..." if len(raw_text) > 400 else ""),
            "total_text_length": len(raw_text)
        })

    except Exception as e:
        print(f"Resume upload error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({
            "ok": False,
            "msg": f"Resume processing failed: {str(e)}"
        }), 500
    finally:
        # Clean up uploaded file
        if os.path.exists(filepath):
            os.remove(filepath)

# Analysis Endpoint
@app.route("/api/analysis/evaluate", methods=["POST"])
@jwt_required(optional=True)
def evaluate():
    try:
        data = request.json or {}
        user_skills = data.get("skills", [])
        if not isinstance(user_skills, list):
            user_skills = []

        print(f"Analyzing {len(user_skills)} skills for role matching")

        # Use your expanded role_skills_map here!
        role_skills_map = {
    # Web & Frontend
    "Web Developer": ["HTML", "CSS", "JavaScript", "React", "Angular", "Vue.js", "Node.js", "Git", "Webpack", "Babel", "REST API", "GraphQL"],
    "Frontend Developer": ["HTML", "CSS", "JavaScript", "React", "Vue.js", "SASS", "TypeScript", "Redux", "Tailwind CSS", "Responsive Design"],
    "Backend Developer": ["Python", "Node.js", "Java", "C#", "SQL", "MongoDB", "REST API", "GraphQL", "Docker", "Microservices", "Spring", "Express.js"],
    "Full Stack Developer": ["HTML", "CSS", "JavaScript", "React", "Node.js", "Python", "SQL", "NoSQL", "Docker", "Git", "REST API", "GraphQL", "Redux", "TypeScript"],

    # Mobile
    "Mobile Developer": ["Java", "Kotlin", "Swift", "React Native", "Flutter", "Android Development", "iOS Development", "Xamarin", "UI/UX Design"],

    # Data & AI/ML
    "Data Scientist": ["Python", "R", "SQL", "Machine Learning", "Statistics", "Pandas", "NumPy", "Matplotlib", "Seaborn", "TensorFlow", "PyTorch", "Scikit-learn", "Data Visualization", "Deep Learning", "NLP", "Data Cleaning"],
    "AI/ML Engineer": ["Python", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn", "Keras", "NLP", "Computer Vision", "Reinforcement Learning", "Data Analysis", "Model Deployment"],
    "Data Engineer": ["Python", "SQL", "ETL", "Apache Spark", "Hadoop", "Airflow", "Kafka", "AWS", "GCP", "BigQuery", "Data Warehousing", "Data Modeling"],
    "BI Analyst": ["SQL", "Power BI", "Tableau", "Data Visualization", "Excel", "Analytics", "DAX", "Data Storytelling"],

    # DevOps & Cloud
    "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "Azure", "GCP", "Linux", "CI/CD", "Terraform", "Ansible", "Jenkins", "Monitoring", "Prometheus", "CloudFormation"],
    "Cloud Engineer": ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Linux", "Cloud Security", "Networking", "Serverless Architecture"],
    "System Administrator": ["Linux", "Windows", "macOS", "Ansible", "Terraform", "Docker", "Networking", "Server Maintenance", "Active Directory"],

    # Database
    "Database Administrator": ["SQL", "MySQL", "PostgreSQL", "MongoDB", "Oracle", "Redis", "Database Design", "Indexing", "Backup & Recovery", "Query Optimization"],

    # QA & Testing
    "QA Engineer": ["Selenium", "Pytest", "Jest", "Mocha", "Unit Testing", "Integration Testing", "Cypress", "Test Automation", "Performance Testing", "Load Testing"],

    # Security
    "Security Engineer": ["Linux", "Python", "AWS", "Docker", "Kubernetes", "CI/CD", "Penetration Testing", "Vulnerability Assessment", "Network Security", "Cryptography", "Compliance"],

    # Product & Management
    "Product Manager": ["Agile", "Scrum", "Kanban", "API Design", "Roadmapping", "Communication", "Teamwork", "Prioritization", "Stakeholder Management", "Market Analysis"],
    "Project Manager": ["Agile", "Scrum", "Kanban", "Budgeting", "Risk Management", "Scheduling", "Team Coordination", "Communication"],

    # Emerging Roles
    "Blockchain Developer": ["Solidity", "Ethereum", "Smart Contracts", "Web3.js", "Truffle", "Hardhat", "NFTs", "Blockchain Architecture"],
    "IoT Engineer": ["C", "C++", "Python", "Embedded Systems", "Microcontrollers", "Raspberry Pi", "Arduino", "MQTT", "Sensors", "IoT Protocols"],
    "Game Developer": ["C++", "C#", "Unity", "Unreal Engine", "3D Modeling", "Animation", "Shader Programming", "Game Physics"],
    "AR/VR Developer": ["Unity", "Unreal Engine", "C#", "3D Modeling", "XR Interaction", "OpenXR", "ARKit", "ARCore"],

    # Misc
    "UX/UI Designer": ["Figma", "Sketch", "Adobe XD", "Wireframing", "Prototyping", "User Research", "Interaction Design", "Responsive Design", "Accessibility"],
    "Technical Writer": ["Documentation", "Markdown", "API Docs", "Confluence", "Git", "Communication", "Editing", "Research"],

    # Security + Cloud Advanced
    "Cloud Security Engineer": ["AWS Security", "Azure Security", "GCP Security", "IAM", "Encryption", "SIEM", "Vulnerability Assessment", "Compliance"],

    # Big Data
    "Big Data Engineer": ["Hadoop", "Spark", "Kafka", "Airflow", "Hive", "SQL", "NoSQL", "Data Lakes", "ETL", "Python", "Scala"],

    # AI Specializations
    "Computer Vision Engineer": ["Python", "OpenCV", "TensorFlow", "PyTorch", "Deep Learning", "Image Processing", "Object Detection", "YOLO", "GANs"],
    "NLP Engineer": ["Python", "NLP", "Spacy", "NLTK", "Transformers", "BERT", "GPT", "Text Classification", "Sentiment Analysis"],

    # Other dev roles
    "Embedded Systems Engineer": ["C", "C++", "Microcontrollers", "RTOS", "Circuit Design", "PCB Design", "IoT", "Firmware"],
    "Robotics Engineer": ["Python", "ROS", "C++", "Sensors", "Actuators", "Control Systems", "Kinematics", "Simulation"],

    # Add more niche roles as needed!
}


        analysis_result = []

        # Lowercase user skills for matching
        user_skills_set = set([s.lower() for s in user_skills])

        for role, required_skills in role_skills_map.items():
            # Lowercase required skills for matching
            required_skills_lower = [s.lower() for s in required_skills]
            overlap = user_skills_set & set(required_skills_lower)
            match_count = len(overlap)
            total_required = len(required_skills)
            readiness_score = int((match_count / total_required) * 100) if total_required else 0

            if match_count > 0:
                missing_skills = [s for s in required_skills if s.lower() not in user_skills_set]
                suggested_skills = missing_skills[:5]
                analysis_result.append({
                    "title": role,
                    "readiness": readiness_score,
                    "description": f"Matched {match_count} skills for {role}.",
                    "missingSkills": missing_skills,
                    "suggestedSkills": suggested_skills,
                    "pathways": [required_skills]
                })

        # Sort roles by readiness descending
        analysis_result.sort(key=lambda x: x["readiness"], reverse=True)

        return jsonify({"ok": True, "analysis": analysis_result})

    except Exception as e:
        print(f"Analysis error: {e}")
        return jsonify({
            "ok": False,
            "msg": "Analysis failed",
            "analysis": []
        }), 500

@app.route("/api/history", methods=["GET"])
@jwt_required()
def history():
    uid = get_jwt_identity()
    user = db.users.find_one({"_id": ObjectId(uid)}, {"analysis_history": 1})
    if not user:
        return jsonify({"ok": False, "msg": "User not found"}), 404
    return jsonify({"ok": True, "history": user.get("analysis_history", [])})

# Error Handling
@app.errorhandler(404)
def not_found(_):
    return jsonify({"ok": False, "msg": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(_):
    return jsonify({"ok": False, "msg": "Internal server error"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000, use_reloader=False)