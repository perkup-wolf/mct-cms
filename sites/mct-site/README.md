# mct-site

This is a real, deployable emdash CMS + website project, not a template or example. It was scaffolded as a copy of `templates/starter-cloudflare`, so its structure and tooling match the starter, but it is meant to evolve independently as the actual MCT site. Its dependencies stay on `workspace:*` links to this repo's in-development emdash packages rather than the published npm versions, so fixes and changes made elsewhere in this repo apply here immediately without a release cycle. It is unrelated to `control-panel/`, which is a separate, multi-tenant control-panel effort for managing many client sites -- `sites/mct-site` is a single, specific site.

For the full rationale behind this project's existence and structure, see the spec and plan:

- [`docs/superpowers/specs/2026-07-09-mct-site-single-project-design.md`](../../docs/superpowers/specs/2026-07-09-mct-site-single-project-design.md)
- [`docs/superpowers/plans/2026-07-09-mct-site-single-project.md`](../../docs/superpowers/plans/2026-07-09-mct-site-single-project.md)

For day-to-day usage (commands, schema, key files), see `AGENTS.md`.
