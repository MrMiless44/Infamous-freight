import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from shared.config import Settings
from shared.github_client import GitHubClient
from shared.llm import LLMClient
from shared.models import IssueTriageResult
from shared.policy import WorkerPolicy
from shared.repo_tools import build_issue_keywords, format_bullets
from shared.utils import append_step_summary, write_json

MARKER = '<!-- ai-workers:issue-triage -->'

INSTRUCTIONS = '''You are the Issue Triage Worker for a software repository.
Return structured output only.

Goals:
- summarize the issue in one short paragraph
- assign severity based on operational or product risk
- recommend practical repo labels
- identify the likely area or subsystem
- guess the likely owner from the area if possible; otherwise return unassigned
- point out likely duplicates only when similarity is meaningful
- propose next concrete actions for a human maintainer
'''


def render_comment(result, apply_labels):
    duplicate_lines = [f"- #{item.number} — {item.title} ({item.reason})" for item in result.duplicate_of]
    labels_line = ', '.join(result.labels) if result.labels else 'None'
    return f'''## Issue Triage Worker

**Severity:** `{result.severity}`

**Area:** {result.area}

**Likely owner:** {result.likely_owner}

**Recommended labels:** {labels_line}

**Summary**
{result.summary}

**Possible duplicates**
{chr(10).join(duplicate_lines) if duplicate_lines else '- None identified with enough confidence.'}

**Next actions**
{format_bullets(result.next_actions)}

_Label application is {'enabled' if apply_labels else 'disabled'} in current policy._
'''


def main():
    settings = Settings.from_env()
    gh = GitHubClient(settings)
    llm = LLMClient(settings)
    event = gh.load_event()
    policy = WorkerPolicy(settings.enable_issue_labels, settings.enable_draft_release, settings.enable_issue_labels or settings.enable_draft_release)

    issue = event['issue']
    issue_number = issue['number']
    title = issue.get('title', '')
    body = issue.get('body', '') or ''
    keywords = build_issue_keywords(title)

    exact_candidates = gh.search_issues(f'repo:{settings.github_repository} is:issue "{title}" in:title', per_page=5)
    keyword_candidates = gh.search_issues(f'repo:{settings.github_repository} is:issue {keywords}', per_page=5) if keywords else []

    seen_numbers = {issue_number}
    candidates = []
    for item in exact_candidates + keyword_candidates:
        number = item.get('number')
        if number in seen_numbers:
            continue
        seen_numbers.add(number)
        candidates.append({'number': number, 'title': item.get('title', ''), 'state': item.get('state', 'open'), 'url': item.get('html_url', ''), 'body': (item.get('body', '') or '')[:900]})

    user_input = f'''Repository: {settings.github_repository}
Issue number: {issue_number}
Issue title: {title}
Issue body:
{body[:8000]}

Potential similar issues:
{json.dumps(candidates[:8], indent=2)}
'''

    result = llm.parse(IssueTriageResult, INSTRUCTIONS, user_input)
    comment = render_comment(result, settings.enable_issue_labels)
    gh.upsert_issue_comment(issue_number, MARKER, comment)
    if policy.allow_issue_labels and result.labels:
        gh.add_labels(issue_number, result.labels)
    append_step_summary(comment)
    write_json(Path('artifacts') / f'issue-triage-{issue_number}.json', result.model_dump())


if __name__ == '__main__':
    main()
