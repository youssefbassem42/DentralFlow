# Sprint 9 Review — Warehouse & Inventory Management

We have successfully implemented and verified **Sprint 9 — Warehouse & Inventory Management** according to the specifications.

---

## 🛠 Features Implemented in Sprint 9

### 1. Stock CRUD & Database Schemas
- Created endpoints for managing physical assets using `InventoryItem` model.
- Managed fields: `item` name, `quantity`, `minimumQuantity` threshold, optional `supplier`, `price` (cast to floating number), and `createdBy` relation.

### 2. Auto-Calculated Stock Alerts
- Embedded `isLowStock` boolean computed flag (checks whether current `quantity <= minimumQuantity`).
- Added filtering support for `lowStock` values:
  - `GET /inventory?lowStock=true` (retrieves low stock items)
  - `GET /inventory?lowStock=false` (retrieves items with healthy stock levels)

### 3. Role-Based Access Controls
- Authorized `ADMIN`, `DOCTOR`, and `RECEPTIONIST` roles to read and search items (`GET /inventory` and `GET /inventory/:id`).
- Authorized `ADMIN` and `RECEPTIONIST` roles to add new items (`POST /inventory`) and edit items/adjust quantities (`PATCH /inventory/:id`).
- Restricted catalog deletions (`DELETE /inventory/:id`) exclusively to `ADMIN` users.

---

## 📂 Folder Layout
```
src/modules/inventory/
 ├── inventory.controller.js  # Controller mapping requests
 ├── inventory.service.js     # Exposes CRUD routines
 ├── inventory.repository.js  # Implements count and query logic using custom Postgres fallback comparisons
 ├── inventory.validator.js   # Zod body validation schemas
 ├── inventory.routes.js      # Protect endpoints using authenticate, authorize, and validation middleware
 ├── inventory.dto.js         # Formats fields and nests creator attributes
 └── inventory.types.js       # JSDoc typings
```

---

## 🧪 Testing Coverage (104/104 Passing)
Added 9 integration tests in `tests/inventory.test.js` validating the warehouse module:
- **Low Stock Computation:** Proved that creating items with quantity below minimum triggers low-stock alerts.
- **Dynamic Recalculations:** Verified that editing stock levels updates the computed `isLowStock` flag in real-time.
- **Admin Boundaries:** Blocked doctors from adding inventory items (403) and blocked receptionists from deleting them (403).
