## Status: Accepted

## Context
Dashboards need fast application counts for job seekers.
We could recalculate them from `Application` records every time, but that makes reads heavier and more complex.
These numbers are read often enough that simple, fast reads matter more than perfect normalization.

## Decision
We store important counters on `JobSeeker` and update them when application data changes.

## Consequences
This makes job seeker and admin dashboards faster and keeps reads simple.
The tradeoff is that write flows must keep the counters in sync.
