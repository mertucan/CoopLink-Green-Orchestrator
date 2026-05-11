import os

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise SystemExit("GEMINI_API_KEY bulunamadı.")

genai.configure(api_key=api_key)

print("generateContent destekleyen modeller:")
for item in genai.list_models():
    methods = getattr(item, "supported_generation_methods", []) or []
    if "generateContent" in methods:
        print(f"- {item.name}")
