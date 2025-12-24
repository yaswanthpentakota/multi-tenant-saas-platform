# API Documentation
## Multi-Tenant SaaS Platform

### Base URL
```
http://localhost:5000/api
```

### Authentication
All API requests require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## 1. Authentication Endpoints (3)

### 1.1 Register User
**POST** `/api/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "organization_name": "Acme Corp"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "organization_id": "uuid",
    "token": "jwt_token"
  }
}
```

### 1.2 Login User
**POST** `/api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "organization_id": "uuid",
    "role": "admin",
    "token": "jwt_token",
    "expires_in": 86400
  }
}
```

### 1.3 Logout User
**POST** `/api/auth/logout`

**Headers:** JWT token required

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 2. Organization Endpoints (3)

### 2.1 Create Organization
**POST** `/api/organizations`

**Request:**
```json
{
  "name": "Company Name",
  "description": "Company description"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Organization created",
  "data": {
    "id": "uuid",
    "name": "Company Name",
    "description": "Company description",
    "created_at": "2025-12-24T12:00:00Z"
  }
}
```

### 2.2 Get Organizations
**GET** `/api/organizations`

**Query Parameters:**
- `limit` (optional): Results per page (default: 10)
- `offset` (optional): Skip results (default: 0)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Company Name",
      "created_at": "2025-12-24T12:00:00Z"
    }
  ],
  "total": 1
}
```

### 2.3 Update Organization
**PUT** `/api/organizations/:id`

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Organization updated"
}
```

---

## 3. Project Endpoints (4)

### 3.1 Create Project
**POST** `/api/projects`

**Request:**
```json
{
  "title": "Project Title",
  "description": "Project description",
  "status": "Planning",
  "budget": 50000.00,
  "deadline": "2026-12-31"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Project created",
  "data": {
    "id": "uuid",
    "title": "Project Title",
    "status": "Planning"
  }
}
```

### 3.2 Get Projects
**GET** `/api/projects`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Project Title",
      "status": "Planning",
      "budget": 50000.00
    }
  ],
  "total": 1
}
```

### 3.3 Update Project
**PUT** `/api/projects/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "Project updated"
}
```

### 3.4 Delete Project
**DELETE** `/api/projects/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "Project deleted"
}
```

---

## 4. Task Endpoints (4)

### 4.1 Create Task
**POST** `/api/tasks`

**Request:**
```json
{
  "project_id": "uuid",
  "title": "Task Title",
  "description": "Task description",
  "status": "Pending",
  "priority": "High",
  "assigned_to": "uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Task created",
  "data": {
    "id": "uuid",
    "title": "Task Title",
    "status": "Pending"
  }
}
```

### 4.2 Get Tasks
**GET** `/api/tasks`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Task Title",
      "status": "Pending",
      "priority": "High"
    }
  ],
  "total": 1
}
```

### 4.3 Update Task
**PUT** `/api/tasks/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "Task updated"
}
```

### 4.4 Delete Task
**DELETE** `/api/tasks/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "Task deleted"
}
```

---

## 5. User Endpoints (3)

### 5.1 Get Users
**GET** `/api/users`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "admin"
    }
  ],
  "total": 1
}
```

### 5.2 Update User
**PUT** `/api/users/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "User updated"
}
```

### 5.3 Delete User
**DELETE** `/api/users/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted"
}
```

---

## 6. Dashboard Endpoints (2)

### 6.1 Get Dashboard Statistics
**GET** `/api/dashboard/stats`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_projects": 5,
    "active_projects": 3,
    "completed_projects": 2,
    "total_tasks": 25,
    "completed_tasks": 10,
    "team_members": 8,
    "completion_rate": 40
  }
}
```

### 6.2 Get Dashboard Analytics
**GET** `/api/dashboard/analytics`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "project_distribution": [
      {
        "status": "In Progress",
        "count": 3
      },
      {
        "status": "Completed",
        "count": 2
      }
    ],
    "task_trends": [
      {
        "date": "2025-12-24",
        "completed": 5,
        "pending": 10
      }
    ]
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "status_code": 400,
  "message": "Invalid input"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "status_code": 401,
  "message": "Unauthorized - Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "status_code": 403,
  "message": "Forbidden - Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "status_code": 404,
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "status_code": 429,
  "message": "Rate limit exceeded. Max 100 requests per minute."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "status_code": 500,
  "message": "Internal server error"
}
```

---

## HTTP Status Codes
- `200`: OK - Success
- `201`: Created - Resource created
- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Permission denied
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error

---

## Rate Limiting
- Limit: 100 requests per minute per user
- Response headers:
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Reset timestamp

---

## Pagination
List endpoints support pagination:
- `limit`: Results per page (default: 10, max: 100)
- `offset`: Skip results (default: 0)

---

API Version: 1.0
Last Updated: December 24, 2025
