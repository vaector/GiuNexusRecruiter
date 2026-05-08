## Status: Accepted

## Context

Milestone 2 only requires an optional `coverLetter` when applying. The implementation adds optional richer job requirements such as CV requirements, cover-letter requirements, and screening questions.

These additions must not break the Milestone 2 apply flow.

## Decision

Store optional application requirements on `JobPost`, with `requiresCv` defaulting to `false` and `requiresCoverLetter` defaulting to `false`.

## Consequences

Milestone 2 jobs can be applied to with only the required base fields. Recruiters can opt into stricter requirements for richer flows.

Controllers enforce the extra requirements only when the job explicitly enables them.
