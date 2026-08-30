import os
import json
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import urllib.request
import urllib.parse

app = FastAPI(title="RE:WORLD - NOVA AI Mentor Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HintRequest(BaseModel):
    mission: str
    failure_reason: str
    user_attempt: Dict[str, Any]
    history: Optional[List[str]] = []

class HintResponse(BaseModel):
    hint: str
    socratic_focus: str
    recommended_action: str

# Local Socratic rule generator for instant offline response / fallback
SOCRATIC_FALLBACK_RULES = {
    "Bridge Mission": {
        "center_span_snap": {
            "hint": "I noticed the center section gave way first! Which shape in your bridge is carrying the weight, and is it a rectangle or a triangle?",
            "focus": "Truss Geometry & Weight Distribution",
            "action": "Try adding diagonal beams to create rigid triangular trusses."
        },
        "excessive_tension": {
            "hint": "The supporting ropes snapped! Did the tension pull down harder than the anchor points could hold?",
            "focus": "Tension vs Compression Forces",
            "action": "Consider replacing high-stress tension members with steel cables or adding suspension towers."
        },
        "budget_exceeded": {
            "hint": "Your structure is strong, but engineering requires material efficiency! Where can you swap expensive steel for lighter wood without losing strength?",
            "focus": "Cost & Material Efficiency",
            "action": "Use steel only at high-stress center nodes and wood for outer support frames."
        },
        "default": {
            "hint": "Every collapse tells a story! Look closely at the replay — which joint or beam bent or twisted first under load?",
            "focus": "Structural Analysis",
            "action": "Inspect the failure slow-motion view and strengthen the weak joint."
        }
    },
    "Power Mission": {
        "open_circuit": {
            "hint": "The light stays dark! Can electricity flow from the positive (+) terminal of the battery all the way back to the negative (-) terminal?",
            "focus": "Closed Loop Principle",
            "action": "Check if any wire gap exists between the switch and the lamp."
        },
        "short_circuit": {
            "hint": "Watch out! High current is looping directly back to the battery without passing through the load. What happens when power bypasses the light bulb?",
            "focus": "Circuit Resistance & Short Circuit Safety",
            "action": "Ensure wires go through the bulb before returning to the negative terminal."
        },
        "insufficient_voltage": {
            "hint": "The bulb is glowing very dimly! Is one solar panel supplying enough voltage for the total load?",
            "focus": "Voltage & Power Capacity",
            "action": "Connect solar panels in series to boost system voltage."
        },
        "default": {
            "hint": "Electricity needs a continuous unbroken highway. Where along the wire path does the current stop?",
            "focus": "Electrical Conductivity",
            "action": "Trace current flow step-by-step from source to ground."
        }
    }
}

def query_llm_socratic(request: HintRequest) -> Optional[str]:
    """Query external LLM if API keys are configured."""
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        return None

    prompt_content = f"""You are NOVA, an encouraging AI STEM engineering mentor in the 3D game RE:WORLD.
Rules:
1. NEVER give the direct answer or tell the player exactly where to click.
2. Ask ONE clear, engaging Socratic question that helps them analyze the physical or electrical principle.
3. Keep response concise (under 30 words).

Mission: {request.mission}
Failure Reason: {request.failure_reason}
Attempt Details: {json.dumps(request.user_attempt)}
"""
    try:
        req_data = json.dumps({
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "You are NOVA, a Socratic STEM mentor."},
                {"role": "user", "content": prompt_content}
            ],
            "max_tokens": 80,
            "temperature": 0.7
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=req_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {openai_key}"
            }
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            return res_body["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"LLM request failed or timed out: {e}")
        return None

@app.get("/")
def health_check():
    return {"status": "ok", "system": "RE:WORLD NOVA AI Mentor Server", "mode": "Active"}

@app.post("/api/nova/hint", response_model=HintResponse)
def generate_hint(request: HintRequest):
    # Try LLM first if API key configured
    llm_hint = query_llm_socratic(request)
    if llm_hint:
        return HintResponse(
            hint=llm_hint,
            socratic_focus="AI Socratic Guidance",
            recommended_action="Investigate the physical phenomenon mentioned by NOVA."
        )

    # Use Socratic heuristic engine
    mission_rules = SOCRATIC_FALLBACK_RULES.get(request.mission, SOCRATIC_FALLBACK_RULES["Bridge Mission"])
    matched_rule = None
    
    for key, rule in mission_rules.items():
        if key in request.failure_reason.lower():
            matched_rule = rule
            break
            
    if not matched_rule:
        matched_rule = mission_rules.get("default")

    return HintResponse(
        hint=matched_rule["hint"],
        socratic_focus=matched_rule["focus"],
        recommended_action=matched_rule["action"]
    )
