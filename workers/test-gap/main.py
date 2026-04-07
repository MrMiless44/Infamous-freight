import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from shared.config import Settings
from shared.github_client import GitHubClient
from shared.llm import LLMClient
from shared.models import TestGapResult
from shared.repo_tools import build_pr_context, classify_changed_files, format_bullets, is_test_file
from shared.utils import append_step_summary, write_json

MARKER = '<!-- ai-workers:test-gap -->'

INSTRUCTIONS = '''You are the Test Gap Worker for a software repository.
Return structured output only.

Goals:
- assess test coverage risk from the changed diff
- identify behavior likely left untested
- recommend where tests should be added
- propose concrete test cases
- optionally provide short draft test ideas, not full suites
'''


def render_comment(result):
    draft_block = '\n\n'.join(f"```\n{item}\n```" for item in result.draft_tests[:3])
    return f'''## Test Gap Worker

**Coverage risk:** `{result.coverage_risk}`

**Summary**
{result.summary}

**Untested areas**
{format_bullets(result.untested_areas)}

**Recommended test files**
{format_bullets(result.recommended_test_files)}

**Suggested test cases**
{format_bullets(result.test_cases)}

**Draft test stubs**
{draft_block if draft_block else 'None generated.'}
'''


def main():
    settings = Settings.from_env()
    gh = GitHubClient(settings)
    llm = LLMClient(settings)
    event = gh.load_event()

    pr_number = event['pull_request']['number']
    pr = gh.get_pull_request(pr_number)
    files = gh.list_pull_request_files(pr_number)
    file_counts = classify_changed_files(files)
    changed_tests = [item.get('filename', '') for item in files if is_test_file(item.get('filename', ''))]

    user_input = f'''Repository: {settings.github_repository}
PR number: {pr_number}
Title: {pr.get('title', '')}

Changed file counts:
{file_counts}

Changed test files:
{changed_tests}

Diff context:
{build_pr_context(files, settings.worker_max_pr_files, settings.worker_max_patch_chars)}
'''

    result = llm.parse(TestGapResult, INSTRUCTIONS, user_input)
    comment = render_comment(result)
    gh.upsert_issue_comment(pr_number, MARKER, comment)
    append_step_summary(comment)
    write_json(Path('artifacts') / f'test-gap-{pr_number}.json', result.model_dump())


if __name__ == '__main__':
    main()
