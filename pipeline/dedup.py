"""
Deduplication Engine for Beep Job Tracker
Features:
1. URL Normalization (stripping tracking params like utm_*, ref, etc.)
2. Canonical Key generation (MD5 hash of normalized company + normalized title)
3. Title-Company fuzzy / normalized similarity matching
"""

import re
import hashlib
from typing import List, Dict, Any, Tuple
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode


def normalize_url(url: str) -> str:
    """Strip tracking parameters and fragments from URLs."""
    if not url:
        return ""
    try:
        parsed = urlparse(url.strip())
        # Strip common tracking query params
        ignored_params = {'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source', 'trk'}
        filtered_queries = [
            (k, v) for k, v in parse_qsl(parsed.query)
            if k.lower() not in ignored_params
        ]
        # Sort query params for consistent hashing
        filtered_queries.sort()
        new_query = urlencode(filtered_queries)
        clean_url = urlunparse((
            parsed.scheme.lower(),
            parsed.netloc.lower(),
            parsed.path.rstrip('/'),
            parsed.params,
            new_query,
            '' # drop fragment
        ))
        return clean_url
    except Exception:
        return url.strip()


def normalize_text(text: str) -> str:
    """Normalize text by lowercasing and removing special punctuation."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'[\(\)\[\]\{\}\-\|\/\\,\.]', ' ', text)
    tokens = text.split()
    return ' '.join(tokens)


def generate_dedup_hash(company: str, title: str) -> str:
    """Generates an MD5 signature from normalized company + title."""
    norm_comp = normalize_text(company)
    norm_title = normalize_text(title)
    key = f"{norm_comp}::{norm_title}"
    return hashlib.md5(key.encode('utf-8')).hexdigest()


def deduplicate_jobs(jobs: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
    """
    Deduplicates a list of job dicts.
    Returns:
        (unique_jobs, stats_dict)
    """
    seen_urls = set()
    seen_hashes = set()
    unique_jobs = []
    
    url_duplicates = 0
    hash_duplicates = 0

    for job in jobs:
        raw_url = job.get('apply_url') or job.get('url') or ''
        clean_url = normalize_url(raw_url)
        job['apply_url'] = clean_url

        # Check 1: Exact Clean URL duplicate
        if clean_url and clean_url in seen_urls:
            url_duplicates += 1
            continue

        # Check 2: Content Hash duplicate (Company + Title)
        comp = job.get('company', '')
        title = job.get('title', '')
        content_hash = generate_dedup_hash(comp, title)
        job['dedup_hash'] = content_hash

        if content_hash in seen_hashes:
            hash_duplicates += 1
            continue

        if clean_url:
            seen_urls.add(clean_url)
        seen_hashes.add(content_hash)
        unique_jobs.append(job)

    stats = {
        "initial_count": len(jobs),
        "unique_count": len(unique_jobs),
        "url_duplicates": url_duplicates,
        "hash_duplicates": hash_duplicates,
        "total_duplicates_removed": len(jobs) - len(unique_jobs)
    }

    return unique_jobs, stats
