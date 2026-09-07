# ⚡ Load Shedding & Power Outage Management SaaS - API Documentation

Welcome to the official API integration documentation for the **Load Shedding & Power Outage Management System**. This system is built using an enterprise-grade **Clean Architecture** (Interface-Service-Controller-Route) with **Prisma (PostgreSQL)**, **Redis** for distributed rate limiting, and **Stripe** for automated meter recharges.

---

## 🌐 Base URL
* **Local Development:** `http://localhost:5000/api/v1`
* **Production (Vercel):** `https://vercel.app`

---

## 🛡️ Global Security Features
1. **Authentication:** All protected routes require a JWT Bearer Token in the headers:
   `Authorization: Bearer <YOUR_JWT_TOKEN>`
2. **Distributed Rate Limiting (Redis-backed):** 
   * **Global API Limit:** Max 60 requests per minute per IP. Exceeding returns `429 Too Many Requests`.
   * IP tracking is fully isolated (Blocking a malicious IP will **not** affect other users).

---

## 📊 1. Dashboard Overview API

Returns real-time aggregated metrics customized dynamically based on the logged-in user's role.

### 🔹 Fetch Dashboard Statistics
* **Endpoint:** `GET /dashboard/overview`
* **Access:** `CUSTOMER`, `POWER_OPERATOR`, `ZONE_MANAGER`, `ADMIN`, `SUPER_ADMIN`
* **Headers:** `Authorization: Bearer <Token>`

#### 📝 Role-Based Response Payloads:

* **If CUSTOMER:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "📊 Real-time Dashboard statistics for CUSTOMER fetched successfully.",
  "data": {
    "role": "CUSTOMER",
    "currentBalance": 1250.50,
    "meterNumber": "MTR-99823",
    "isPowerActive": true,
    "myPendingComplaints": 1,
    "myResolvedComplaints": 4
  }
}
```

* **If ZONE_MANAGER:** (Scoped to their assigned zone only)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "📊 Real-time Dashboard statistics for ZONE_MANAGER fetched successfully.",
  "data": {
    "role": "ZONE_MANAGER",
    "zoneId": "zone-uuid-12345",
    "totalCustomers": 1420,
    "totalTechnicians": 24,
    "activeLoadShedding": 2,
    "pendingComplaints": 5
  }
}
```

* **If ADMIN / SUPER_ADMIN:** (Global Infrastructure Overview)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "📊 Real-time Dashboard statistics for ADMIN fetched successfully.",
  "data": {
    "role": "ADMIN",
    "totalCustomers": 55000,
    "totalTechnicians": 320,
    "totalZoneManagers": 12,
    "totalPowerOperators": 45,
    "activeLoadShedding": 8,
    "pendingComplaints": 14,
    "resolvedComplaints": 1820,
    "totalRevenue": 452300.00,
    "gridHealthScore": "Warning - Active Outages Detected"
  }
}
```

---

## 💳 2. Wallet & Stripe Payment APIs

Handles smart energy prepaid recharges securely using **Stripe Checkout Sessions** and registers logs in the `Payment` history.

### 🔹 Initiate Meter Recharge (Generate Stripe Link)
* **Endpoint:** `POST /wallet/recharge`
* **Access:** `CUSTOMER`
* **Request Body:**
```json
{
  "amount": 50.00,
  "meterNumber": "MTR-99823"
}
```
* **Response:** (Frontend will redirect the window to this `paymentUrl`)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Stripe Checkout session created successfully.",
  "data": {
    "paymentUrl": "https://stripe.com_..."
  }
}
```

