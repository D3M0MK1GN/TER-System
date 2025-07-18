# TER-System - Sistema de Gestión de Solicitudes de Telecomunicaciones

## Overview

TER-System is a modern web application designed for managing telecommunications requests in Spanish. It's built with a full-stack architecture using React for the frontend and Node.js/Express for the backend, with PostgreSQL as the database. The application focuses on streamlining the process of creating, tracking, and managing telecommunications requests for different operators.

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
- **User Management**: Complete user administration with role-based access control

## Recent Changes (July 2025)
- ✓ Successfully migrated from Replit Agent to Replit environment (July 18, 2025)
- ✓ **Updated Expertise Types System (July 18, 2025):**
  - Replaced old expertise types with comprehensive telecommunications analysis options
  - Added 17 new specific expertise types covering all aspects of telecommunications investigations
  - Updated all forms, tables, and templates to use new expertise types with proper Spanish labels
  - Enhanced Word template management to support new expertise categories
- ✓ **Application Renamed to TER-System (July 18, 2025):**
  - Changed application name from SistelCom to TER-System throughout the entire codebase
  - Updated all HTML titles, meta tags, and branding references
  - Modified user guide generation to reflect new system name
  - Updated sidebar header and application documentation
- ✓ **Updated Expertise Types System (July 18, 2025):**
  - Completely replaced old expertise types with comprehensive telecommunications analysis options
  - Added 17 new specific expertise types covering all aspects of telecommunications investigation
  - Updated database schema with new enum values for tipo_experticia
  - Modified all frontend components to display new expertise types with proper Spanish labels
  - Updated form selectors, filters, and display functions throughout the application
  - New expertise types include: identification of phone data, line sale tracking, IP connections, BTS analysis, social behavior patterns, location tracking, contamination analysis, and international number identification
- ✓ **Comprehensive Error Resolution and Code Quality Improvements (July 18, 2025):**
  - Fixed all TypeScript compilation errors across frontend and backend including syntax error in dashboard-old.tsx
  - Corrected notification dropdown type safety issues with proper undefined checking
  - Updated API request patterns in templates.tsx to use consistent apiRequest format
  - Fixed operator color mapping to match Venezuelan telecommunications companies (Digitel, Movistar, Movilnet)
  - Resolved user form data type compatibility issues with proper interface extensions
  - Added Express Request type extensions for clientIp property
  - Fixed error handling in server routes with proper type casting for PostgreSQL errors and multer file filter
  - Corrected null/undefined handling in user authentication and storage operations
  - Fixed request form data type compatibility for editing functionality
  - Resolved Promise type mismatch in notification system
  - Updated all error handling to use proper TypeScript type safety across all components
  - Replaced console.log statements with proper error handling or removed unnecessary logging
  - Enhanced error handling in mutations and async operations with proper Error types
  - Fixed type annotations in storage operations with proper type definitions
  - Improved type safety in request forms, template management, and user administration
  - Application now builds successfully with no TypeScript errors and passes all compilation checks
- ✓ **UI/UX Improvements (July 18, 2025):**
  - Removed logout button from top header bar for cleaner interface
  - Reduced spacing between sidebar header and navigation buttons for better visual flow
  - Maintained user guide functionality in header for easy access to documentation
- ✓ Removed logout button from header at user request (July 18, 2025)
- ✓ **Implemented Session Management and Security Enhancement (July 18, 2025):**
  - Added session token tracking to prevent multiple concurrent user sessions
  - Users cannot log in if they already have an active session - must log out first
  - Enhanced authentication middleware to validate session tokens and expiration
  - Added logout functionality with proper session cleanup
  - Updated database schema with sessionToken and sessionExpires fields
  - Implemented secure session management with 24-hour expiration
  - Added logout button to header with proper session termination
  - Sessions are automatically cleared when expired or invalid
  - Prevents unauthorized access through session validation
