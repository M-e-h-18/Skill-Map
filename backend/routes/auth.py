from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
import datetime
from models import users

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")
    name = data.get("name", "")

    if not email or not password:
        return jsonify({"msg": "email and password required"}), 400

    if users.find_one({"email": email}):
        return jsonify({"msg": "user exists"}), 409

    user_doc = {
        "email": email,
        "password": generate_password_hash(password, method="pbkdf2:sha256"),
        "name": name,
        "createdAt": datetime.datetime.utcnow(),
        "profiles": [],
        "history": []
    }
    users.insert_one(user_doc)
    return jsonify({"msg": "user created"}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"msg": "email and password required"}), 400

    user = users.find_one({"email": email})
    if not user or not check_password_hash(user["password"], password):
        return jsonify({"msg": "invalid credentials"}), 401

    access_token = create_access_token(identity=str(user["_id"]))
    return jsonify({
        "access_token": access_token,
        "user": {"email": user["email"], "name": user.get("name", "")}
    })
