# WebinarHub - Live Webinar Discovery Platform

## Overview

WebinarHub is a comprehensive web platform designed to help users discover and register for free, live online workshops and webinars in India. The application focuses on technology, business, and educational content, providing real-time webinar listings with features like countdown timers, registration management, and Google Meet integration. Built as a full-stack application, it combines a modern React frontend with an Express.js backend and PostgreSQL database for robust data management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod schema validation for robust form management
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design

### Backend Architecture
- **Framework**: Express.js with TypeScript for type-safe server-side development
- **Database ORM**: Drizzle ORM for type-safe database queries and schema management
- **Database**: PostgreSQL with Neon serverless database provider
- **API Design**: RESTful API endpoints with proper error handling and validation
- **Development Setup**: Vite for development with hot module replacement and build optimization

### Data Storage Solutions
- **Primary Database**: PostgreSQL hosted on Neon with connection pooling
- **ORM**: Drizzle ORM with migrations support and schema validation
- **Schema Design**: Three main entities - webinars, user registrations, and Google Meet sessions
- **Data Validation**: Zod schemas for both client and server-side validation
- **Development Fallback**: In-memory storage implementation for development and testing

### Authentication and Authorization
- **Current Implementation**: Simple mock authentication with localStorage persistence
- **User Management**: Basic user state management with name and email storage
- **Session Handling**: Client-side session management (ready for backend session integration)
- **Future-Ready**: Architecture supports integration with proper authentication providers

### External Dependencies
- **Database Provider**: Supabase with Edge Functions for PostgreSQL hosting and serverless operations
- **UI Components**: Radix UI for accessible component primitives
- **Video Conferencing**: Google Meet integration for webinar sessions
- **Web Scraping**: Multi-source scraping system (Eventbrite, Meetup, Devpost, Luma)
- **SEO Content**: Automated blog and guide generation for organic traffic growth
- **Deployment**: Configured for Replit deployment with Vite build system
- **Development Tools**: ESBuild for server bundling and TypeScript compilation

### Key Architectural Decisions

**Monorepo Structure**: The application uses a shared codebase approach with separate client, server, and shared directories. This enables code reuse (especially TypeScript types and schemas) between frontend and backend while maintaining clear separation of concerns.

**Type-Safe Database Layer**: Drizzle ORM was chosen over traditional ORMs for its TypeScript-first approach, providing compile-time safety for database operations and automatic type inference from database schemas.

**Component-Based UI**: The frontend leverages a modern component architecture with shadcn/ui, providing consistent design patterns while maintaining flexibility for customization through Tailwind CSS.

**Server State Management**: TanStack Query handles all server state, providing automatic caching, background updates, and error handling, reducing the complexity of manual state management.

**Schema-First Validation**: Zod schemas are used throughout the application for both client and server-side validation, ensuring data consistency and type safety across the entire stack.

**Development Experience**: The setup prioritizes developer experience with hot reload, TypeScript support, and comprehensive tooling for both frontend and backend development.

**Automated Content Discovery**: The platform features a comprehensive web scraping system that automatically discovers new webinars from major platforms (Eventbrite, Meetup, Devpost, Luma) triggered by user interactions such as category browsing, search queries, and webinar detail views.

**SEO Content Flywheel**: An automated content generation system creates weekly listicles, how-to guides, and topic-based articles to drive organic traffic, with internal linking and structured data optimization for search engines.

**Background Processing**: All scraping and content generation operations run asynchronously without impacting user experience, featuring intelligent caching, deduplication, and daily automation scheduling.