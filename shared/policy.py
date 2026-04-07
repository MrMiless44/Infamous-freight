from dataclasses import dataclass

@dataclass(frozen=True)
class WorkerPolicy:
    allow_issue_labels: bool
    allow_draft_release: bool
    allow_write_actions: bool
