# AI Coding Workflow & Prompt History

**IDE / AI Agent:** OpenAI Codex Desktop  
**Project:** Edspire – Frontend Technical Challenge  
**Reference Document:** `Edspire-Frontend-Technical-Challenge.pdf`

This document outlines the prompts and instructions used throughout the development process. It demonstrates how AI-assisted development was approached, including requirement analysis, implementation, quality assurance, debugging, and iterative refinement.

## 1. Requirement Analysis & Initial Implementation

**Initial Prompt:**

> In this folder, there's a PDF containing the technical challenge requirements. Read and analyze the document thoroughly, understand the expected functionality, and proceed with the implementation accordingly. This is an interview assessment, so make sure the solution aligns with the provided requirements.

**Objective:**

- Analyze the technical specification before implementation.
- Understand the expected application behavior and features.
- Use the provided PDF as the primary source of truth.
- Implement the required functionality while maintaining code quality.

## 2. Implementation Review & Quality Assurance

**QA Follow-up Prompt:**

> Review the entire implementation, including `README.md`, `PROMPT.md`, public API integrations, and all application functionality. Verify that everything specified in the technical challenge has been completed.
>
> Revisit the codebase, perform comprehensive testing, identify any missing functionality or potential issues, and use a dedicated QA subagent for an independent review.
>
> Continue addressing any findings until the QA subagent evaluates the implementation at 9/10 or higher.

**Objective:**

- Validate implementation against the original requirements.
- Review documentation and API integrations.
- Perform functional and regression testing.
- Obtain an independent QA assessment.

## 3. Bug Investigation & Iterative Refinement

**Bug Report and QA Iteration Prompt:**

> The following issues have been identified:
>
> - Users are unable to add places to their favorites.
> - The input field remains focused when it shouldn't.
> - Clicking elsewhere triggers an empty-input validation error, even when the user is not attempting to submit anything.
>
> Investigate these issues and include them in the QA review.
>
> Assign a dedicated QA subagent to conduct an exhaustive review of the application, covering UI components, visual consistency, individual interactions, edge cases, and end-to-end functionality.
>
> Have the QA subagent document all identified issues. Analyze its findings, prioritize the problems, and implement the necessary fixes.
>
> Once the fixes are complete, run the QA review again. Repeat the test-and-fix cycle until the implementation reaches a strict QA score of at least 9.5/10.

**Objective:**

- Investigate and resolve reported functional bugs.
- Validate UI behavior and interaction states.
- Identify edge cases through independent testing.
- Follow an iterative QA → Fix → Regression Testing workflow.

## 4. Supporting Documentation & Project Context

The development process also involved the supplied `Edspire-Frontend-Technical-Challenge.pdf`.

Implementation-specific decisions, API substitutions, and the browser notification limitation when the application tab is closed are documented separately in `README.md`.

---

**Development Approach:** AI-assisted implementation with requirement-driven development, structured debugging, independent QA reviews, and iterative refinement.
