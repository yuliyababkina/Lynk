---
name: test-builder
description: "Use when creating, extending, or maintaining tests. Triggers: requests to add tests, improve coverage, validate changed behavior, or set up repeatable test workflows."
metadata:
  author: lynk
  version: "0.1.0"
---

# Test Builder

## Scope

When invoked, choose the smallest useful test scope and state it explicitly:
- unit tests for isolated logic
- integration tests for multi-module behavior
- end-to-end tests only when user flows cannot be validated otherwise

Default to unit tests first, then expand only if risk remains.

## Inputs

Collect these inputs before writing tests:
1. feature or bug statement
2. changed files and impacted modules
3. acceptance criteria and edge cases

If any input is missing, ask for it or infer from code and call out assumptions.

## Outputs

Produce:
1. test files that validate expected behavior and edge cases
2. a short checklist of covered scenarios
3. exact commands to run the tests

## Guardrails

- Do not edit production code unless explicitly asked.
- Keep tests deterministic (no timing races, random behavior, or remote dependencies).
- Prefer stable assertions over snapshot-heavy tests.
- Reuse existing test patterns and helpers in the repository.

## Validation workflow

Run and report these commands in order:
1. targeted tests for changed area (`npm run test:unit`)
2. broader suite when needed (`npm run test:storybook`)
3. type checks/lint if requested or required by task (`npm run lint`)

When a command fails, include failure cause and the smallest next fix.

## CI trigger

Use `.github/workflows/test-builder-agent.yml` to run validation on pull requests and manual dispatch.

## Pilot module

Use `src/lib/ticket-actions.test.ts` as the baseline unit-test example for new changes.
