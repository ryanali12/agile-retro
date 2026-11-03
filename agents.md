# AGENTS.md

## Overview

This file provides general instructions and conventions for AI coding agents working in this repository.

The repository is the source of truth for its architecture, technology stack, implementation patterns, and development conventions.

Agents must inspect the existing codebase before making assumptions or introducing changes.

---

## General Principles

- Read and understand the existing code before making changes.
- Follow established project conventions and architectural decisions.
- Keep changes focused on the requested task.
- Do not modify unrelated files.
- Prefer simple, maintainable solutions over unnecessary abstractions.
- Avoid introducing new dependencies unless necessary.
- Do not remove existing functionality unless explicitly requested.
- Reuse existing components, utilities, services, and patterns where appropriate.
- Avoid duplicating existing implementations.
- Do not introduce architectural patterns that conflict with the existing codebase.
- Consider security, performance, maintainability, and reliability when implementing features.
- When uncertain about a convention, inspect surrounding code and follow established patterns.

## Security

Security must be considered when creating or modifying any feature.

- Treat backend or server-side code as the authoritative security boundary.
- Never rely exclusively on client-side validation, route guards, or permission checks for security.
- Validate and sanitize incoming data before trusting it.
- Enforce authentication and authorization on protected operations.
- Never trust identity, permissions, or authorization information supplied directly by clients.
- Protect sensitive data and avoid unnecessary exposure of internal implementation details.
- Never expose stack traces, credentials, database details, or secrets in API responses.
- Never commit passwords, API keys, tokens, private certificates, or other sensitive credentials.
- Follow the repository's existing security and authentication conventions.
- Consider potential security implications when introducing new endpoints, mutations, integrations, or rendered content.

## Repository Structure

- Inspect the actual repository structure before assuming paths exist.
- Follow the existing organization of source code and project files.
- Keep feature-specific implementations close to the feature they support.
- Extract shared functionality only when it is genuinely reusable.
- Avoid reorganizing unrelated parts of the repository.

## Architecture and Design

- Follow the architecture already established by the project.
- Organize code around the project's existing architectural boundaries.
- Keep responsibilities clear and avoid unnecessary coupling.
- Prefer explicit contracts at system boundaries.
- Avoid introducing unnecessary layers, abstractions, or design patterns.
- Do not introduce generic repositories, service layers, factories, or other abstractions without a concrete requirement.
- Keep business logic separate from infrastructure and presentation concerns where appropriate.
- Prefer modifying existing implementations over creating parallel implementations.

## Code Quality

- Use meaningful and descriptive names.
- Avoid vague variable and method names when their purpose is known.
- Prefer explicit types and well-defined contracts.
- Avoid unsafe type conversions and unnecessary use of loosely typed values.
- Handle nullability and optional values intentionally.
- Keep methods and functions focused on a single responsibility.
- Avoid unnecessary complexity and premature optimization.
- Follow the existing formatting, naming, and coding conventions.
- Use modern language and framework features when they improve clarity and are compatible with the project.
- Do not perform broad formatting changes unrelated to the task.

## Validation and Input Handling

- Validate external input at appropriate system boundaries.
- Follow the project's existing validation framework and conventions.
- Distinguish between input validation, business rules, and authorization.
- Client-side validation should primarily improve user experience.
- Server-side validation must remain authoritative.
- Avoid duplicating complex business validation logic across multiple layers unless necessary.
- Return appropriate and consistent validation errors.

## Data Access and Persistence

- Follow existing database access and persistence conventions.
- Avoid unnecessary database queries and data loading.
- Retrieve only the data required by the operation.
- Be aware of inefficient queries, N+1 problems, and unnecessary round trips.
- Use transactions when multiple operations must succeed or fail together.
- Follow existing entity modeling, schema mapping, and migration conventions.
- Do not manually modify production database schemas unless explicitly required.
- Consider data consistency, concurrency, and integrity when modifying persistence logic.
- Avoid introducing abstractions that merely wrap existing data access mechanisms without providing meaningful value.

## API and System Boundaries

When working with APIs, integrations, or other system boundaries:

- Use appropriate request and response contracts.
- Follow existing HTTP methods, status codes, and response conventions.
- Validate incoming requests.
- Avoid exposing internal entities or implementation details unnecessarily.
- Keep response models focused on consumer requirements.
- Handle errors consistently.
- Do not expose sensitive information through responses, logs, or error messages.
- Consider authentication, authorization, rate limiting, and input handling where applicable.
- Maintain backward compatibility unless a breaking change is explicitly requested.

## Authentication and Authorization

Authentication and authorization are separate concerns.

- Authentication establishes the identity of a user or system.
- Authorization determines what that identity is allowed to do.
- Enforce authorization on the server or trusted execution boundary.
- Never treat frontend permission checks as security controls.
- Validate identity credentials and tokens according to the configured authentication mechanism.
- Keep tokens and claims minimal.
- Avoid placing sensitive information in tokens.
- Use roles, permissions, scopes, or policies according to the existing authorization model.
- Ensure authorization decisions are based on trusted server-side information.

