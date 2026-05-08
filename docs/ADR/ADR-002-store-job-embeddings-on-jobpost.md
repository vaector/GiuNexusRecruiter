## Status: Accepted

## Context

Milestone 2 requires AI-ranked job recommendations. The sample spec computes embeddings for the student and all open jobs in one request. The implemented system also stores job embeddings when a job is created or materially updated.

Adding a vector database would add infrastructure that is unnecessary for the current project scale.

## Decision

Store job embeddings directly on `JobPost.embeddings` and compute the job seeker's embedding at recommendation time.

## Consequences

Recommendations avoid recomputing every job vector on each request, while still using the Hugging Face embedding model required by the milestone. The approach is simple and suitable for a small MongoDB-backed project.

If the dataset grows, the same embeddings can be migrated to a dedicated vector index.
