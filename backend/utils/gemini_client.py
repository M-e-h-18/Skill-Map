import google.generativeai as genai
from config import GEMINI_API_KEY

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def gemini_analyze(prompt, model="gemini-2.5-flash", max_output_tokens=800):
    resp = genai.generate_text(
        model=model,
        prompt=prompt,
        max_output_tokens=max_output_tokens
    )
    return resp.generations[0].text if resp.generations else ""
