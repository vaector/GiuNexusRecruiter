## Status: Accepted

## Context
We need embeddings for matching job seekers to job posts.
We could use a vector database, but that adds more infrastructure and sync work.
At this stage, the dataset is still small enough to keep the vectors with the source documents.

## Decision
We store embeddings directly on `JobSeeker` and `JobPost`.

## Consequences
It is simpler, cheaper, and enough for this stage without adding a vector database.
If search volume or dataset size grows later, we can move the same embeddings into a dedicated vector store.
