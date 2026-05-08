# ADR-007: Additive Features Boundary

## Status: Accepted

## Context

The codebase includes features beyond Milestone 2: notifications, audit logs, request logs, saved searches, reports, documents, messaging, referrals, screening questions, and deadline auto-close.

The milestone requirements must still work with the original expected request shapes and business rules.

## Decision

Treat non-spec features as additive. They may add optional fields, extra routes, and side effects, but they must not make Milestone 2 required flows harder to demonstrate.

## Consequences

Examples:

- CV requirements default to off.
- Simple `location` and `salary` request bodies are normalized.
- Additional routes are documented separately in Postman and README.
- Notifications/audit logs are side effects and should not block the main required write when possible.

This keeps the project extensible without compromising the grading surface.
