# Read This First

This is the entry point for all agents. Start here before touching code.

## Read Order
1. [CONTEXT.md](CONTEXT.md) - commands, repo map, conventions
2. [ARCHITECTURE.md](ARCHITECTURE.md) - system boundaries and data flow
3. [DECISIONS.md](DECISIONS.md) - ADR index and decision history
4. [rollout_plan.md](rollout_plan.md) - current execution plan

## What Each Doc Is For
- CONTEXT.md: operational working memory (commands, structure, conventions)
- ARCHITECTURE.md: canonical architecture and integrations
- DECISIONS.md: links to ADRs and decision notes
- DEPLOYMENT.md: platform options and step-by-step deploy instructions
- rollout_plan.md: milestone execution checklist

Do not read the archive unless explicitly instructed.

## Handoff Contract
- Goal: make focused, reviewable changes that move the current milestone.
- Constraints: follow CLAUDE.md; do not invent architecture details.
- Artifacts: update docs and ADRs when decisions change.

### Environment Configuration
The application uses Cloudinary for image uploads (e.g., in Ideas and Memories). Ensure the following environment variables are set in your `.env` file:
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

Without these, image upload functionality will fail silently or throw errors.
