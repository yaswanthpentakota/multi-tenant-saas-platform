# Multi-Tenant SaaS Platform

A production-ready Multi-Tenant SaaS application with Project & Task Management. Features JWT authentication, role-based access control, multi-tenancy architecture, and complete Docker containerization.

## Features

- **Multi-Tenancy**: Complete data isolation between tenants with subdomain-based tenant identification
- **Authentication & Authorization**: JWT-based authentication with 3 user roles (Super Admin, Tenant Admin, User)
- **Project Management**: Create and manage projects with full team collaboration
- **Task Management**: Track tasks with status, priority, and team member assignment
- **Role-Based Access Control**: Different API endpoints require different user roles
- **Subscription Plans**: Free, Pro, and Enterprise plans with configurable limits
- **Audit Logging**: Track all important actions for security and compliance
- **Docker Containerization**: Complete docker-compose setup for easy deployment
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

### Frontend
- React.js - UI library
- Axios - HTTP client
- React Router - Navigation
- CSS3 - Styling

### Backend
- Node.js - Runtime environment
- Express.js - Web framework
- PostgreSQL - Database
- JWT - Authentication
- Bcrypt - Password hashing

### DevOps
- Docker - Containerization
- Docker Compose - Multi-container orchestration
- PostgreSQL 15 - Production database

## Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL 15

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yaswanthpentakota/multi-tenant-saas-platform.git
cd multi-tenant-saas-platform
```

2. Using Docker Compose (Recommended):
```bash
docker-compose up -d
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Database: localhost:5432

### Test Credentials

**Super Admin:**
- Email: superadmin@system.com
- Password: Admin@123

**Tenant Admin (Demo Company):**
- Email: admin@demo.com
- Password: Demo@123
- Subdomain: demo

**Regular User:**
- Email: user1@demo.com
- Password: User@123

## API Documentation

The application includes 19 RESTful API endpoints:

### Authentication (4 endpoints)
- `POST /api/auth/register-tenant` - Register new tenant
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Tenant Management (3 endpoints)
- `GET /api/tenants/:tenantId` - Get tenant details
- `PUT /api/tenants/:tenantId` - Update tenant
- `GET /api/tenants` - List all tenants (super admin only)

### User Management (3 endpoints)
- `POST /api/tenants/:tenantId/users` - Add user to tenant
- `GET /api/tenants/:tenantId/users` - List tenant users
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### Project Management (3 endpoints)
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `PUT /api/projects/:projectId` - Update project
- `DELETE /api/projects/:projectId` - Delete project

### Task Management (6 endpoints)
- `POST /api/projects/:projectId/tasks` - Create task
- `GET /api/projects/:projectId/tasks` - List tasks
- `PUT /api/tasks/:taskId` - Update task
- `PATCH /api/tasks/:taskId/status` - Update task status
- `DELETE /api/tasks/:taskId` - Delete task
- `GET /api/health` - Health check

## Database Schema

The application uses the following core tables:
- `tenants` - Organization information
- `users` - User accounts with tenant association
- `projects` - Projects for each tenant
- `tasks` - Tasks within projects
- `audit_logs` - Action tracking for security

## Environment Variables

Create a `.env` file in the backend directory:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000
PORT=5000
NODE_ENV=development
```

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── database/
│   └── migrations/
├── docker-compose.yml
└── README.md
```

## Deployment

The application is fully containerized and can be deployed using Docker Compose:

```bash
docker-compose up -d
```

For production:
1. Update environment variables in docker-compose.yml
2. Use production database credentials
3. Set NODE_ENV=production
4. Configure CORS for your domain

## Multi-Tenancy Architecture

The platform uses a **Shared Database + Shared Schema** approach:
- All tenant data stored in same database
- Each record includes `tenant_id` for isolation
- Super Admin users have `tenant_id = NULL`
- Automatic tenant filtering in all queries

## Security Features

- **Password Hashing**: Bcrypt with salt rounds of 10
- **JWT Authentication**: 24-hour token expiry
- **Data Isolation**: Tenant-level data separation
- **Role-Based Access**: Different permissions for different roles
- **Audit Logging**: Track all important actions
- **Input Validation**: Request validation on all endpoints

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please contact the development team.
