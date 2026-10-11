"""Offline regression checks. These tests never contact GitHub or merge PRs."""
import io
import json
import os
import unittest
from contextlib import redirect_stdout, redirect_stderr
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError, URLError

import bulk_merge_prs as merger


def pr(number=1, sha="reviewed", **kwargs):
    return {"number": number, "title": "fix: navigation", "head": {"sha": sha}, **kwargs}


def response(value):
    result = MagicMock()
    result.__enter__.return_value = io.StringIO(json.dumps(value))
    return result


class MergeSafetyTests(unittest.TestCase):
    def setUp(self):
        self.previous_repo = merger.REPO

    def tearDown(self):
        merger.REPO = self.previous_repo

    def test_default_is_preview_and_never_calls_merge(self):
        with patch.dict(os.environ, {"GITHUB_TOKEN": "test-token"}), patch.object(merger, "get_all_open_prs", return_value=[pr()]), patch.object(merger, "merge_pr") as merge, redirect_stdout(io.StringIO()):
            self.assertEqual(merger.main([]), 0)
            merge.assert_not_called()

    def test_execute_requires_a_terminal(self):
        with patch.dict(os.environ, {"GITHUB_TOKEN": "test-token"}), patch.object(merger, "get_all_open_prs", return_value=[pr()]), patch.object(merger.sys.stdin, "isatty", return_value=False), patch.object(merger, "merge_pr") as merge, redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            self.assertEqual(merger.main(["--execute"]), 1)
            merge.assert_not_called()

    def test_missing_token_exits_before_network(self):
        with patch.dict(os.environ, {"GITHUB_TOKEN": "  "}), patch.object(merger, "api_request") as api, redirect_stderr(io.StringIO()):
            self.assertEqual(merger.main([]), 1)
            api.assert_not_called()

    def test_wrong_confirmation_aborts(self):
        with patch.dict(os.environ, {"GITHUB_TOKEN": "token"}), patch.object(merger, "get_all_open_prs", return_value=[pr()]), patch.object(merger.sys.stdin, "isatty", return_value=True), patch("builtins.input", return_value="yes"), patch.object(merger, "merge_pr") as merge, redirect_stdout(io.StringIO()):
            self.assertEqual(merger.main(["--execute"]), 1)
            merge.assert_not_called()

    def test_changed_head_is_never_mergeable(self):
        latest = pr(sha="unreviewed", state="open", draft=False, mergeable=True, mergeable_state="clean")
        with patch.object(merger, "api_request", return_value=latest):
            self.assertFalse(merger.check_mergeable("token", pr()))

    def test_open_clean_unchanged_head_is_mergeable(self):
        latest = pr(state="open", draft=False, mergeable=True, mergeable_state="clean")
        with patch.object(merger, "api_request", return_value=latest):
            self.assertTrue(merger.check_mergeable("token", pr()))

    def test_unknown_mergeability_and_drafts_fail_closed(self):
        for overrides in ({"mergeable": None}, {"draft": True}, {"state": "closed"}, {"mergeable_state": "blocked"}):
            latest = pr(state="open", draft=False, mergeable=True, mergeable_state="clean")
            latest.update(overrides)
            with patch.object(merger, "api_request", return_value=latest):
                self.assertFalse(merger.check_mergeable("token", pr()))

    def test_merge_request_pins_the_sha_and_uses_supported_payload_fields(self):
        with patch.object(merger, "api_request", return_value={"merged": True}) as api, redirect_stdout(io.StringIO()):
            self.assertTrue(merger.merge_pr("token", pr(), dry_run=False))
            payload = api.call_args.kwargs["payload"]
            self.assertEqual(payload["sha"], "reviewed")
            self.assertNotIn("delete_branch", payload)

    def test_http_success_does_not_imply_merge_success(self):
        with patch.object(merger, "api_request", return_value={"merged": False}):
            with self.assertRaises(merger.GitHubError):
                merger.merge_pr("token", pr(), dry_run=False)

    def test_missing_sha_is_rejected_without_network(self):
        with patch.object(merger, "api_request") as api:
            with self.assertRaises(merger.GitHubError):
                merger.merge_pr("token", {"number": 1}, dry_run=False)
            api.assert_not_called()

    def test_pagination_filters_drafts(self):
        with patch.object(merger, "api_request", side_effect=[[pr(1), pr(2, draft=True)], [pr(3)], []]):
            self.assertEqual([item["number"] for item in merger.get_all_open_prs("token")], [1, 3])

    def test_pagination_failure_cannot_return_partial_results(self):
        with patch.object(merger, "api_request", side_effect=[[pr()], merger.GitHubError("offline")]):
            with self.assertRaises(merger.GitHubError):
                merger.get_all_open_prs("token")

    def test_duplicate_pages_abort(self):
        with patch.object(merger, "api_request", side_effect=[[pr()], [pr()]]):
            with self.assertRaises(merger.GitHubError):
                merger.get_all_open_prs("token")

    def test_invalid_listing_and_records_abort(self):
        for listing in ({"message": "error"}, [None], [{"number": "1"}]):
            with patch.object(merger, "api_request", return_value=listing):
                with self.assertRaises(merger.GitHubError):
                    merger.get_all_open_prs("token")

    def test_sorting_is_stable_without_mutating_input(self):
        source = [pr(9, title="other"), pr(4, title="security"), pr(2, title="security")]
        self.assertEqual([item["number"] for item in merger.get_merge_order(source)], [2, 4, 9])
        self.assertEqual(source[0]["number"], 9)

    def test_repo_input_cannot_inject_url_parameters(self):
        self.assertEqual(merger.repository("owner/repo-name"), "owner/repo-name")
        for value in ("owner/repo?state=closed", "../repo", "https://host/repo", "owner/repo/merge"):
            with self.assertRaises(Exception):
                merger.repository(value)


class NetworkTests(unittest.TestCase):
    def test_safe_get_retries_and_has_a_timeout(self):
        with patch.object(merger, "urlopen", side_effect=[URLError("offline"), response([])]) as opened, patch.object(merger.time, "sleep"):
            self.assertEqual(merger.api_request("token", "/test"), [])
            self.assertEqual(opened.call_count, 2)
            self.assertEqual(opened.call_args.kwargs["timeout"], 30)

    def test_merge_never_retries_network_failure(self):
        with patch.object(merger, "urlopen", side_effect=URLError("offline")) as opened:
            with self.assertRaises(merger.GitHubError):
                merger.api_request("token", "/test", payload={"sha": "reviewed"})
            self.assertEqual(opened.call_count, 1)

    def test_auth_failure_is_not_retried_or_printed_with_secrets(self):
        failure = HTTPError("https://api.github.com/test", 401, "SECRET", {}, None)
        with patch.object(merger, "urlopen", side_effect=failure) as opened:
            with self.assertRaises(merger.GitHubError) as caught:
                merger.api_request("token", "/test")
            self.assertEqual(opened.call_count, 1)
            self.assertNotIn("SECRET", str(caught.exception))


if __name__ == "__main__":
    unittest.main()
