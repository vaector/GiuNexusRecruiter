## Status: Accepted

## Context
All users share one authentication flow and one identity lifecycle.
Job seekers, recruiters, and admins need some different fields, but they still share the same core account data.
Splitting them into separate collections would duplicate identity logic and make references harder to manage.

## Decision
We keep one `User` collection and separate roles with discriminators.

## Consequences
It keeps auth simple, references clean, and avoids splitting identity across multiple collections.
The tradeoff is a wider `User` collection with some role-specific sparse fields.