- ✓ **Comprehensive Code Optimization and Error Handling Enhancement (July 17, 2025):**
  - Enhanced authentication middleware with improved JWT error handling and user status validation
  - Optimized database queries with proper input validation, pagination limits, and transaction support
  - Fixed potential memory leaks by adding proper cleanup for background task intervals
  - Improved notification cleanup system with optimized admin user ID queries and better error handling
  - Enhanced failed login attempt system with corrected suspension logic (fixed >= 2 instead of >= 3)
  - Added transaction support for deleteSolicitud to ensure data consistency across related tables
  - Improved error handling throughout the application with specific error logging and better user feedback
  - Enhanced input validation and sanitization with Zod schema transforms for automatic data cleanup
  - Optimized background tasks with Promise.allSettled for better parallel processing
  - Added graceful shutdown handlers for background intervals to prevent resource leaks
  - Improved client-side error handling with better token management and specific error messages
  - Enhanced user form validation with regex patterns, length limits, and automatic data transformation
  - Fixed authentication error display to show specific suspension/blocking messages with precise timing
  - Optimized request creation with parallel promise execution for history and notifications
  - Added comprehensive input validation for all API endpoints with detailed error responses
  - Enhanced database query performance with proper WHERE clause optimization and search term trimming
- ✓ **Replaced Logout Button with User Guide (July 17, 2025):**
  - Removed unnecessary logout button from header navigation
  - Added comprehensive user guide button that generates detailed HTML guide
  - Implemented PDF generation endpoint at `/api/guide/pdf`
  - Created complete user manual covering all system features, roles, and troubleshooting
  - Guide includes step-by-step instructions for all functionalities with proper styling and print support
- ✓ Removed "Usuarios" tab from sidebar navigation
- ✓ Integrated user management access into dashboard for administrators only
- ✓ Added "Panel de Administración" section in dashboard with user management button
- ✓ Set up PostgreSQL database with proper schema migration
- ✓ Fixed user form validation schema error with proper Zod schema handling
- ✓ Resolved date transformation issue for tiempoSuspension field in user management
- ✓ Added comprehensive user management system with:
  - User status control (active, suspended, blocked)
  - Role-based permissions (admin/supervisor/user)
  - Complete CRUD operations for user administration
  - Advanced filtering and search functionality
  - Admin-only access restrictions
  - IP address tracking for users
  - Proper date handling for suspension times
- ✓ Enhanced navigation with new Users section
- ✓ Implemented secure password handling with bcrypt hashing
- ✓ Added form validation for user creation and editing
- ✓ Extended user roles to include supervisor level
- ✓ Added direccion_ip field for IP address tracking
- ✓ Fixed schema validation errors in user forms and backend processing
- ✓ **Implemented Complete Role-Based Access Control System:**
  - **Administrator Role**: Full system access including user management, all requests, all reports
  - **Supervisor Role**: Dashboard access, can view/manage all requests and reports, NO user management access
  - **User Role**: Limited dashboard showing only their own data, can only view/manage their own requests and reports
  - Added permission system with `usePermissions` hook for frontend access control
  - Implemented backend middleware for API route protection (`requireAdmin`, `requireAdminOrSupervisor`)
  - Updated all pages (Dashboard, Requests, Reports) to show role-appropriate content
  - Enhanced navigation sidebar to display only accessible sections per role
  - Added user-specific database queries for dashboard stats and requests
  - Implemented complete separation of data access based on user roles
- ✓ **Fixed Navigation Performance and Request Management Issues (July 17, 2025):**
  - Optimized authentication system with React Query caching (5-minute cache) to eliminate navigation flickering
  - Fixed JSON parse error in request management by correcting API request format
  - Implemented role-based request status restrictions: supervisor and usuario roles can ONLY create/edit requests with "enviada" status
  - Added backend validation to enforce request status restrictions for non-admin users
  - Updated user creation dialog with proper sizing (max-w-lg, max-h-90vh, scrollable) to prevent screen overflow
  - Added memoization to components for improved performance and reduced re-renders
- ✓ **Updated Role-Based Access Control for Email Templates and Request Management (July 17, 2025):**
  - Restricted email templates (plantillas de correo) access to administrators only - supervisors and users can no longer access this section
  - Added specific permission `canViewEmailTemplates` that is only granted to admin role
  - Modified request management actions: only administrators can see all three action icons (view, edit, delete), while supervisors and users only see view and edit icons
  - Updated navigation sidebar to hide email templates section for non-admin users
  - Enhanced request table to conditionally show delete and email actions based on user permissions
