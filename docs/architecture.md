# System Architecture
## Multi-Tenant SaaS Platform

### Table of Contents
1. Architecture Overview
2. System Components
3. Data Architecture
4. API Architecture
5. Security Architecture
6. Deployment Architecture
7. Scalability & Performance

---

## 1. Architecture Overview

### High-Level Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                           │
│  React.js Frontend Application (Port 3000)                  │
│  - Login Page                                               │
│  - Dashboard                                                │
│  - Projects Page                                            │
│  - Project Details                                          │
│  - Teams Page                                               │
│  - Settings Page                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
                   HTTP/HTTPS (REST API)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION TIER                        │
│  Node.js/Express Backend (Port 5000)                        │
│  - Authentication Service                                   │
│  - Organization Service                                     │
│  - Project Service                                          │
│  - Task Service                                             │
│  - User Service                                             │
│  - Dashboard Service                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
                  Database Connection
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                        DATA TIER                             │
│  PostgreSQL Database (Port 5432)                            │
│  - Organizations Table                                      │
│  - Users Table                                              │
│  - Projects Table                                           │
│  - Tasks Table                                              │
│  - Migration History                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. System Components

### 2.1 Frontend Layer (React.js)
**Purpose**: User Interface and Client-Side Logic

**Key Technologies**:
- React.js: Component-based UI framework
- Redux: State management
- Axios: HTTP client for API calls
- CSS/Bootstrap: Styling

**Components**:
- LoginPage: User authentication interface
- Dashboard: Overview dashboard with analytics
- ProjectsList: List and manage projects
- ProjectDetails: Individual project view with tasks
- TeamsList: Team member management
- SettingsPage: User and organization settings

**Features**:
- JWT token storage in localStorage
- Protected routes for authenticated users
- Real-time data refresh
- Error handling and user feedback

### 2.2 Backend Layer (Node.js/Express)
**Purpose**: API Server and Business Logic

**Architecture Pattern**: MVC (Model-View-Controller)

**Core Components**:

#### 2.2.1 Server (server.js)
- Express.js application initialization
- Middleware configuration (CORS, body-parser)
- Route mounting
- Error handling
- Environment variable setup

#### 2.2.2 Database Connection (db.js)
- PostgreSQL connection pool management
- Connection configuration
- Query execution utility

#### 2.2.3 Routes
**Authentication Routes** (auth.js)
- POST /api/auth/register: User registration
- POST /api/auth/login: User login with JWT
- POST /api/auth/logout: User logout

**Organization Routes** (organizations.js)
- POST /api/organizations: Create organization
- GET /api/organizations: Get user's organizations
- PUT /api/organizations/:id: Update organization

**Project Routes** (projects.js)
- POST /api/projects: Create new project
- GET /api/projects: Get projects by organization
- PUT /api/projects/:id: Update project
- DELETE /api/projects/:id: Delete project

**Task Routes** (tasks.js)
- POST /api/tasks: Create task
- GET /api/tasks: Get tasks by project
- PUT /api/tasks/:id: Update task
- DELETE /api/tasks/:id: Delete task

**User Routes** (users.js)
- GET /api/users: Get organization users
- PUT /api/users/:id: Update user profile
- DELETE /api/users/:id: Delete user account

**Dashboard Routes** (dashboard.js)
- GET /api/dashboard/stats: Get dashboard statistics
- GET /api/dashboard/analytics: Get analytics data

#### 2.2.4 Middleware (middleware.js)
- Authentication verification using JWT
- Role-based access control
- Error handling
- Request logging

#### 2.2.5 Utilities
- UUID generation for unique identifiers
- JWT token creation and verification
- Password hashing using bcrypt
- Data validation functions

### 2.3 Database Layer (PostgreSQL)
**Purpose**: Persistent Data Storage

**Database Design**:
- Multi-tenant architecture with organization_id isolation
- Normalized schema for data integrity
- Indexes on frequently queried columns
- Foreign key relationships for referential integrity

