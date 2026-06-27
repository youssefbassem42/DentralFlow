# Sprint 2 Review — Patient Management

We have successfully implemented and verified **Sprint 2 — Patient Management** according to the Modular Monolith specifications.

---

## 🛠 Features Implemented in Sprint 2

### 1. Patient Profile & Fields Schema
- Implemented Patient CRUD mapping the full relational model: `fullName`, `gender`, `dateOfBirth`, `phone`, `email`, `address`, `bloodGroup`, `allergies`, `medicalHistory`, `notes`, and trackable metadata (`createdBy`, `createdAt`, `updatedAt`, `deletedAt`).

### 2. Search, Filters & Pagination
- **Fuzzy Search:** Filter patient records matching `fullName`, `phone`, or `email` queries.
- **Categorical Filters:** Filter search results by `gender` or `bloodGroup` parameters.
- **Offset Pagination:** Standardized request parsing returning page-offset results with total count, current page size, and total pages calculations.

### 3. Access Controls & Protection Guards
- Restricted registration and modification endpoints (`POST`, `PATCH`) to `ADMIN` and `RECEPTIONIST` roles.
- Allowed clinical lookup permissions (`GET /patients` and `GET /patients/:id`) to `ADMIN`, `DOCTOR`, and `RECEPTIONIST` roles.
- Guarded profile removal (`DELETE /patients/:id`) to `ADMIN` users only to prevent unauthorized data loss.

---

## 📂 Folder Layout Changes
We created the entire `patients` module inside `src/modules/patients/`:
```
src/modules/patients/
 ├── patients.controller.js  # Controller mapping HTTP requests
 ├── patients.service.js     # Duplicate checking & pagination logic
 ├── patients.repository.js  # Database search and pagination queries
 ├── patients.validator.js   # Zod body, query, and params schemas
 ├── patients.routes.js      # Endpoint security bindings with OpenAPI docs
 ├── patients.dto.js         # Patient profile output formatter
 └── patients.types.js       # JSDoc typings
```

---

## 🧪 Testing Coverage (36/36 Passing)
Added 13 new integration tests in `tests/patients.test.js` validating the full Patient API surface:
```bash
PASS tests/patients.test.js
PASS tests/users.test.js
PASS tests/auth.test.js
PASS tests/app.test.js
PASS tests/database.test.js
PASS tests/logger.test.js
PASS tests/env.test.js

Test Suites: 7 passed, 7 total
Tests:       36 passed, 36 total
Snapshots:   0 total
Time:        9.809 s
```

- **Verify Registration:** Check standard register (as receptionist) and duplicate phone checks (409 Conflict).
- **Verify List Capabilities:** Validate search, gender and bloodGroup filters, and check correct pagination metadata format.
- **Verify Deletion Logic:** Check receptionist is blocked from deletion (403), check admin can successfully soft-delete patients, and verify deleted patients are excluded from subsequent lookups.
