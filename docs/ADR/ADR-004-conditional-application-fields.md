## Status: Accepted

## Context
Not every job needs the same application fields.
Some require a CV or cover letter, and some do not.
The frontend and backend both need one clear source of truth for those rules.

## Decision
Each job post stores whether a CV or cover letter is required.

## Consequences
That keeps the rules in one place and makes both the frontend and backend easier to manage.
Applications can leave optional file fields empty when the job does not require them.
