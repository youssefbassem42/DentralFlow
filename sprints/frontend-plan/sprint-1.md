# Sprint 1

## Authentication

### Screens

Login

Unauthorized

Expired Session

Profile Menu

### Buttons

Login

Logout

Remember Me

### Backend

POST /auth/login

### Tests

Login

JWT

Protected Routes

RBAC

---

# QA & Production Readiness

## UI Review

* Verify every screen from Stitch is implemented.
* Confirm responsive behavior (desktop, tablet, mobile).
* Check dark mode and accessibility.

## API Verification

* Every UI action maps to the correct backend endpoint.
* Validate request payloads and response handling.
* Ensure loading, success, empty, and error states are present.

## Automated Testing

* Unit tests (Vitest + React Testing Library).
* Integration tests (React Query + API interactions).
* End-to-end tests (Playwright) covering all major workflows.

## Acceptance Checklist

A sprint is marked **DONE** only when:

* ✅ All planned screens for the sprint are implemented.
* ✅ All buttons and UI actions are functional.
* ✅ Every backend endpoint is integrated and verified.
* ✅ Role-based access behaves correctly:
  * ✅ Admin
  * ✅ Doctor
  * ✅ Receptionist
* ✅ Form validation works.
* ✅ Loading, empty, and error states are implemented.
* ✅ Responsive layouts pass manual review.
* ✅ Unit tests pass.
* ✅ Integration tests pass.
* ✅ E2E tests pass.
* ✅ No TypeScript, ESLint, or build errors.
* ✅ Documentation and API mappings are updated.

This plan keeps backend capabilities, frontend implementation, and testing synchronized, ensuring each sprint delivers a complete, deployable feature rather than isolated technical tasks.

