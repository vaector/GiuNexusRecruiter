## Status: Accepted

## Context

Milestone 2 requires one authentication flow for job seekers, recruiters, and admins. The current implementation shares most account data across roles: name, email, password, role, approval status, MFA fields, reset fields, saved jobs, and notification preferences.

Mongoose discriminators were considered, but the active runtime model uses one `User` schema with a `role` field. Role-specific behavior is enforced in controllers and route middleware.

## Decision

Use one `User` collection and distinguish job seekers, recruiters, and admins with the `role` field.

## Consequences

This keeps authentication, token loading, and references simple. It also matches the Milestone 2 requirement that admin accounts are created directly rather than self-registered.

The tradeoff is that the `User` schema contains some fields that only matter to one role. Controllers must keep role-specific behavior explicit.
