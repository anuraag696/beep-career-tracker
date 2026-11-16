"""
Pipeline Orchestrator for Beep Job Tracker.
Executes end-to-end:
1. Fetch 200+ raw fresher and internship posts across India
2. Deduplicate using URL canonicalization and hash fingerprints
3. LLM tagging engine (Role, City, Type, Stipend)
4. Evaluate 50 hand-checked posts and save CSV report
5. Sync results to both backend and frontend data stores
"""

import os
import sys
import json
import time
from datetime import datetime

# Ensure standard output can handle UTF-8 / emojis on Windows shells
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline.sources import fetch_all_jobs
from pipeline.dedup import deduplicate_jobs
from pipeline.tagger import tag_all_jobs
from pipeline.evaluator import evaluate_50_sample_posts


def run_pipeline():
    start_time = time.time()
    print("=" * 65)
    print("[RUN] BEEP CAREER PLATFORM - DAILY INGESTION & AI TAGGING PIPELINE")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 65)

    # Step 1: Collect
    print("\n[STEP 1/4] Ingesting jobs from public compliant sources...")
    raw_jobs = fetch_all_jobs()
    print(f"[OK] Collected {len(raw_jobs)} raw postings.")

    # Step 2: Deduplicate
    print("\n[STEP 2/4] Running Deduplication Engine...")
    unique_jobs, dedup_stats = deduplicate_jobs(raw_jobs)
    print(f"[OK] Deduplication Complete:")
    print(f"   * Raw Posts: {dedup_stats['initial_count']}")
    print(f"   * Unique Posts Retained: {dedup_stats['unique_count']}")
    print(f"   * Duplicates Removed: {dedup_stats['total_duplicates_removed']} "
          f"({dedup_stats['url_duplicates']} URL duplicates, {dedup_stats['hash_duplicates']} content duplicates)")

    # Step 3: LLM Tagging
    print("\n[STEP 3/4] Running AI Tagging Engine (Role, City, Stipend, Type)...")
    tagged_jobs, tag_metrics = tag_all_jobs(unique_jobs)
    print(f"[OK] Tagging Complete:")
    print(f"   * Engine Used: {tag_metrics['tagger_used']}")
    print(f"   * Total Posts Tagged: {tag_metrics['total_jobs_tagged']}")
    print(f"   * Estimated Cost per 1,000 Posts: ${tag_metrics['cost_per_1000_posts_usd']} (INR {tag_metrics['cost_per_1000_posts_inr']})")

    # Step 4: Hand-Check Evaluation (50 posts)
    print("\n[STEP 4/4] Generating Hand-Checked Evaluation Dataset (50 posts)...")
    eval_metrics = evaluate_50_sample_posts(tagged_jobs)
    print(f"[OK] Evaluation Metrics:")
    print(f"   * Role Accuracy: {eval_metrics['role_accuracy_percent']}% ({eval_metrics['role_correct_count']})")
    print(f"   * City Accuracy: {eval_metrics['city_accuracy_percent']}% ({eval_metrics['city_correct_count']})")
    print(f"   * Job Type Accuracy: {eval_metrics['job_type_accuracy_percent']}% ({eval_metrics['job_type_correct_count']})")
    print(f"   * Exact Match (Role + City): {eval_metrics['overall_exact_match_percent']}%")
    print(f"   * Evaluation CSV exported to data/evaluation_50_posts.csv")

    # Persist Final Dataset
    final_payload = {
        "metadata": {
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "last_updated_human": datetime.now().strftime("%B %d, %Y at %I:%M %p IST"),
            "total_jobs": len(tagged_jobs),
            "sources": ["Arbeitnow API", "Remotive API", "Jobicy API", "India Campus Hiring Network", "Curated Tier-1 Indian Drives"],
            "dedup_stats": dedup_stats,
            "cost_per_1000_posts_usd": tag_metrics['cost_per_1000_posts_usd'],
            "cost_per_1000_posts_inr": tag_metrics['cost_per_1000_posts_inr'],
            "evaluation_metrics": eval_metrics
        },
        "jobs": tagged_jobs
    }

    # Save destinations
    destinations = [
        "data/jobs.json",
        "frontend/public/data/jobs.json",
        "frontend/src/data/jobs.json"
    ]
    for dest in destinations:
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "w", encoding="utf-8") as f:
            json.dump(final_payload, f, indent=2, ensure_ascii=False)
        print(f"[OK] Saved live database to {dest}")

    elapsed = round(time.time() - start_time, 2)
    print("\n" + "=" * 65)
    print(f"[SUCCESS] PIPELINE FINISHED IN {elapsed}s")
    print(f"Total live jobs ready for display: {len(tagged_jobs)}")
    print("=" * 65)

    return final_payload


if __name__ == "__main__":
    run_pipeline()
