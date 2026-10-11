#!/usr/bin/env python3
"""Preview PRs by default; explicit execution pins each reviewed head SHA.

Uses the Python standard library. GitHub enforces branch protections.
"""
import argparse
import json
import os
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

REPO = "recursive-ai-dev/catalogoffutility"
GITHUB_API_BASE = "https://api.github.com"
REQUEST_TIMEOUT = 30
MAX_GET_ATTEMPTS = 3


class GitHubError(RuntimeError):
    """A failed API request; never consume a partial PR listing."""


def get_headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "catalog-of-futility-pr-review",
    }


def api_request(token: str, endpoint: str, *, payload: dict | None = None):
    """Retry safe GETs only; never repeat a merge after an uncertain response."""
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = Request(
        GITHUB_API_BASE + endpoint, data=body, headers=get_headers(token),
        method="PUT" if payload is not None else "GET",
    )
    attempts = 1 if payload is not None else MAX_GET_ATTEMPTS
    for attempt in range(attempts):
        try:
            with urlopen(request, timeout=REQUEST_TIMEOUT) as response:
                try:
                    return json.load(response)
                except (ValueError, UnicodeDecodeError) as error:
                    raise GitHubError("GitHub returned invalid JSON.") from error
        except HTTPError as error:
            status = error.code
            error.close()
            if status not in (429, 500, 502, 503, 504) or attempt + 1 == attempts:
                raise GitHubError(f"GitHub request failed (HTTP {status}).") from error
        except (URLError, TimeoutError, OSError) as error:
            if attempt + 1 == attempts:
                raise GitHubError("GitHub could not be reached; no retry of a merge was attempted.") from error
        time.sleep(2 ** attempt)
    raise GitHubError("GitHub request failed.")


def get_all_open_prs(token: str) -> list[dict]:
    prs: list[dict] = []
    numbers: set[int] = set()
    page = 1
    while True:
        data = api_request(token, f"/repos/{REPO}/pulls?state=open&per_page=100&page={page}&sort=created&direction=asc")
        if not isinstance(data, list):
            raise GitHubError("GitHub returned an invalid PR listing.")
        if not data:
            return prs
        for pr in data:
            if not isinstance(pr, dict) or not isinstance(pr.get("number"), int):
                raise GitHubError("GitHub returned an invalid PR record.")
            if pr["number"] in numbers:
                raise GitHubError("The PR listing changed during pagination; run the review again.")
            numbers.add(pr["number"])
            if not pr.get("draft", False):
                prs.append(pr)
        page += 1


def categorize_pr(pr: dict) -> str:
    title = str(pr.get("title", "")).lower()
    for category, keywords in (
        ("security", ("sentinel", "security", "xss", "csp")),
        ("performance", ("bolt", "optim", "performance")),
        ("ux", ("palette", "ux", "accessibility")),
        ("bugfix", ("regression", "fix", "bug")),
    ):
        if any(keyword in title for keyword in keywords):
            return category
    return "other"


def get_merge_order(prs: list[dict]) -> list[dict]:
    """Prioritize categories; this is not dependency resolution."""
    priorities = {"security": 0, "bugfix": 1, "performance": 2, "ux": 3, "other": 4}
    return sorted(prs, key=lambda pr: (priorities[categorize_pr(pr)], pr["number"]))


def check_mergeable(token: str, pr: dict) -> bool:
    data = api_request(token, f"/repos/{REPO}/pulls/{pr['number']}")
    if not isinstance(data, dict):
        raise GitHubError("GitHub returned invalid PR details.")
    expected_sha = pr.get("head", {}).get("sha")
    actual_sha = data.get("head", {}).get("sha")
    return bool(
        expected_sha and actual_sha == expected_sha and data.get("state") == "open"
        and not data.get("draft") and data.get("mergeable") is True
        and data.get("mergeable_state") == "clean"
    )


def merge_pr(token: str, pr: dict, dry_run: bool = True) -> bool:
    if dry_run:
        print(f"[PREVIEW] Would merge PR #{pr['number']}: {pr['title']}")
        return True
    sha = pr.get("head", {}).get("sha")
    if not sha:
        raise GitHubError("Cannot merge a PR without a reviewed head SHA.")
    data = api_request(token, f"/repos/{REPO}/pulls/{pr['number']}/merge", payload={
        "commit_title": f"Merge PR #{pr['number']}: {pr['title']}",
        "commit_message": "", "merge_method": "squash", "sha": sha,
    })
    if not isinstance(data, dict) or data.get("merged") is not True:
        raise GitHubError(f"GitHub did not merge PR #{pr['number']}.")
    print(f"Merged PR #{pr['number']}: {pr['title']}")
    return True


def repository(value: str) -> str:
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9-]*/[A-Za-z0-9_.-]+", value) or value.split("/")[-1] in (".", ".."):
        raise argparse.ArgumentTypeError("Expected owner/repository.")
    return value


def main(argv: list[str] | None = None) -> int:
    global REPO
    parser = argparse.ArgumentParser(description="Preview open PRs in category priority order.")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true", help="preview only (the default)")
    mode.add_argument("--execute", action="store_true", help="merge after terminal confirmation")
    parser.add_argument("--repo", type=repository, default=REPO)
    args = parser.parse_args(argv)
    REPO = args.repo
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if not token:
        print("error: GITHUB_TOKEN is not set.", file=sys.stderr)
        return 1
    try:
        prs = get_merge_order(get_all_open_prs(token))
        if not prs:
            print("No open, non-draft PRs found.")
            return 0
        print(f"Reviewing {len(prs)} PRs for {REPO}:")
        for pr in prs:
            print(f"  [{categorize_pr(pr)}] #{pr['number']}: {pr['title']}")
        if not args.execute:
            print("Preview complete. Nothing was merged. Use --execute to request merges.")
            return 0
        if not sys.stdin.isatty():
            print("error: --execute requires an interactive terminal.", file=sys.stderr)
            return 1
        if input(f"Merge these PRs in {REPO}? Type the repository name: ").strip() != REPO:
            print("Aborted.")
            return 1
        skipped = 0
        for pr in prs:
            if not check_mergeable(token, pr):
                print(f"Skipping #{pr['number']}: changed, draft, blocked, or not mergeable.")
                skipped += 1
                continue
            merge_pr(token, pr, dry_run=False)
            time.sleep(1)
        print(f"Merged: {len(prs) - skipped}; skipped: {skipped}.")
        return 1 if skipped else 0
    except (GitHubError, EOFError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("Interrupted.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    sys.exit(main())
