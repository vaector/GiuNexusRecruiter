# ADR-001: Saved Search Poller Design

**Date:** 2026-05-08  
**Status:** Accepted  
**Author:** Amro
**Context:** GIU Nexus — Milestone 2 Additional Features

---

## Context

GIU Nexus allows job seekers to save searches with filter criteria (keywords, location, job type, category, salary, remote). When new jobs matching a saved search are posted, the user should be notified in-app.

The constraint is **no additional libraries** beyond what the milestone spec permits. Solutions like Bull, Agenda, or node-cron are off the table. The implementation must use only Node.js built-ins.

---

## Decision

Implement a polling service using `setInterval` that runs every **5 minutes**, processes saved searches in **batches of 50**, and groups searches by identical filter combinations to minimise database queries.

---

## Considered Alternatives

### Option A: Poll every search on every tick
Loop through all active saved searches on every `setInterval` tick and run one `JobPost` query per search.

**Rejected because:** O(n) DB queries where n = total active saved searches. At 1,000 users × 10 searches = 10,000 queries every 5 minutes. Does not scale.

### Option B: Group by filter hash (chosen)
Hash each search's filter object into a stable string key. Group searches by this key. Run one `JobPost` query per unique filter combination, then fan out notifications to all users in that group.

**Accepted because:** Reduces DB queries from O(n searches) to O(n unique filter combinations). In practice, many users save similar searches (e.g. `{ type: "internship", location: "Cairo" }`), so the reduction is significant.

### Option C: Event-driven (publish on job creation)
When a recruiter creates a job, immediately query all saved searches that match and notify users.

**Rejected because:** Requires either a message queue or synchronous processing inside `createJob`, which would block the response and couple job creation to notification logic.

---

## Implementation Details

### Filter Hashing
```js
const hashFilters = (filters) => {
  const sorted = Object.keys(filters)
    .filter(k => filters[k] !== null && filters[k] !== undefined && filters[k] !== '')
    .sort()
    .reduce((acc, k) => { acc[k] = filters[k]; return acc; }, {});
  return JSON.stringify(sorted);
};
```
Keys are sorted before stringifying to ensure `{ type, location }` and `{ location, type }` produce the same hash.

### Stale Threshold
Searches are only processed if `lastCheckedAt` is older than **15 minutes**, even though the interval fires every 5 minutes. This prevents a search from being processed 3 times in 15 minutes if the server restarts or the cycle overlaps.

### Earliest Check Cursor
Within a group, the **oldest** `lastCheckedAt` is used as the query cursor:
```js
const earliestCheck = groupSearches.reduce((earliest, s) => {
  if (!s.lastCheckedAt) return null;
  if (!earliest) return s.lastCheckedAt;
  return s.lastCheckedAt < earliest ? s.lastCheckedAt : earliest;
}, groupSearches[0].lastCheckedAt);
```
This ensures jobs created between the oldest and newest check time in the group are not missed.

### Notification Cap
A hard `limit(5)` is applied to matching jobs per group. This prevents notification spam when a large batch of matching jobs is posted simultaneously.

### Error Isolation
Each filter group has its own `try/catch`. A failure in one group does not affect the rest of the batch, and the outer cycle also has its own `try/catch` to prevent the `setInterval` from dying silently.

---

## Consequences

### Positive
- No additional dependencies
- DB query count reduced from O(searches) to O(unique filter combos)
- Stale threshold prevents redundant processing on server restarts
- Notification spam is bounded by the per-group job limit

### Negative
- `setInterval` is not persistent — if the server restarts mid-cycle, in-flight notifications are lost
- Grouping by earliest `lastCheckedAt` means users with a recently-checked search may receive notifications for jobs slightly older than their own last check
- No dead-letter queue for failed notifications — failures are logged but not retried

### Future Improvements
- Replace `setInterval` with a persistent job queue (Bull/BullMQ)
- Add a retry mechanism for failed notification sends
- Implement filter-index caching to avoid re-hashing on every cycle