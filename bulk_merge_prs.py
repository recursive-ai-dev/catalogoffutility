#!/usr/bin/env python3
"""
Automated PR merger for catalogoffutility repository.
Merges PRs in intelligent order based on type and dependencies.
"""
import requests
import json
import time
from typing import List, Dict
import sys

# Configuration
REPO = "recursive-ai-dev/catalogoffutility"
GITHUB_API_BASE = "https://api.github.com"

def get_headers(token: str) -> Dict[str, str]:
    return {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
    }

def get_all_open_prs(token: str) -> List[Dict]:
    """Fetch all open PRs with pagination."""
    prs = []
    page = 1
    per_page = 100
    
    while True:
        url = f"{GITHUB_API_BASE}/repos/{REPO}/pulls"
        params = {
            "state": "open",
            "per_page": per_page,
            "page": page,
            "sort": "created",
            "direction": "asc"
        }
        
        response = requests.get(url, headers=get_headers(token), params=params)
        
        if response.status_code != 200:
            print(f"Error fetching PRs: {response.status_code} - {response.text}")
            break
            
        data = response.json()
        if not data:
            break
            
        prs.extend(data)
        print(f"Fetched {len(data)} PRs (page {page})")
        page += 1
        time.sleep(0.5)  # Rate limiting
    
    return prs

def categorize_pr(pr: Dict) -> str:
    """Categorize PR by type based on title."""
    title = pr.get("title", "").lower()
    
    if "sentinel" in title or "security" in title or "xss" in title or "csp" in title:
        return "security"
    elif "bolt" in title or "optim" in title or "performance" in title:
        return "performance"
    elif "palette" in title or "ux" in title or "accessibility" in title:
        return "ux"
    elif "regression" in title or "fix" in title or "bug" in title:
        return "bugfix"
    else:
        return "other"

def get_merge_order(prs: List[Dict]) -> List[Dict]:
    """Sort PRs by merge priority."""
    priority_order = {
        "security": 0,
        "bugfix": 1,
        "performance": 2,
        "ux": 3,
        "other": 4
    }
    
    def sort_key(pr):
        category = categorize_pr(pr)
        return (priority_order.get(category, 5), pr["number"])
    
    return sorted(prs, key=sort_key)

def check_mergeable(token: str, pr: Dict) -> bool:
    """Check if PR is mergeable."""
    url = f"{GITHUB_API_BASE}/repos/{REPO}/pulls/{pr['number']}"
    response = requests.get(url, headers=get_headers(token))
    
    if response.status_code != 200:
        return False
    
    data = response.json()
    return data.get("mergeable", False) and data.get("mergeable_state") == "clean"

def merge_pr(token: str, pr: Dict, dry_run: bool = True) -> bool:
    """Merge a PR."""
    if dry_run:
        print(f"[DRY RUN] Would merge PR #{pr['number']}: {pr['title']}")
        return True
    
    url = f"{GITHUB_API_BASE}/repos/{REPO}/pulls/{pr['number']}/merge"
    payload = {
        "commit_title": f"Merge PR #{pr['number']}: {pr['title']}",
        "commit_message": "",
        "merge_method": "squash",
        "delete_branch": True
    }
    
    response = requests.put(url, headers=get_headers(token), json=payload)
    
    if response.status_code == 200:
        print(f"✅ Merged PR #{pr['number']}: {pr['title']}")
        return True
    else:
        print(f"❌ Failed to merge PR #{pr['number']}: {response.status_code} - {response.text}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python bulk_merge_prs.py <github_token> [--dry-run]")
        print("Get a token from: https://github.com/settings/tokens")
        print("Required scope: repo")
        sys.exit(1)
    
    token = sys.argv[1]
    dry_run = "--dry-run" in sys.argv or len(sys.argv) > 2 and sys.argv[2] == "--dry-run"
    
    print(f"Fetching all open PRs for {REPO}...")
    prs = get_all_open_prs(token)
    
    if not prs:
        print("No open PRs found.")
        return
    
    print(f"\nFound {len(prs)} open PRs")
    
    # Categorize and sort
    sorted_prs = get_merge_order(prs)
    
    # Print summary
    categories = {}
    for pr in sorted_prs:
        cat = categorize_pr(pr)
        categories[cat] = categories.get(cat, 0) + 1
    
    print("\nPR breakdown by category:")
    for cat, count in categories.items():
        print(f"  {cat}: {count}")
    
    print(f"\nMerge order (dry run: {dry_run}):")
    for i, pr in enumerate(sorted_prs, 1):
        cat = categorize_pr(pr)
        print(f"  {i}. [{cat}] #{pr['number']}: {pr['title']}")
    
    if dry_run:
        print("\nThis is a DRY RUN. No PRs will be merged.")
        print("Run without --dry-run to actually merge.")
        return
    
    # Confirm
    response = input(f"\nMerge {len(sorted_prs)} PRs? (yes/no): ")
    if response.lower() != "yes":
        print("Aborted.")
        return
    
    # Merge PRs
    success_count = 0
    fail_count = 0
    
    for pr in sorted_prs:
        print(f"\nChecking PR #{pr['number']}...")
        
        if not check_mergeable(token, pr):
            print(f"⏭️  Skipping PR #{pr['number']} - not mergeable or has conflicts")
            fail_count += 1
            continue
        
        if merge_pr(token, pr, dry_run=False):
            success_count += 1
        else:
            fail_count += 1
        
        time.sleep(1)  # Rate limiting
    
    print(f"\n{'='*50}")
    print(f"Merge complete!")
    print(f"Success: {success_count}")
    print(f"Failed/Skipped: {fail_count}")
    print(f"Total: {len(sorted_prs)}")

if __name__ == "__main__":
    main()
