# Sprint 1 Review — Authentication & User Management

We have successfully implemented and verified **Sprint 1 — Authentication & User Management** according to the Modular Monolith principles.

---

## 🛠 Features Implemented in Sprint 1

### 1. Unified User Architecture
- Extended the `User` model with database relations to `Doctor` and `Receptionist` tables.
- Implemented transaction-based nested creation and update logic:
  - When an admin creates a user with the `DOCTOR` role, Prisma creates a matching record in the `Doctor` table inside a secure, atomic transaction.
  - When a user's role is `RECEPTIONIST`, the matching `Receptionist` shift details are created atomically.

### 2. Authentication & Session Control
- Fully functional `POST /auth/login` validating inputs against Zod schemas, verifying bcrypt hashes, and returning signed bearer JWT tokens.

### 3. Role-Based Access Control (RBAC) & Safety Gates
- Protected critical management endpoints behind `authenticate` and `authorize('ADMIN')` middlewares.
- Added a `selfOrAdmin` guard that permits users to read or edit only their own profile if they are not an `ADMIN`.
- Implemented delete protections in `users.service.js`:
  - A user is blocked with `400 Bad Request` from deleting their own active profile.
  - The default system administrator profile (`admin@dcms.com`) is protected from deletion.

---

## 📂 Code Layout Changes
We created the entire `users` module inside `src/modules/users/`:
```
src/modules/users/
 ├── users.controller.js  # Express handlers
 ├── users.service.js     # Duplicate and safety gate business logic
 ├── users.repository.js  # Transaction-wrapped database queries
 ├── users.validator.js   # Input validators (Zod)
 ├── users.routes.js      # Route bindings with selfOrAdmin middleware
 ├── users.dto.js         # Sanitizers filtering sensitive data (e.g. passwords)
 └── users.types.js       # JSDoc typings
```

---

## 🧪 Testing Coverage (23/23 Passing)
Added 11 new integration tests in `tests/users.test.js` validating the full API surface:
```bash
PASS tests/users.test.js
PASS tests/auth.test.js
PASS tests/app.test.js
PASS tests/database.test.js
PASS tests/logger.test.js
PASS tests/env.test.js

Test Suites: 6 passed, 6 total
Tests:       23 passed, 23 total
Snapshots:   0 total
Time:        6.967 s
```

- **Verify Login Flows:** Login with valid/invalid credentials, password verification.
- **Verify Admin Creation Rules:** Creating doctors and receptionists, saving specialized parameters (specialization, license, shift).
- **Verify Access Gates:** Ensure non-admin users cannot list all profiles, and can only fetch/modify their own profile.
- **Verify Delete Rules:** Blocking self-deletions and admin-account deletions, checking that a soft-deleted user is flagged as `INACTIVE` and omitted from lookups.
