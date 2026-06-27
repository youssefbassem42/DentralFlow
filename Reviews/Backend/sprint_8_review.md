# Sprint 8 Review — File Attachments

We have successfully implemented and verified **Sprint 8 — File Attachments** according to the specifications.

---

## 🛠 Features Implemented in Sprint 8

### 1. Multer Disk Storage Middleware
- Created `src/common/middleware/upload.js` which configures Multer to store uploaded patient attachments locally within `/uploads/attachments/`.
- Enforced a **10MB file size limit** and validated allowed extensions (`.jpeg`, `.jpg`, `.png`, `.gif`, `.pdf`, `.doc`, `.docx`, `.txt`, `.zip`).

### 2. Upload, List, Download & Delete APIs
- **POST `/attachments`**:
  - Handles multipart form-data.
  - Automatically resolves doctor identity if uploaded by a doctor, or checks input for admins.
  - Validates `fileType` enum (`X_Ray`, `Prescription`, `Images`).
- **GET `/attachments`**:
  - Lists all files with pagination (`page`, `limit`) and filtering by `doctorId` or `fileType`.
- **GET `/attachments/:id`**:
  - Returns metadata details of a specific attachment.
- **GET `/attachments/:id/download`**:
  - Streams/downloads the physical file from local disk.
- **DELETE `/attachments/:id`**:
  - Performs soft-delete in PostgreSQL (`deletedAt`) and unlinks/deletes the physical file on local storage to release disk space.

### 3. Role-Based Access Controls
- Authorized `DOCTOR` and `ADMIN` roles to upload (`POST`) and delete (`DELETE`) attachments.
- Authorized all authenticated staff (`ADMIN`, `DOCTOR`, `RECEPTIONIST`) to list, view metadata, and download files.

---

## 📂 Folder Layout
```
src/modules/attachments/
 ├── attachments.controller.js  # Controller handlers for files
 ├── attachments.service.js     # Manages business logic and file system unlink
 ├── attachments.repository.js  # Handles queries and soft delete fields
 ├── attachments.validator.js   # Zod body validation schemas
 ├── attachments.routes.js      # Protect endpoints using authenticate, authorize, and upload middlewares
 ├── attachments.dto.js         # Formats fields and nests doctor attributes
 └── attachments.types.js       # JSDoc typings
```

---

## 🧪 Testing Coverage (90/90 Passing)
Added 9 new integration tests in `tests/attachments.test.js` validating the file attachments module:
```bash
PASS tests/attachments.test.js
PASS tests/payments.test.js
PASS tests/treatments.test.js
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

Test Suites: 13 passed, 13 total
Tests:       90 passed, 90 total
Snapshots:   0 total
Time:        41.483 s
```
- **File Upload:** Uploaded binary mock files using supertest `attach` hooks.
- **Extension Safety:** Prohibited dangerous extensions (like `.exe`) returning 400 Bad Request.
- **Download Streams:** Verified that downloading files serves exact matched binary mock content.
- **Access Gates:** Ensured receptionists cannot upload files (403).
- **Physical Cleanups:** Ensured deleting attachments unlinks the physical local storage file.
