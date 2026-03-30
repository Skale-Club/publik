---
phase: 1
slug: foundation-book-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (Wave 0 installs) |
| **Quick run command** | `pnpm test -- --run` |
| **Full suite command** | `pnpm test -- --run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test -- --run`
- **After every plan wave:** Run `pnpm test -- --run --coverage`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | UX-01, BOOK-01 | unit | `pnpm test -- --run` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | BOOK-04, BOOK-05, BOOK-06 | unit | `pnpm test -- --run` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | BOOK-04, BOOK-05, BOOK-06 | unit | `pnpm test -- --run` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | BOOK-01, BOOK-02, BOOK-03 | unit | `pnpm test -- --run` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 2 | BOOK-01, BOOK-02, BOOK-03 | unit | `pnpm test -- --run` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 3 | UX-01, BOOK-01, BOOK-02, BOOK-03 | unit + e2e | `pnpm test -- --run` | ❌ W0 | ⬜ pending |
| 01-05-01 | 05 | 3 | BOOK-04, BOOK-05, BOOK-06, UX-03 | unit + e2e | `pnpm test -- --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — test framework configuration
- [ ] `src/__tests__/setup.ts` — shared test utilities
- [ ] `pnpm add -D vitest @testing-library/react @testing-library/jest-dom` — test dependencies

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dashboard renders book list | UX-01 | Visual layout check | Open /dashboard, verify book cards render |
| UI text is in English | UX-03 | Visual/linguistic check | Navigate all pages, confirm no Portuguese text |
| Book settings form dropdowns work | BOOK-04, BOOK-05, BOOK-06 | Interactive UI | Open book settings, select trim/paper/ink/finish options |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
