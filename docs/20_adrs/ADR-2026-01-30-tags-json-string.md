# 2026-01-30 - Tags Stored as JSON String

## Context
The app supports tags on ideas and events. We need a consistent storage format across DB and app helpers.

## Decision
Store tags as a JSON-encoded string in the database and normalize/parse via helper utilities.

## Consequences
- Works with the existing schema without array column support.
- Requires helpers for parsing/normalizing and adds validation responsibilities.
- Querying tags at the DB level is limited and may need refactoring later.

## Alternatives considered
- Native array types (not supported consistently across environments).
- Separate Tag table with join table (more complexity for MVP).
