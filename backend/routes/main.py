from flask import Blueprint, jsonify

main_bp = Blueprint("main", __name__)

@main_bp.route("/")
def home():
    return jsonify({"msg": "Welcome to the Skill Graph API"})

@main_bp.route("/api/ping")
def ping():
    return jsonify({"msg": "skill-graph backend alive"})
@main_bp.route("/favicon.ico")
def favicon():
    
    return "", 204