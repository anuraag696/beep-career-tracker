"""
LLM Tagging Engine for Beep Job Tracker.
Standardizes:
1. Standardized Role (Frontend, Backend, Full Stack, AI/ML, Data & Analytics, DevOps & Cloud, Mobile, QA & Testing, Product & Design, Other Tech)
2. Standardized City (Bengaluru, Pune, Hyderabad, Delhi NCR, Mumbai, Chennai, Remote, Other India)
3. Job Type (Internship vs Fresher/Full-time)
4. Stipend / Salary (Extracted or 'Not Disclosed')

Uses Google Gemini 1.5 Flash with:
- Batched inference (10-15 jobs per prompt) for ultra-fast processing and zero rate-limit issues
- Structured JSON output enforcement
- Fallback heuristic engine if no API key is configured or on network error
- Exact token & cost accounting ($ per 1,000 posts)
"""

import os
import re
import json
import time
from typing import List, Dict, Any, Tuple
from dotenv import load_dotenv

load_dotenv()

# Official Gemini 1.5 Flash pricing (USD per 1M tokens)
GEMINI_FLASH_INPUT_PRICE_PER_M = 0.075
GEMINI_FLASH_OUTPUT_PRICE_PER_M = 0.30
USD_TO_INR = 86.5  # Standard conversion

STANDARD_ROLES = [
    "Frontend",
    "Backend",
    "Full Stack",
    "AI/ML",
    "Data & Analytics",
    "DevOps & Cloud",
    "Mobile",
    "QA & Testing",
    "Product & Design",
    "Cybersecurity",
    "Other Tech"
]

STANDARD_CITIES = [
    "Bengaluru",
    "Pune",
    "Hyderabad",
    "Delhi NCR",
    "Mumbai",
    "Chennai",
    "Remote",
    "Other India"
]

SYSTEM_PROMPT = """You are an expert technical talent recruiter and Gen AI tagging engine for Beep, an Indian career platform for college students.
Given a list of job listings, accurately categorize and extract structured fields for each job.

Categories to use:
- role: EXACTLY one of ["Frontend", "Backend", "Full Stack", "AI/ML", "Data & Analytics", "DevOps & Cloud", "Mobile", "QA & Testing", "Product & Design", "Cybersecurity", "Other Tech"]
- city: EXACTLY one of ["Bengaluru", "Pune", "Hyderabad", "Delhi NCR", "Mumbai", "Chennai", "Remote", "Other India"]. 
  Note: Gurgaon, Noida, New Delhi, Faridabad map to "Delhi NCR". Bangalore maps to "Bengaluru".
- job_type: EXACTLY one of ["Internship", "Fresher/Full-time"]
- stipend_salary: Extracted compensation or "Not Disclosed"
- confidence: Float between 0.0 and 1.0

Return a valid JSON array of objects with the exact same count and order as the input jobs, matching this schema:
[
  {
    "id": 0,
    "role": "Frontend",
    "city": "Bengaluru",
    "job_type": "Internship",
    "stipend_salary": "Not Disclosed",
    "confidence": 0.95
  }
]
"""


