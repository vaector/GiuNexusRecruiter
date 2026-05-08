# ADR-006: Milestone-Compatible Rich Job Schema

## Status: Accepted

## Context

The Milestone 2 spec uses simple job fields such as:

```json
{
  "location": "Cairo",
  "salary": 5000
}
```

The implementation stores richer fields to support additional filtering and salary metadata:

```json
{
  "location": { "city": "Cairo", "country": "Egypt" },
  "salary": { "min": 5000, "currency": "EGP" }
}
```

## Decision

Keep the richer stored schema but normalize simple milestone-compatible request values in the job controller.

## Consequences

The API remains compatible with Milestone 2 demos and Postman examples while preserving richer internal data for additive features.

Controllers must continue accepting both simple and structured request shapes.
