# ADR-005: Saved Search Poller

## Status: Accepted

## Context

Saved searches are an additional feature outside Milestone 2. Job seekers can save filters and receive in-app notifications when matching jobs are posted.

The project avoids extra queue/scheduler dependencies for this milestone.

## Decision

Use an in-process `setInterval` poller started from `server.js`.

The poller:

- processes active saved searches in batches
- groups equivalent filters to reduce duplicate job queries
- checks for jobs newer than the saved search cursor
- sends bounded in-app notifications

## Consequences

This keeps the feature dependency-free and easy to run locally.

The tradeoff is that the scheduler is not persistent. If the Node process restarts mid-cycle, in-flight work is lost. A production version should move this to a durable queue or scheduled worker.