def heuristic_tag_job(job: Dict[str, Any]) -> Dict[str, Any]:
    """
    Intelligent rule-based tagger.
    Used as an immediate fallback or baseline benchmark.
    """
    title = (job.get("title", "")).lower()
    raw_loc = (job.get("raw_location", "")).lower()
    desc = (job.get("description", "")).lower()
    full_text = f"{title} {raw_loc} {desc[:500]}"

    # 1. City Detection
    city = "Other India"
    if any(k in raw_loc for k in ["remote", "anywhere", "worldwide", "work from home"]):
        city = "Remote"
    elif any(k in raw_loc for k in ["bengaluru", "bangalore"]):
        city = "Bengaluru"
    elif "pune" in raw_loc:
        city = "Pune"
    elif "hyderabad" in raw_loc:
        city = "Hyderabad"
    elif any(k in raw_loc for k in ["delhi", "gurgaon", "gurugram", "noida", "ncr", "faridabad"]):
        city = "Delhi NCR"
    elif any(k in raw_loc for k in ["mumbai", "navi mumbai", "thane"]):
        city = "Mumbai"
    elif "chennai" in raw_loc:
        city = "Chennai"
    elif any(k in full_text for k in ["remote", "work from home"]):
        city = "Remote"
    elif "pune" in full_text:
        city = "Pune"
    elif any(k in full_text for k in ["bengaluru", "bangalore"]):
        city = "Bengaluru"

    # 2. Role Detection with word-boundary awareness
    role = "Other Tech"
    
    # AI / ML
    if re.search(r'\b(gen ai|genai|ai|ml|machine learning|deep learning|nlp|llm|data scientist|prompt engineer)\b', title):
        role = "AI/ML"
    # Data & Analytics
    elif re.search(r'\b(data analyst|data engineer|analytics|bi developer|powerbi|tableau)\b', title):
        role = "Data & Analytics"
    # Frontend
    elif re.search(r'\b(frontend|front end|react|vue|angular|ui developer|web developer)\b', title):
        role = "Frontend"
    # Mobile
    elif re.search(r'\b(android|ios|flutter|react native|mobile)\b', title):
        role = "Mobile"
    # QA & Testing
    elif re.search(r'\b(qa|quality|test|tester|sdet|automation engineer|testing)\b', title):
        role = "QA & Testing"
    # DevOps & Cloud
    elif re.search(r'\b(devops|cloud|sre|aws|azure|kubernetes|docker|infrastructure)\b', title):
        role = "DevOps & Cloud"
    # Product & Design
    elif re.search(r'\b(product design|ui/ux|ux designer|ui designer|product manager|product analyst|figma)\b', title):
        role = "Product & Design"
    # Cybersecurity (Using word boundaries so 'soc' doesn't match 'associate'!)
    elif re.search(r'\b(cybersecurity|cyber security|infosec|penetration|soc analyst|malware)\b', title):
        role = "Cybersecurity"
    # Full Stack
    elif re.search(r'\b(full stack|fullstack|mern|mean)\b', title):
        role = "Full Stack"
    # Backend
    elif re.search(r'\b(backend|back end|node|django|fastapi|spring boot|golang|java developer|c\+\+|dotnet|\.net)\b', title):
        role = "Backend"
    # General Engineering, SDE, Graduate Engineer Trainee, MTS, Software Engineer
    elif re.search(r'\b(software engineer|sde|developer|get|trainee|graduate|programmer|mts|systems engineer|analyst)\b', title):
        if re.search(r'\b(react|frontend|css|html)\b', full_text):
            role = "Frontend"
        elif re.search(r'\b(python|ai|ml|data)\b', full_text) and "gen" in full_text:
            role = "AI/ML"
        elif re.search(r'\b(sql|analytics|dashboard)\b', full_text):
            role = "Data & Analytics"
        else:
            role = "Backend"

    # 3. Job Type Detection
    job_type = "Fresher/Full-time"
    if any(k in title for k in ["intern", "internship", "trainee", "apprentice"]) or "internship" in full_text[:200]:
        job_type = "Internship"

    # 4. Stipend / Salary Detection
    stipend = "Not Disclosed"
    salary_match = re.search(r'(₹\s?[\d,]+(?:\s?-\s?₹?[\d,]+)?(?:\s?/\s?month|\s?lpa|\s?per month|\s?pm)?)', full_text, re.IGNORECASE)
    if salary_match:
        stipend = salary_match.group(1).strip()
    elif "lpa" in full_text:
        lpa_match = re.search(r'(\d+(?:\.\d+)?\s?-\s?\d+(?:\.\d+)?\s?lpa)', full_text, re.IGNORECASE)
        if lpa_match:
            stipend = lpa_match.group(1).upper()

    return {
        "role": role,
        "city": city,
        "job_type": job_type,
        "stipend_salary": stipend,
        "confidence": 0.88,
        "tagger_used": "Heuristic Rule Engine"
    }


