# 5-Minute Loom Video Script: Beep Gen AI & Engineering Assessment
**Candidate:** Anuraag Gupta  
**Role:** Gen AI & Engineering  
**Platform:** Beep (EventBeep)  
**Format:** Loom (Face + Screen recording), Max 5 Minutes  

---

## ⏱️ Video Timeline Overview
- **0:00 - 0:45 | Intro & Live Web Tool Demo** (Search, filters, bookmarking, 690+ live jobs)
- **0:45 - 2:00 | System Architecture & Ingestion Pipeline** (Sources, canonical dedup, LLM batching)
- **2:00 - 3:15 | "What Broke and How We Fixed It"** (The 3 crucial engineering challenges)
- **3:15 - 4:15 | The Numbers (50 Hand-checked Posts Accuracy & Cost per 1,000 Posts)**
- **4:15 - 5:00 | Daily Automation & Live Modification Readiness** (GitHub Actions cron, modular code for live coding round)

---

## 🎙️ Word-for-Word Walkthrough Script

### 1. Introduction & Live Tool Demo (0:00 - 0:45)
*(Face + Screen showing the running web app at `localhost:5173` or deployed Vercel URL)*

> "Hi Saurabh and the Beep team! I’m Anuraag Gupta. Today I’m walking you through my submission for the Gen AI & Engineering role: a live, self-refreshing career tracker that curates, deduplicates, and AI-tags 200+ fresher jobs and internships across India daily.
>
> As you can see on screen, we currently have **693 live active roles** displayed. College students can instantly search by skills like *React* or *Python*, filter by standardized role pills like *AI/ML*, *Frontend*, or *Backend*, toggle between *Internships* and *Fresher positions*, and filter by Indian tech hubs like *Bengaluru*, *Pune*, *Hyderabad*, or *Remote*. 
>
> Each card gives the standardized role, city, salary or stipend when available, direct official apply links, and one-click bookmarking."

---

### 2. System Architecture (0:45 - 2:00)
*(Screen showing `README.md` or the app's in-app Architecture Modal)*

> "Let's dive under the hood. The architecture is split into 4 decoupled, modular layers:
>
> 1. **Multi-Source Ingestion:** We aggregate listings from public compliant APIs including Arbeitnow, Remotive, and Jobicy, combined with curated verified campus hiring drives from tier-1 Indian tech companies and high-growth startups (Swiggy, Razorpay, CRED, Zomato, TCS, etc.).
> 2. **Deduplication Engine:** Job boards frequently repost listings with messy query parameters. Our pipeline performs URL canonicalization—stripping UTM and tracking tags—and computes an MD5 signature of `normalized_company::normalized_title`. In our latest run, this successfully detected and purged 25 cross-posted duplicates.
> 3. **AI Tagging Engine:** We utilize **Google Gemini 1.5 Flash** with native JSON schema enforcement to classify each role into 1 of 11 standardized tech domains and 8 city hubs.
> 4. **Storage & Web Delivery:** Results are serialized into a lightweight JSON database served directly by a high-performance React + Tailwind frontend."

---

### 3. "What Broke & How We Fixed It" (2:00 - 3:15)
*(Show code in VS Code / IDE or the Architecture Modal's callout boxes)*

> "Building this revealed three interesting edge-case challenges:
>
> **Challenge #1: The 'asSOCiate' Substring Collision Bug.**  
> Initially, our rule engine checked if the substring `'soc'` appeared in the title for Cybersecurity roles (referring to Security Operations Center). However, this caused hundreds of *'Associate Software Engineer'* positions to be falsely categorized as *Cybersecurity* because 'soc' is inside 'associate'!  
> *Fix:* We replaced raw substring checks with strict regex word boundaries (`\b(soc analyst|cybersecurity)\b`), immediately eliminating false positives.
>
> **Challenge #2: Windows CP1252 Shell Encoding Crash.**  
> During local testing on Windows environments, pipeline logger statements containing unicode emojis threw a `UnicodeEncodeError: 'charmap' codec can't encode character`.  
> *Fix:* We enforced `sys.stdout.reconfigure(encoding='utf-8')` and sanitized terminal log outputs with clean ASCII status tags.
>
> **Challenge #3: Gemini Rate Limits & Prompt Token Overhead.**  
> Hitting the LLM API sequentially for 200+ individual requests would take over 15 minutes due to the 15 Requests-Per-Minute free tier limit, and wastes tokens re-sending system prompts.  
> *Fix:* We implemented **batched inference (15 jobs per prompt)**. This reduced the entire run to just 14 API calls completed in under 15 seconds, and cut prompt token overhead by ~40%."

---

### 4. Put a Number On It: Accuracy & Unit Economics (3:15 - 4:15)
*(Show `data/evaluation_50_posts.csv` and the summary metrics)*

> "Now to requirement #3: putting a number on it.
>
> I hand-checked 50 diverse posts against ground truth:
> - **Role Tagging Accuracy:** **94.0%** (with Gemini 1.5 Flash) / 74% with our fallback heuristic baseline.
> - **City Hub Tagging Accuracy:** **94.0%** across 8 Indian tech centers.
> - **Job Type Accuracy (Intern vs Fresher):** **100.0%**.
>
> **What does it cost per 1,000 posts?**  
> We calculated this directly using Gemini 1.5 Flash's production pricing:
> - \$0.075 per 1 million input tokens.
> - \$0.30 per 1 million output tokens.
> - At ~250 input tokens and ~60 output tokens per job description:
> - **Input Cost:** \$0.01875 per 1,000 posts
> - **Output Cost:** \$0.01800 per 1,000 posts
> - **Total Cost per 1,000 posts = \$0.0368 — which is just ₹3.18 in Indian Rupees!**
> Even if Beep scales to 100,000 fresher jobs a month, the LLM tagging cost would be less than ₹320."

---

### 5. Daily Automation & Live Coding Readiness (4:15 - 5:00)
*(Show `.github/workflows/daily-refresh.yml`)*

> "For the daily self-refresh, we created a **GitHub Actions Cron workflow** that triggers every night at 00:00 UTC (05:30 AM IST). It automatically spins up a runner, executes `run_pipeline.py`, deduplicates, tags, commits the updated `jobs.json`, and triggers zero-downtime redeployment.
>
> Finally, Saurabh, regarding your note about changing the code live on our call: I specifically designed the codebase to be modular, readable, and functional. All scrapers, dedup rules, and prompt schemas are completely decoupled in `pipeline/`. If you ask me to add a new filter for graduation year, support a new city, or tweak the LLM prompt live on our call, I'm ready to do it seamlessly in real time.
>
> Thank you for considering my application, and I look forward to our live call and meeting the Beep team in Baner, Pune!"

---
