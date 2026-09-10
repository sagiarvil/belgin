---
name: claude-karpathy-discipline
description: Enforces Andrej Karpathy's 4 core LLM coding rules (Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution). Use on every coding task to prevent hallucination, out-of-scope edits, and over-engineering.
---

# Claude & Karpathy Surgical Discipline Protocol

## 1. Think Before Coding
- State assumptions explicitly before modifying any code. If uncertain, STOP and ask.
- Surface tradeoffs when multiple paths exist; never choose silently.
- Push back on over-complicated requests when a simpler approach exists.

## 2. Simplicity First (YAGNI)
- Produce the minimum code required to solve the problem. Nothing speculative.
- No single-use abstractions, helper classes, or unrequested configurability.
- If you wrote 200 lines and it could be 50, rewrite it.

## 3. Surgical Changes (Touch Only What You Must)
- Modify ONLY the specific lines in the target file required to fulfill the user's prompt.
- Do NOT "improve", reformat, or refactor adjacent comments, imports, or code that is not broken.
- Match existing formatting and code style, even if you would write it differently.
- Inverted Boy Scout Rule: Leave untouched code strictly untouched.
- Every changed line must trace directly to the user's request.

## 4. Goal-Driven Execution & Hard Stop
- Define verifiable success criteria. Loop until verified, then STOP immediately.
- Never output speculative suggestions or run unprompted background searches when done.
