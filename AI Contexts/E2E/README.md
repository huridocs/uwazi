# Uwazi E2E Revamp Foundation

This folder is the presentation-ready baseline for revamping Uwazi e2e tests. The objective is to cut execution cost and flakiness while preserving confidence in core frontend-backend contracts.

## Document set

1. `01-uwazi-functional-context.md`
  Deep functional context: sections, workflows, authorization, feature flags, async/socket behavior.
2. `02-current-e2e-coverage.md`
  Current state: Cypress and Puppeteer inventory, CI topology, and risk pressure points.
3. `03-pruning-proposal-contract-tests.md`
  Proposed pruning strategy: contract-first target suite, de-snapshot rules, keep/merge/retire classification.

## Suggested team walkthrough (30-45 min)

1. Align on product contracts that must always be protected.
2. Validate current test overlap and flake-heavy areas.
3. Review keep/merge/retire proposal and adjust by risk appetite.
4. Approve phase-2 implementation scope.

## Decision outputs expected from this foundation

1. Final list of retained contract e2e scenarios.
2. Agreement on snapshot minimization policy.
3. Migration order for trimming Cypress/Puppeteer suites.
4. CI lane strategy for heavy async/external-service tests.