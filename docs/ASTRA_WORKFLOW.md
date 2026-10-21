# Azure Astra planning workflow

Verified on 2026-10-08 with Codex CLI 0.162.0-alpha.2.

A single planning request completed with exit code 0. The CLI reported model `gpt-6-astra` and provider `azure-company` and returned the plan below. This verifies the configured Azure route accepted a request for that model; it does not independently inspect the Azure deployment configuration.

Use this flow for the next user-requested implementation. The connection trial only added this workflow document; no website feature was selected for the trial.

## Plan returned by Astra

1. Receive the Portfolio task and define its scope, acceptance criteria, and constraints. Read `AGENTS.md` and `PORTFOLIO_PLAN.md`; inspect the working tree to identify and preserve unrelated local changes.

2. Request a bounded Astra planning pass through Codex CLI:

   ```sh
   codex exec -p azure -m gpt-6-astra --sandbox read-only \
     'Plan only; do not modify files or spawn agents. Read AGENTS.md and PORTFOLIO_PLAN.md. For TASK: <insert task>, return at most 600 words covering architecture, affected files, implementation steps, risks, and verification. Preserve unrelated local changes and section 4 Blender mesh/camera, content, and Pinia contracts. Flag any required contract change. Use Vue Composition API and content/portfolio.ts for portfolio copy.'
   ```

   Keep `-p azure` explicit: the local wrapper stops auto-selecting Azure when model/config options are supplied. Confirm connection and model availability from CLI results, never prompt text.

3. Review Astra’s proposal against repository contracts and task scope. Resolve gaps and flag required contract changes before editing. Implement the reviewed plan locally using typed Vue Composition API components and established repository conventions.

4. For code changes, run lint, typecheck, unit tests, build, and Playwright when available. Check task-specific behavior and the final diff. Report changes, verification results, and any blockers.

## Execution notes

- Use `-p azure` explicitly on every planning invocation. The local launcher loads credentials from the existing local environment file; never print or commit them.
- Add `--ephemeral` to avoid persisting an extra CLI session and `-o /tmp/portfolio-astra-plan.md` to capture the returned plan for review. Use a unique output name if concurrent requests are necessary.
- Give Astra a bounded task and relevant context. It plans with a read-only sandbox; the implementation happens in the current workspace after reviewing that plan.
- The trial reported model-catalog refresh and unrelated Figma/Sentry OAuth warnings, plus ignored `personality` and `service_tier` settings under the Azure provider. They did not prevent the completed request. These global configuration and connector issues were not changed by this trial.
- For website code changes, complete the checks required by `AGENTS.md`; for this documentation-only flow trial, verify the CLI result and saved plan.

Codex custom provider and Azure setup reference: https://learn.chatgpt.com/docs/config-file/config-advanced