- ✓ **Implemented Unique Request Number Validation (July 17, 2025):**
  - Added database constraint to ensure numeroSolicitud is unique across all requests
  - Implemented backend validation to check for duplicate request numbers during creation and updates
  - Added proper error handling with descriptive messages when duplicate request numbers are detected
  - Enhanced user experience by preventing duplicate request numbers at both database and application level
- ✓ **Updated Operator System and Enhanced Error Handling (July 17, 2025):**
  - Limited operator options to only three Venezuelan telecommunications companies: Digitel, Movistar, and Movilnet
  - Updated database schema to reflect new operator enum values
  - Enhanced error handling to show "Número de Solicitud Duplicada" message instead of generic 500 errors
  - Updated frontend components (forms and tables) to display only the three valid operators
  - Improved PostgreSQL error detection and user-friendly error messages
- ✓ **Updated Field Labels for Better User Experience (July 17, 2025):**
  - Changed "Descripción" to "Reseña" throughout the application
  - Updated form labels, placeholders, and modal display text
  - Enhanced consistency in Spanish language terminology
- ✓ **Implemented Status-Based Edit/Delete Restrictions (July 17, 2025):**
  - Added backend validation to prevent non-admin users from editing or deleting requests with status other than "enviada"
  - Only administrators can edit or delete requests with status "pendiente", "respondida", or "rechazada"
  - Updated frontend to conditionally show edit/delete buttons based on request status and user permissions
  - Enhanced user experience with proper error messages when trying to perform restricted actions
  - Maintains data integrity by preventing unauthorized modifications to processed requests
- ✓ **Updated Status System and Fixed Delete Functionality (July 17, 2025):**
  - Changed status "pendiente" to "procesando" throughout the entire application
  - Fixed database migration issue with enum type changes
  - Resolved foreign key constraint error when deleting requests with history records
  - Updated all frontend components to display "Procesando" instead of "Pendiente"
  - Fixed delete functionality to properly remove history records before deleting requests
  - Ensured consistent status handling across dashboard, reports, and request management
- ✓ **Replaced Logout Button with User Guide Feature (July 17, 2025):**
  - Removed "Cerrar Sesión" button from top header navigation
  - Added "Guía de Usuario" button that generates comprehensive PDF user guide
  - Created detailed HTML-based user guide covering all system functionalities
  - Guide includes sections on login, dashboard, request management, email templates, reports, user management, notifications, and troubleshooting
  - Users can print or save the guide as PDF directly from their browser
  - Fixed guide display issue to properly render HTML content in new browser window
- ✓ **Enhanced Security and Notification System (July 17, 2025):**
  - **Failed Login Protection**: Users are automatically suspended for 3 hours after 3 failed login attempts
  - **Admin Notifications for Sent Requests**: Administrators receive notifications when requests are sent to operators
  - **Suspension Management**: Automatic lifting of temporary suspensions with notifications to users and admins
  - **Security Alerts**: Admins are notified when accounts are suspended due to failed login attempts
  - **Background Monitoring**: Automated task checks for expired suspensions every 5 minutes
  - **Enhanced Login Security**: Failed attempts are tracked with IP addresses and timestamps
  - **User Schema Extended**: Added intentosFallidos and ultimoIntentoFallido fields for security tracking
  - **Comprehensive Notification System**: Real-time alerts for security events and request status changes
  - **Automatic Notification Cleanup**: Notifications are automatically deleted after 48 hours for regular users and 120 hours (5 days) for administrators
  - **Fixed Notification Foreign Key Issue**: Resolved database constraint error when creating system notifications without associated requests
  - **Hourly Cleanup Task**: Background job runs every hour to clean expired notifications and maintain database performance
  - **Enhanced Login Messages**: Improved login error messages for suspended accounts showing precise time remaining and clear "Cuenta Bloqueada" message for blocked accounts


The application follows modern web development best practices with a focus on maintainability, performance, and user experience. The architecture supports scalability and future enhancements while maintaining code quality and type safety.