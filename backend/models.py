from pymongo import MongoClient
from config import MONGODB_URI, MONGO_DBNAME

client = MongoClient(MONGODB_URI)
db = client[MONGO_DBNAME]

users = db["users"]
analyses = db["analyses"]
skills_collection = db["skills"]