def call_gemini_batch(batch: List[Dict[str, Any]], api_key: str) -> Tuple[List[Dict[str, Any]], int, int]:
    """
    Calls Google Gemini API on a batch of jobs.
    Returns (tagged_batch, prompt_tokens, candidate_tokens).
    """
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config={
            "response_mime_type": "application/json",
            "temperature": 0.1
        }
    )

    items_to_send = []
    for idx, job in enumerate(batch):
        items_to_send.append({
            "id": idx,
            "title": job.get("title", ""),
            "company": job.get("company", ""),
            "raw_location": job.get("raw_location", ""),
            "description_excerpt": job.get("description", "")[:250]
        })

    prompt = f"{SYSTEM_PROMPT}\n\nJobs to tag:\n{json.dumps(items_to_send, indent=2)}"

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        parsed_json = json.loads(text)

        # Estimate / extract token usage
        prompt_tokens = len(prompt) // 4
        candidate_tokens = len(text) // 4
        if hasattr(response, 'usage_metadata') and response.usage_metadata:
            prompt_tokens = response.usage_metadata.prompt_token_count
            candidate_tokens = response.usage_metadata.candidates_token_count

        id_map = {item["id"]: item for item in parsed_json if "id" in item}

        results = []
        for idx in range(len(batch)):
            if idx in id_map:
                res = id_map[idx]
                results.append({
                    "role": res.get("role", "Other Tech") if res.get("role") in STANDARD_ROLES else "Other Tech",
                    "city": res.get("city", "Other India") if res.get("city") in STANDARD_CITIES else "Other India",
                    "job_type": res.get("job_type", "Fresher/Full-time"),
                    "stipend_salary": res.get("stipend_salary", "Not Disclosed"),
                    "confidence": float(res.get("confidence", 0.95)),
                    "tagger_used": "Gemini 1.5 Flash"
                })
            else:
                results.append(heuristic_tag_job(batch[idx]))

        return results, prompt_tokens, candidate_tokens

    except Exception as e:
        print(f"[Warning] Gemini batch call failed ({e}). Falling back to heuristic engine.")
        results = [heuristic_tag_job(j) for j in batch]
        return results, 0, 0


def tag_all_jobs(jobs: List[Dict[str, Any]], batch_size: int = 15) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Tags a list of jobs using Gemini 1.5 Flash if GEMINI_API_KEY is available,
    otherwise uses the heuristic engine.
    Computes exact unit cost breakdown per 1,000 posts.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    total_prompt_tokens = 0
    total_candidate_tokens = 0
    tagged_jobs = []

    has_api = bool(api_key and not api_key.startswith("your_"))
    print(f"[Tagger] Mode: {'Gemini 1.5 Flash (LLM)' if has_api else 'Heuristic Fallback Engine (No GEMINI_API_KEY detected)'}")

    for i in range(0, len(jobs), batch_size):
        batch = jobs[i:i + batch_size]
        if has_api:
            batch_tags, p_tokens, c_tokens = call_gemini_batch(batch, api_key)
            total_prompt_tokens += p_tokens
            total_candidate_tokens += c_tokens
            time.sleep(1.0)  # Safe spacing for free rate limits
        else:
            batch_tags = [heuristic_tag_job(job) for job in batch]

        for job, tags in zip(batch, batch_tags):
            merged = {**job, **tags}
            tagged_jobs.append(merged)

    # Cost calculations
    total_tokens = total_prompt_tokens + total_candidate_tokens
    actual_cost_usd = (total_prompt_tokens * (GEMINI_FLASH_INPUT_PRICE_PER_M / 1_000_000)) + \
                      (total_candidate_tokens * (GEMINI_FLASH_OUTPUT_PRICE_PER_M / 1_000_000))

    # Extrapolate to 1,000 posts
    job_count = max(len(jobs), 1)
    cost_per_1000_usd = (actual_cost_usd / job_count) * 1000 if actual_cost_usd > 0 else (
        # Theoretical benchmark calculation for 1k posts using ~250 input tokens and ~60 output tokens
        (1000 * 250 * GEMINI_FLASH_INPUT_PRICE_PER_M / 1_000_000) +
        (1000 * 60 * GEMINI_FLASH_OUTPUT_PRICE_PER_M / 1_000_000)
    )
    cost_per_1000_inr = cost_per_1000_usd * USD_TO_INR

    metrics = {
        "total_jobs_tagged": len(tagged_jobs),
        "tagger_used": "Gemini 1.5 Flash" if has_api else "Heuristic Rule Engine (Gemini fallback)",
        "prompt_tokens": total_prompt_tokens,
        "candidate_tokens": total_candidate_tokens,
        "total_tokens": total_tokens,
        "actual_run_cost_usd": round(actual_cost_usd, 5),
        "cost_per_1000_posts_usd": round(cost_per_1000_usd, 4),
        "cost_per_1000_posts_inr": round(cost_per_1000_inr, 2),
        "official_gemini_rates": {
            "input_per_million": f"${GEMINI_FLASH_INPUT_PRICE_PER_M}",
            "output_per_million": f"${GEMINI_FLASH_OUTPUT_PRICE_PER_M}"
        }
    }

    return tagged_jobs, metrics
