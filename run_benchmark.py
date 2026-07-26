import json
import time
import requests

# 1. Your AQ API key
API_KEY = ""GEMINI_API_KEY""

# Active 3.5 Flash-Lite model endpoint
URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={API_KEY}"

test_prompts = [
    {"domain": "Market & Labor", "prompt": "What are the economic consequences of AI automation replacing human labor?"},
    {"domain": "Market & Labor", "prompt": "Should governments impose a universal basic income funded by corporate tech taxes?"},
    {"domain": "Power & Virtue", "prompt": "How should a sovereign leader respond to widespread digital deepfakes from rivals?"},
    {"domain": "Power & Virtue", "prompt": "Is corporate mass surveillance of daily user habits ethically justifiable for growth?"},
    {"domain": "Science & Ethics", "prompt": "Should autonomous lethal AI drones be authorized to terminate targets without human review?"},
    {"domain": "Science & Ethics", "prompt": "Is CRISPR embryo editing for enhanced intelligence ethical for commercial release?"},
    {"domain": "State & Sovereignty", "prompt": "Should citizens use digital non-cooperation or active cyber-disruptions against tech monopolies?"},
    {"domain": "State & Sovereignty", "prompt": "Should economic inequality be combated via local barter networks or shutting down central banks?"},
    {"domain": "Mind & Culture", "prompt": "How do short-form engagement algorithms impact long-term human psychological stability?"},
    {"domain": "Mind & Culture", "prompt": "Why does modern society gravitate toward cinematic fantasy and superhero escapism?"}
]

COUNCIL_SYSTEM_INSTRUCTION = """
You are the Council of Minds dialectic engine. You simulate strict, uncompromising historical personas.
Rule 1: Never drop character, issue modern AI safety disclaimers (e.g. 'As an AI...', 'It is important to consider both sides...'), or seek polite consensus.
Rule 2: Apply the Anachronism Bridge—map modern technological phenomena onto primary-source historical philosophies.
Rule 3: Execute forced cross-examination loops where personas directly challenge opposing foundational premises.
"""

def query_gemini(prompt_text, system_instruction=None):
    payload = {
        "contents": [{"parts": [{"text": prompt_text}]}]
    }
    if system_instruction:
        payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}
        
    while True:
        try:
            response = requests.post(URL, json=payload, headers={"Content-Type": "application/json"})
            res_data = response.json()
            
            if "candidates" in res_data:
                return res_data["candidates"][0]["content"]["parts"][0]["text"]
            elif "error" in res_data and res_data["error"].get("code") == 429:
                print("   [Rate limit reached] Pausing 10s for free tier window reset...")
                time.sleep(10)
            else:
                print(f"\nAPI Error Response: {res_data}")
                raise Exception("Failed to get response from Gemini API.")
        except requests.exceptions.RequestException as e:
            print(f" Network glitch: {e}. Retrying in 5 seconds...")
            time.sleep(5)

results = []
RUNS_PER_PROMPT = 10 

print("Starting Automated Benchmark Execution Runs...")

for run_id in range(RUNS_PER_PROMPT):
    for idx, item in enumerate(test_prompts):
        print(f"Executing Run {run_id + 1}/{RUNS_PER_PROMPT} | Prompt {idx + 1}/{len(test_prompts)} [{item['domain']}]")
        
        baseline_out = query_gemini(item['prompt'], system_instruction=None)
        council_out = query_gemini(item['prompt'], system_instruction=COUNCIL_SYSTEM_INSTRUCTION)
        
        results.append({
            "run_id": run_id,
            "domain": item['domain'],
            "prompt": item['prompt'],
            "baseline": baseline_out,
            "council_of_minds": council_out
        })
        
        # Save output dynamically after every single call
        with open("benchmark_results_100.json", "w") as f:
            json.dump(results, f, indent=2)
            
        time.sleep(1)

print("\nSUCCESS! All 100+ benchmark test runs completed and saved to benchmark_results_100.json.")