## Configuration and Secrets

- Follow the repository's existing configuration mechanism.
- Keep environment-specific configuration outside source code when appropriate.
- Use environment variables, secret managers, secure configuration providers, or equivalent mechanisms.
- Never hard-code credentials or production secrets.
- Do not commit local environment files containing sensitive information.
- Avoid logging secrets or sensitive configuration values.
- Ensure new configuration settings have sensible defaults or documented requirements.

## Error Handling and Logging

- Follow the project's existing error-handling mechanism.
- Catch exceptions only when they can be meaningfully handled.
- Avoid unnecessary or repetitive try/catch blocks.
- Do not silently swallow exceptions.
- Return appropriate and consistent errors at system boundaries.
- Avoid exposing internal implementation details to external consumers.
- Use structured and meaningful logging where supported.
- Do not log credentials, tokens, or sensitive personal information.
- Preserve enough diagnostic information for troubleshooting without compromising security.

## Performance and Reliability

- Avoid unnecessary work, allocations, queries, and network requests.
- Consider the performance implications of changes.
- Avoid blocking operations when asynchronous alternatives are appropriate.
- Handle timeouts, retries, and transient failures according to existing project conventions.
- Consider concurrency and race conditions when modifying shared state.
- Avoid premature optimization; measure or identify a concrete bottleneck before introducing complexity.
- Ensure new functionality behaves predictably under expected failure conditions.

## Testing

Before considering a change complete:

1. Build or compile the affected projects.
2. Run relevant unit tests.
3. Run integration tests when system boundaries or infrastructure behavior are affected.
4. Run relevant component or end-to-end tests when applicable.
5. Run linting, formatting, and static analysis checks when available.
6. Add or update tests for new behavior and regression fixes.
7. Review the changes to ensure existing behavior has not been unintentionally affected.

### Testing Principles

- Follow the existing testing framework and test organization.
- Prefer testing observable behavior rather than implementation details.
- Test important business rules and edge cases.
- Include authorization and security scenarios when relevant.
- Keep tests independent and deterministic.
- Avoid modifying tests simply to make them pass unless the expected behavior has intentionally changed.
- Do not introduce unnecessary test dependencies or infrastructure.
- Use existing test fixtures, utilities, and conventions.

## Dependencies

Before introducing a dependency:

1. Check whether the repository already has an equivalent library.
2. Determine whether the functionality can reasonably be implemented without another dependency.
3. Prefer established and actively maintained packages.
4. Follow existing dependency version conventions.
5. Explain why the dependency is necessary.

Do not add dependencies for trivial functionality.

## Git and Change Management

Keep changes focused and reviewable.

Do not:

- Rewrite Git history.
- Force-push.
- Delete branches.
- Modify unrelated files.

Unless explicitly instructed.

Before committing changes:

- Review the complete diff.
- Check for accidental modifications.
- Check for secrets and sensitive information.
- Ensure generated files are not unintentionally included.
- Verify that relevant tests and checks have been executed.

Do not create commits unless explicitly requested.

## Agent Workflow

For every task, follow this workflow.

### 1. Understand

Inspect the relevant files and understand the existing implementation.

Look for:

- Existing implementations.
- Similar features.
- Existing components and utilities.
- Established architectural patterns.
- Validation and authorization mechanisms.
- Existing tests.
- Configuration and infrastructure dependencies.

Do not immediately create new files or abstractions.

### 2. Plan

Identify:

- What needs to change.
- Which existing implementations can be reused.
- Which files are affected.
- Potential side effects.
- Security implications.
- Tests and checks required.

For larger changes, briefly communicate the intended approach before implementation.

### 3. Implement

- Make the smallest reasonable change that solves the requested problem.
- Follow established conventions.
- Reuse existing implementations where appropriate.
- Avoid unnecessary abstractions and dependencies.
- Keep unrelated functionality untouched.

### 4. Verify

Run the appropriate build, test, and validation commands.

Use commands and scripts defined by the actual repository rather than assuming a particular technology stack.

Do not claim that tests or checks passed unless they were actually executed successfully.

If a check cannot be executed, clearly state why.

### 5. Review

Before finishing, verify:

- The requested behavior is implemented.
- Existing behavior was not unnecessarily changed.
- No unrelated files were modified.
- No unnecessary dependencies were introduced.
- Security implications were considered.
- Relevant tests and checks passed.
- The implementation follows existing project conventions.

## Communication

When reporting completed work:

- Summarize what changed.
- Identify the important files affected.
- Explain relevant implementation decisions.
- Report tests and checks performed.
- Clearly disclose failed or skipped checks.
- Mention known limitations or potential follow-up work.
- Be concise, accurate, and transparent.

Do not claim functionality was implemented, tested, or verified when it was not.

---

## Important

The existing repository is the source of truth for conventions that are not explicitly defined in this document.

When these instructions conflict with explicit user instructions, follow the user's instructions unless doing so would violate higher-priority system, security, or repository constraints.

**Do not invent architecture.**

**Inspect first. Understand the existing implementation. Make focused changes. Verify before finishing.**
