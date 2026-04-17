# Repository agent instructions

This repository uses OpenSpec for specification-driven changes.

Primary OpenSpec project files live under `openspec/`:

- `openspec/AGENTS.md`
- `openspec/config.yaml`
- `openspec/specs/`
- `openspec/changes/`
- `openspec/archive/`

When working in this repository, treat `openspec/AGENTS.md` as the authoritative OpenSpec workflow and authoring guide.

## Scope

- Repository root contains helper scripts and investigation artifacts.
- The primary product lives in `private-chef/`.
- Specs should primarily target the `private-chef/frontend` and `private-chef/backend` modules.

## OpenSpec baseline specs

- `openspec/specs/frontend/spec.md`
- `openspec/specs/backend/spec.md`
- `openspec/specs/shared/spec.md`

## Change workflow

For new feature or behavior changes, create artifacts under:

```text
openspec/changes/<change-name>/
```

Use kebab-case for `<change-name>` and follow the templates/rules in `openspec/AGENTS.md`.