**Key Tables**:
- organizations: Tenant information
- users: User accounts and profiles
- projects: Project metadata
- tasks: Task items and details

---

## 3. Data Architecture

### 3.1 Multi-Tenancy Design
**Approach**: Database-level isolation

**Implementation**:
- Each organization has a unique organization_id
- All queries filter by organization_id
- Data completely isolated between tenants
- No data leakage between organizations

### 3.2 Database Schema

#### Organizations Table
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Projects Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50),
  budget DECIMAL(10,2),
  deadline DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tasks Table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  organization_id UUID REFERENCES organizations(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50),
  priority VARCHAR(20),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. API Architecture

### 4.1 RESTful API Design
**Protocol**: HTTP/HTTPS with JSON payloads

**Authentication**: JWT Bearer Tokens
- Token format: Authorization: Bearer <token>
- Token expiration: 24 hours
- Stored in localStorage on client

### 4.2 API Endpoint Categories

| Category | Count | Purpose |
|----------|-------|----------|
| Authentication | 3 | User login/register |
| Organizations | 3 | Org management |
| Projects | 4 | Project CRUD |
| Tasks | 4 | Task CRUD |
| Users | 3 | User management |
| Dashboard | 2 | Analytics data |
| **Total** | **19** | **Complete API** |

---

## 5. Security Architecture

### 5.1 Authentication & Authorization
- **JWT-based**: Stateless authentication
- **Role-Based Access Control**: Admin, Manager, Worker roles
- **Password Security**: bcrypt hashing (cost factor: 10)
- **Token Expiration**: 24-hour validity

### 5.2 Data Protection
- **Encryption at Rest**: Database-level encryption
- **Encryption in Transit**: SSL/TLS for HTTPS
- **Data Isolation**: Organization-level compartmentalization
- **Backup**: Regular automated backups

### 5.3 API Security
- **CORS**: Restricted to registered domains
- **Rate Limiting**: 100 requests/minute per user
- **Input Validation**: All endpoints validate input
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Output encoding

---

## 6. Deployment Architecture

### 6.1 Docker Containerization

**Services**:
1. **Database Service** (database)
   - Image: postgres:15
   - Port: 5432
   - Volume: postgres_data

2. **Backend Service** (backend)
   - Image: Built from backend Dockerfile
   - Port: 5000
   - Environment: Database credentials, JWT secret
   - Depends on: database

3. **Frontend Service** (frontend)
   - Image: Built from frontend Dockerfile
   - Port: 3000
   - Environment: API endpoint URL
   - Depends on: backend

### 6.2 Docker Compose Configuration
```yaml
version: '3.8'
services:
  database:
    image: postgres:15
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
      POSTGRES_DB: saas_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      DB_HOST: database
      DB_PORT: 5432
      JWT_SECRET: your-secret
    depends_on:
      - database

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://localhost:5000
    depends_on:
      - backend
```

---

## 7. Scalability & Performance

### 7.1 Performance Optimization
- Database connection pooling (10-20 connections)
- Query optimization with indexes
- Lazy loading of data
- Caching strategies
- Response compression (gzip)

### 7.2 Scalability Measures
- Horizontal scaling: Multiple backend instances
- Load balancing: Nginx reverse proxy
- Database replication: Master-slave setup
- CDN for static assets
- Auto-scaling based on load

### 7.3 Monitoring & Logging
- Application error logging
- Database query logging
- Performance metrics collection
- User activity audit trails
- System health monitoring

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|----------|
| Frontend | React.js | UI framework |
| Backend | Node.js/Express | API server |
| Database | PostgreSQL | Data storage |
| Auth | JWT + bcrypt | Security |
| Container | Docker | Deployment |
| Orchestration | Docker Compose | Service management |

---

Document Version: 1.0
Last Updated: December 24, 2025
