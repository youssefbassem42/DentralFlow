# Sprint 14 Completion: Settings Module

This sprint implements the **Clinic & User Settings Module** of the Dental Clinic Management System, giving clinic personnel the ability to update their credentials, toggle theme options, adjust slot calendars, and export/restore database seeds.

## 1. Features Implemented

### Settings Panel Layout
- Split column configuration with vertical sub-menu navigation tabs.
- Tab sections:
  - **My Profile**: Full Name, Email, and Phone fields with `react-hook-form` validation.
  - **Account Security**: Change user account password with secure matching validation.
  - **Clinic Profile**: Official clinic legal info, tax identifier code, phone, email, and address.
  - **Working Hours**: Interactive sliders adjusting appointment block slot durations (15m to 60m) and day-toggles setting clinic operating days.
  - **System Preferences**: Dynamic Light Mode and Dark Mode toggles alongside regional translation switchers.
  - **Database & Backups**: Generates and downloads SQL database script seeds and provides interactive SQL file upload backup restores.

### Reactive Context Synchronization
- Integrated state updating using a custom `updateUser` context method inside `AuthProvider` so that header information and initials update instantly upon profile changes.

---

## 2. Role-Based Access Control (RBAC)

- **Admin-Only Guards**: Modifying clinic profiles, adjusting appointment slot sizes, toggling operational days, and downloading/restoring database backups are protected functions. Non-admin users (DOCTOR, RECEPTIONIST) are presented with read-only states or hidden tabs (e.g. Database & Backups tab is completely hidden for non-admin accounts).

---

## 3. Integration & Codebase Changes

1. **`frontend/src/features/settings/types.ts`**: Configuration models for clinic profiles and database objects.
2. **`frontend/src/features/settings/api.ts`**: Hooks mapping user credential updates to `/users/:id`.
3. **`frontend/src/features/settings/SettingsPage.tsx`**: Tab views containing profile editors, password updates, theme controls, hour parameters, and database operators.
4. **`frontend/src/features/authentication/types.ts`**: Expanded `User` definition to support flexible ID typing and name/phone properties.
5. **`frontend/src/features/authentication/context.tsx`**: Added `updateUser` synchronization hook updating localStorage.

---

## 4. Verification & Testing

- **Backend Integration Tests**: All 105 test cases passed successfully.
- **Frontend Production Build**: Vite production build succeeded with clean typescript checks.
