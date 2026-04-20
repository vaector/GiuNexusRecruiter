## Status: Accepted

## Context
Multiple students can apply to the same job at the same time.
Without concurrency protection, limited slots can be over-allocated.
We need a lightweight way to detect conflicts when a job changes during the application flow.

## Decision
We use optimistic concurrency on `JobPost` to protect limited job slots.

## Consequences
This helps prevent slot conflicts when multiple students apply at once.
It avoids heavy locking, but controllers still need to handle version conflicts cleanly.
