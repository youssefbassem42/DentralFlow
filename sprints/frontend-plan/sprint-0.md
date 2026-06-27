# DentralFlow MVP Implementation Roadmap (Backend + Frontend)

This roadmap is organized into **vertical feature sprints**. Each sprint delivers a complete slice of functionality: backend endpoints (already planned), frontend UI, role-based permissions, API integration, and testing. No sprint is considered complete until it passes its acceptance criteria.

---

# Role Permissions Matrix

| Feature              |     Admin    |        Doctor       |  Receptionist |
| -------------------- | :----------: | :-----------------: | :-----------: |
| Login                |       ✅      |          ✅          |       ✅       |
| Dashboard            |       ✅      |          ✅          |       ✅       |
| Manage Users         |       ✅      |          ❌          |       ❌       |
| Manage Doctors       |       ✅      |         Read        |      Read     |
| Manage Receptionists |       ✅      |         Read        |      Read     |
| Patient Management   |     Read     | Read/Update Medical | Create/Update |
| Appointments         |     Read     |  Read/Update Status |   Full CRUD   |
| Medical Examinations |       ❌      |      Full CRUD      |      Read     |
| Treatment Plans      |       ❌      |      Full CRUD      |      Read     |
| Treatments           |       ❌      |      Full CRUD      |      Read     |
| Payments             | Read Reports |     Create/View     |      Read     |
| Financial History    |     Read     |         View        |      Read     |
| Attachments          |     Read     |      Full CRUD      |      Read     |
| Warehouse            |     Read     |      Full CRUD      |      Read     |
| Reports              |     Full     |       Personal      |    Limited    |
| Clinic Settings      |     Full     |          ❌          |       ❌       |
| Audit Logs           |     Full     |          ❌          |       ❌       |

---

# Application Screens

## Authentication

### Login

**Endpoints**

* POST /auth/login

Buttons:

* Login
* Forgot Password

---

### Forgot Password *(future)*

---

### Unauthorized

---

### 404

---

### Session Expired

---

# Shared Layout

Sidebar

Top Navigation

Profile Menu

Notifications

Global Search

Dark Mode

Breadcrumbs

---

# Dashboard

## Admin Dashboard

Widgets

* Total Patients
* Doctors
* Receptionists
* Revenue
* Inventory
* Today's Appointments
* Recent Activity
* Revenue Chart
* Monthly Statistics
* Low Stock Alerts

Buttons

View Reports

View Patients

Manage Users

Inventory

Revenue Details

API

GET /reports/dashboard

---

## Doctor Dashboard

Widgets

Today's Patients

Appointments

Treatment Plans

Recent Examinations

Pending Payments

Inventory Alerts

Buttons

Start Examination

Create Treatment

Patient Details

Calendar

---

## Reception Dashboard

Widgets

Today's Schedule

New Patients

Appointments

Quick Registration

Buttons

Book Appointment

Register Patient

Search Patient

---

# Sprint 0

## Infrastructure

### UI

Loading

Skeletons

Error Pages

Toast System

Layout

Sidebar

Theme

Authentication Guard

Route Guard

Permission Guard

### Backend

Infrastructure

Swagger

JWT

RBAC

Docker

### Testing

Infrastructure Tests

Authentication Tests

Navigation Tests

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

