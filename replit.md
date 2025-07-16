# SistelCom - Sistema de Gestión de Solicitudes de Telecomunicaciones

## Overview

SistelCom is a modern web application designed for managing telecommunications requests in Spanish. It's built with a full-stack architecture using React for the frontend and Node.js/Express for the backend, with PostgreSQL as the database. The application focuses on streamlining the process of creating, tracking, and managing telecommunications requests for different operators.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **Session Management**: PostgreSQL-based session storage

### Database Design
- **Database**: PostgreSQL with Neon serverless provider
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Tables**: Users, solicitudes (requests), plantillas_correo (email templates), and historial_solicitudes (request history)
- **Enums**: Predefined values for operators, request states, expertise types, and coordination types

## Key Components

### Authentication System
- JWT-based authentication with automatic token refresh
- Role-based access control (admin/usuario)
- Secure password hashing with bcrypt
- Session management with PostgreSQL storage

### Request Management
- Complete CRUD operations for telecommunications requests
- Advanced filtering and search capabilities
- Pagination for large datasets
- Real-time status tracking
- File attachment support for official documents

### Dashboard & Analytics
- Real-time statistics and KPIs
- Visual charts and progress indicators
- Request status overview
- Performance metrics

### Email Template System
- Customizable email templates for different operators
- Dynamic field replacement
- Template management per user
- Integration with email sending

## Data Flow

1. **User Authentication**: Users log in through JWT authentication
2. **Request Creation**: Users create requests through validated forms
3. **Data Persistence**: Requests are stored in PostgreSQL with full audit trail
4. **Status Management**: Request states are tracked through the workflow
5. **Reporting**: Dashboard aggregates data for real-time insights
6. **Email Integration**: Templates are used to generate and send emails

## External Dependencies

### Core Framework Dependencies
- React ecosystem (react, react-dom, react-router equivalent)
- Express.js for backend API
- Drizzle ORM for database operations
- Neon Database for PostgreSQL hosting

### UI/UX Dependencies
- Radix UI primitives for accessible components
- Tailwind CSS for styling
- Lucide React for icons
- React Hook Form for form management
- Zod for schema validation

### Development Dependencies
- Vite for build tooling
- TypeScript for type safety
- ESBuild for server bundling
- PostCSS for CSS processing

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- TSX for running TypeScript server with hot reload
- Development-specific error overlays and debugging tools

### Production Build
- Vite builds optimized React bundle
- ESBuild bundles server code for Node.js
- Static assets served from Express
- Environment-based configuration

### Database Management
- Drizzle migrations for schema changes
- Environment-specific database URLs
- Connection pooling with Neon serverless

### Key Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Type Safety**: Full TypeScript coverage across client and server
- **Performance**: Optimized builds and code splitting
- **Accessibility**: Built with Radix UI for WCAG compliance
- **Security**: JWT authentication, input validation, and secure headers
- **Internationalization**: Spanish language support throughout
- **Real-time Updates**: React Query for efficient data synchronization

The application follows modern web development best practices with a focus on maintainability, performance, and user experience. The architecture supports scalability and future enhancements while maintaining code quality and type safety.