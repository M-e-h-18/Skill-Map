import os
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
MONGO_DBNAME = os.getenv("MONGO_DBNAME", "skill_graph_db")
JWT_SECRET = os.getenv("JWT_SECRET", "change_me")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
