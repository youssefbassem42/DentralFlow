# Sprint 5 Review — Treatment Planning

We have successfully implemented and verified **Sprint 5 — Treatment Planning** according to specifications.

---

## 🛠 Features Implemented in Sprint 5

### 1. Treatment Plans CRUD
- Implemented core props: `title`, `description`, `estimatedCost`, `estimatedSessions`, and `status`.
- Mapped database-backed relations referencing Patient and Doctor profiles.

### 2. Treatment Status Enums
- Enforced standard enum checks aligned with database schemas (`Pending`, `InProgress`, `Completed`, `Cancelled`).

### 3. Estimated Cost & Sessions Parsing
- Converted Decimal numbers to native floats within the DTO, supporting proper mathematical serialization across REST outputs.
- Bound validation rules requiring estimated sessions to be positive integers.

### 4. RBAC Gates
- Restriced plan creations and patches to `DOCTOR` and `ADMIN` roles.
- Allowed `RECEPTIONIST` users to list and query treatment plans (read-only) for quick billing checks.

---

## 📂 Folder Layout
```
src/modules/treatment-plans/
 ├── plans.controller.js  # Request/response controllers
 ├── plans.service.js     # Validates existences and resolves doctors
 ├── plans.repository.js  # Queries database tables and loads relations
 ├── plans.validator.js   # Zod body validation schemas (enforces InProgress enum values)
 ├── plans.routes.js      # Protect endpoints using authenticate and authorize gates
 ├── plans.dto.js         # Sanitizes and casts Decimal costs to Number
 └── plans.types.js       # JSDoc typings
```

---

## 🧪 Testing Coverage (63/63 Passing)
Added 8 new integration tests in `tests/plans.test.js` validating the treatment plans endpoints:
```bash
PASS tests/plans.test.js
PASS tests/examinations.test.js
PASS tests/appointments.test.js
PASS tests/patients.test.js
PASS tests/users.test.js
PASS tests/auth.test.js
PASS tests/app.test.js
PASS tests/database.test.js
PASS tests/logger.test.js
PASS tests/env.test.js

Test Suites: 10 passed, 10 total
Tests:       63 passed, 63 total
Snapshots:   0 total
Time:        26.252 s
```
- **Proposals:** Verified that doctors can successfully propose plans, validating status defaults to `Pending`.
- **RBAC Bounds:** Enforced that receptionists are rejected (403) from proposing or updating plans, but are allowed to query plans.
- **Updates:** Verified that doctors can update plan statuses (e.g. to `InProgress`) and adjust estimated costs.
- **Relational Integrity:** Implemented deep cleanup inside `afterAll` to delete treatment plans by patient ID, preventing foreign key exceptions during test suite tears down.