### 🔹 Fetch Payment Logs & History
* **Endpoint:** `GET /payment/history`
* **Access:** `CUSTOMER` (Sees only own history) | `ADMIN` / `SUPER_ADMIN` (Sees global logs)
* **Query Params (Optional Pagination & Filtering):** `?page=1&limit=10&status=SUCCESS&searchTerm=MTR-99823`
* **Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "💳 Payment transaction history logs fetched successfully.",
  "data": {
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPage": 1
    },
    "data": [
      {
        "id": "pay-uuid-88321",
        "transactionId": "ch_3MtwByLkdIwHu7ix28a",
        "amount": 50.00,
        "status": "SUCCESS",
        "createdAt": "2026-09-06T12:46:15.000Z",
        "customer": {
          "meterNumber": "MTR-99823",
          "user": {
            "name": "Abdur Rahman Rakib",
            "email": "rakib@example.com"
          }
        }
      }
    ]
  }
}
```

---

## ⚡ 3. Outage & Technician State Management APIs

Implements core atomic business operations, state transitions, and resource protection routines.

### 🔹 Manually Assign Technician to Ticket
* **Endpoint:** `PATCH /outage/assign-technician`
* **Access:** `ZONE_MANAGER`, `ADMIN`, `SUPER_ADMIN`
* **Validation Guards:** Throws error if Technician is already `ON_DUTY` or `OFFLINE`. Triggers **Auto-Audit Log** on success.
* **Request Body:**
```json
{
  "reportId": "report-uuid-112233",
  "technicianId": "tech-uuid-445566"
}
```
* **Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Technician has been successfully assigned to the outage ticket manually.",
  "data": {
    "id": "report-uuid-112233",
    "status": "ASSIGNED",
    "technicianId": "tech-uuid-445566"
  }
}
```

### 🔹 Resolve Outage Job (Power Restored)
* **Endpoint:** `PATCH /outage/resolve/:reportId`
* **Access:** `TECHNICIAN`
* **Operation:** Automatically updates outage ticket to `RESTORED`, injects `endTime: new Date()`, and releases the associated Technician status back to **`AVAILABLE`**.
* **Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "⚡ Power Restored successfully! Job resolved directly via report ticket.",
  "report": {
    "id": "report-uuid-112233",
    "status": "RESTORED"
  }
}
```

### 🔹 Fetch Scoped Outage Complaint Reports
* **Endpoint:** `GET /outage/reports`
* **Access:** `ZONE_MANAGER`, `ADMIN`, `SUPER_ADMIN`
* **Features:** Supports Advanced Filtering, Deep Search, and Pagination. **Soft Deleted reports are excluded automatically.**
* **Query Params:** `?page=1&limit=5&status=PENDING&searchTerm=Mirpur`
* **Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Outage complaint reports retrieved successfully.",
  "data": {
    "meta": {
      "page": 1,
      "limit": 5,
      "total": 12,
      "totalPage": 3
    },
    "data": [
      {
        "id": "report-uuid-112233",
        "description": "Transformer burst near sector 2",
        "status": "PENDING",
        "customer": {
          "user": { "name": "John Doe", "email": "john@gmail.com" },
          "area": { "name": "Mirpur 1" }
        }
      }
    ]
  }
}
```

---

## 🗑️ 4. Modern Data Infrastructure (Soft Delete APIs)

Prevents hard metadata drops, securing relational constraint histories within the public utility schemas.

### 🔹 Soft Delete Area Infrastructure
* **Endpoint:** `DELETE /grid/area/:id`
* **Access:** `ADMIN`, `SUPER_ADMIN`
* **Action:** Updates `isDeleted` to `true` and saves the action timestamp into `deletedAt` without mutating the operational entity rows.
* **Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Area has been soft deleted successfully!",
  "data": {
    "id": "area-uuid-778899",
    "name": "Mirpur 10",
    "isDeleted": true,
    "deletedAt": "2026-09-06T21:03:48.585Z"
  }
}
```

---

## 🛡️ 5. Security & Administrative Audit Logs API

Exposes back-end atomic security logs tracking administrative access control mutations and critical grid allocations.

### 🔹 Fetch System Audit History
* **Endpoint:** `GET /audit-logs`
* **Access:** `ADMIN`, `SUPER_ADMIN`
* **Query Params:** `?page=1&limit=10&action=ASSIGN_TECHNICIAN`
* **Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "System Audit Logs retrieved successfully for administrative review.",
  "data": {
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPage": 15
    },
    "data": [
      {
        "id": "log-uuid-554433",
        "action": "ASSIGN_TECHNICIAN",
        "details": "Zone Manager manually assigned Technician (ID: tech-66) to Outage Report (ID: rep-11).",
        "createdAt": "2026-09-06T21:10:00.000Z",
        "user": {
          "name": "Manager Karim",
          "email": "karim@zone.com",
          "role": "ZONE_MANAGER"
        }
      }
    ]
  }
}
```

---
*Documentation Compiled & Validated under TypeScript Safe Modes Core Engine.*
