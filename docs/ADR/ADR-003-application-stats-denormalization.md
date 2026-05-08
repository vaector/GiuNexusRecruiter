## Status: Accepted

## Context

The base milestone requires application listing and admin aggregation. The implementation also stores job seeker application counters on `User.applicationStats` for quick profile/dashboard reads.

## Decision

Keep canonical application records in the `Application` collection and update selected counters on the job seeker's user document when applications are created, updated, or withdrawn.

## Consequences

Profile/dashboard reads can show application counts without re-aggregating every time.

The tradeoff is that application write paths must keep the counters in sync. Admin platform stats still use aggregation over the source collections.
