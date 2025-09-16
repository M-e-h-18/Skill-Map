# Save this as check_gemini_models.py in your backend directory
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv() # This should now return True
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    print("GEMINI_API_KEY found. Configuring API...")
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        print("Listing available models for generateContent:")
        found_models = False
        for m in genai.list_models():
            if "generateContent" in m.supported_generation_methods:
                print(f"- {m.name}")
                found_models = True
        if not found_models:
            print("No models supporting 'generateContent' found.")
    except Exception as e:
        print(f"Error configuring or listing models: {e}")
else:
    print("GEMINI_API_KEY not found after loading dotenv. Please check your .env file.")