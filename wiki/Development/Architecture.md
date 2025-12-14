# Architecture Overview

This document describes the overall architecture and design patterns of the Lunavo platform.

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Client Application                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   React      │  │   Expo       │  │  TypeScript  │  │
│  │   Native     │  │   Router     │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS/WebSocket
                          │
┌─────────────────────────────────────────────────────────┐
│                    Supabase Backend                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ PostgreSQL   │  │  Auth        │  │  Real-time   │  │
│  │  Database    │  │  Service     │  │  Subscriptions│ │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  Row Level   │  │  Storage     │                    │
│  │  Security    │  │  (Optional)  │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

## Application Layers

### 1. Presentation Layer

**Location**: `app/`

- **Screens**: User-facing screens organized by feature
- **Components**: Reusable UI components
- **Navigation**: Route definitions and navigation logic
- **Hooks**: Custom React hooks for UI logic

### 2. Business Logic Layer

**Location**: `lib/`

- **Authentication** (`lib/auth.ts`): User authentication
- **Database** (`lib/database.ts`): Data operations
- **Permissions** (`lib/permissions.ts`): Role-based access control
- **Gamification** (`lib/gamification.ts`): Points, badges, streaks
- **Real-time** (`lib/realtime.ts`): Live updates
- **AI Utils** (`lib/ai-utils.ts`): AI-powered features

### 3. Data Layer

**Location**: Supabase (Backend)

- **PostgreSQL Database**: All application data
- **Row Level Security**: Database-level access control
- **Real-time Subscriptions**: Live data updates
- **Authentication**: User sessions and tokens

## Design Patterns

### 1. Role-Based Access Control (RBAC)

**Implementation**: `lib/permissions.ts`, `app/utils/navigation.ts`

- 8 distinct user roles
- Permission-based access control
- Route-level protection
- Component-level guards

### 2. Navigation Strategy

**Hybrid Navigation System**:

- **Mobile**: Bottom tabs + Drawer menu + FAB
- **Web**: Sidebar (Admin/Student Affairs) + Top navigation
- **Role-aware**: Different navigation per role
- **Device-aware**: Adapts to mobile/web

### 3. Real-time Updates

**Implementation**: `lib/realtime.ts`

- Supabase real-time subscriptions
- Automatic UI updates
- Optimistic updates where appropriate
- Connection state management

### 4. State Management

**Pattern**: React Hooks + Context (where needed)

- Local component state for UI
- Server state via Supabase
- Custom hooks for shared logic
- No global state management library (kept simple)

### 5. Error Handling

**Pattern**: Try-catch with user-friendly messages

- Graceful error handling
- User-facing error messages
- Console logging for debugging
- Error boundaries (where applicable)

## File Organization

### Directory Structure

```
app/
├── (tabs)/              # Tab navigation group
├── admin/               # Admin screens
├── auth/                # Authentication screens
├── components/          # Reusable components
│   └── navigation/     # Navigation components
├── utils/               # Utility functions
└── types/               # TypeScript types

lib/
├── auth.ts              # Authentication
├── database.ts          # Database operations
├── permissions.ts       # RBAC system
├── gamification.ts      # Points & badges
├── realtime.ts          # Real-time features
└── ...

hooks/                   # Custom React hooks
supabase/
└── migrations/          # Database migrations
```

## Data Flow

### Reading Data

```
Component → lib/database.ts → Supabase Client → PostgreSQL
                ↓
         Transform to App Types
                ↓
         Return to Component
```

### Writing Data

```
Component → lib/database.ts → Supabase Client → PostgreSQL
                ↓
         RLS Policies Check
                ↓
         Insert/Update/Delete
                ↓
         Real-time Broadcast
                ↓
         Update UI
```

### Authentication Flow

```
User Action → lib/auth.ts → Supabase Auth → Session Token
                    ↓
            Store in Secure Storage
                    ↓
            Update App State
                    ↓
            Navigate to Default Route
```

## Security Architecture

### 1. Authentication

- Supabase Auth (JWT tokens)
- Secure token storage
- Session management
- Password reset flow

### 2. Authorization

- Row Level Security (RLS) policies
- Permission-based access control
- Route guards
- Component guards

### 3. Data Protection

- Encrypted connections (HTTPS)
- Anonymized user data
- Pseudonym system
- Privacy-first design

## Performance Optimizations

### 1. Data Loading

- Pagination for large datasets
- Lazy loading
- Caching strategies
- Optimistic updates

### 2. Rendering

- React.memo for expensive components
- Virtual lists (where applicable)
- Image optimization
- Code splitting

### 3. Network

- Request batching
- Debouncing search
- Offline support
- Connection state awareness

## Scalability Considerations

### Current Architecture

- Single Supabase project
- Client-side rendering
- Real-time subscriptions
- File-based routing

### Future Scalability

- Multiple Supabase projects (if needed)
- Server-side rendering (web)
- CDN for static assets
- Microservices (if needed)

## Technology Stack

### Frontend

- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform and tooling
- **TypeScript**: Type safety
- **Expo Router**: File-based routing
- **React Native Paper**: UI components

### Backend

- **Supabase**: Backend-as-a-Service
  - PostgreSQL database
  - Authentication service
  - Real-time subscriptions
  - Row Level Security

### Development Tools

- **ESLint**: Code linting
- **TypeScript**: Type checking
- **Git**: Version control
- **VS Code**: Recommended IDE

## Best Practices

### Code Organization

1. **Feature-based structure**: Group related files
2. **Separation of concerns**: UI, logic, data layers
3. **Reusable components**: DRY principle
4. **Type safety**: TypeScript everywhere

### Performance

1. **Lazy loading**: Load data as needed
2. **Memoization**: Cache expensive computations
3. **Optimistic updates**: Better UX
4. **Error boundaries**: Graceful failures

### Security

1. **Never trust client**: Validate on server
2. **Use RLS**: Database-level security
3. **Secure tokens**: Proper storage
4. **Input validation**: Sanitize user input

## Additional Resources

- [Developer Guide](Developer-Guide.md)
- [API Reference](API-Reference.md)
- [Security Documentation](../Technical-Reference/Security-and-Privacy.md)

---

**Last Updated**: December 2024
