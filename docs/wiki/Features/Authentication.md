# Authentication System

Complete guide to the Lunavo authentication system, including user roles, permissions, and security features.

## Overview

The Lunavo platform uses Supabase Authentication for secure user authentication and session management. The system supports email/password authentication with role-based access control.

## User Roles

The platform supports 8 distinct user roles:

1. **Student** - Base user with access to core features
2. **Peer Educator** - Provides peer support to students
3. **Peer Educator Executive** - Manages peer educators
4. **Moderator** - Content moderation and reporting
5. **Counselor** - Professional mental health support
6. **Life Coach** - Life coaching and guidance
7. **Student Affairs** - Analytics and trend analysis (Web-only)
8. **Admin** - Full system access and management

## Authentication Flow

### Registration

1. User enters email and password
2. Password strength validation
3. Account created in Supabase Auth
4. Email verification (optional)
5. Student verification (CUT student number)
6. User profile created in database
7. Default role assigned (usually "student")

### Login

1. User enters email and password
2. Credentials verified by Supabase
3. Session token generated
4. User data loaded from database
5. Navigate to role-appropriate default route

### Session Management

- Sessions are managed by Supabase
- Tokens stored securely
- Automatic token refresh
- Session persistence across app restarts

## Authentication Screens

### Login Screen (`app/auth/login.tsx`)

Features:
- Email/password input
- "Forgot password?" link
- "Sign up" link
- Error handling
- Loading states
- Password visibility toggle

### Register Screen (`app/auth/register.tsx`)

Features:
- Email input
- Password input with strength indicator
- Confirm password validation
- Student number input (optional)
- Terms & conditions checkbox
- Form validation
- Password visibility toggles

### Verify Student Screen (`app/auth/verify-student.tsx`)

Features:
- Student number input
- Name input
- Department/Faculty selection
- Year of study selection
- CUT-specific verification
- Success confirmation

### Forgot Password Screen (`app/auth/forgot-password.tsx`)

Features:
- Email input
- Reset link sending
- Success confirmation
- Back to login

### Reset Password Screen (`app/auth/reset-password.tsx`)

Features:
- New password input
- Confirm password validation
- Token validation (from URL)
- Success redirect

## Authentication Functions

### Sign Up

```typescript
import { signUp } from '@/lib/auth';

const result = await signUp(email, password, {
  student_number: '12345',
  name: 'John Doe',
  department: 'Engineering',
  year: 2,
});
```

### Sign In

```typescript
import { signIn } from '@/lib/auth';

const result = await signIn(email, password);
```

### Sign Out

```typescript
import { signOut } from '@/lib/auth';

await signOut();
```

### Get Current User

```typescript
import { getCurrentUser } from '@/lib/database';

const user = await getCurrentUser();
if (user) {
  console.log(user.email, user.role);
}
```

### Get Session

```typescript
import { getSession } from '@/lib/auth';

const session = await getSession();
if (session) {
  console.log('User is authenticated');
}
```

### Reset Password

```typescript
import { resetPassword } from '@/lib/auth';

await resetPassword(email);
// User receives password reset email
```

### Update Password

```typescript
import { updatePassword } from '@/lib/auth';

await updatePassword(newPassword);
```

### Auth State Changes

```typescript
import { onAuthStateChange } from '@/lib/auth';

const subscription = onAuthStateChange((user) => {
  if (user) {
    console.log('User signed in:', user.email);
  } else {
    console.log('User signed out');
  }
});

// Unsubscribe
subscription.unsubscribe();
```

## Permission System

### Permission Functions

Located in `lib/permissions.ts`:

- `canViewDashboard(role)` - Can view dashboard
- `canModerate(role)` - Can moderate content
- `canEscalate(role)` - Can escalate posts
- `canManageMeetings(role)` - Can manage meetings
- `canViewAnalytics(role)` - Can view analytics
- `canManageUsers(role)` - Can manage users
- `canViewEscalations(role)` - Can view escalations
- `canRespondAsVolunteer(role)` - Can respond as volunteer
- `canCreateResources(role)` - Can create resources
- `canViewAdminDashboard(role)` - Can view admin dashboard
- `canViewStudentAffairsDashboard(role)` - Can view Student Affairs dashboard
- `canViewPeerEducatorDashboard(role)` - Can view peer educator dashboard

### Using Permissions

```typescript
import { hasPermission, getPermissions } from '@/lib/permissions';

// Check specific permission
if (hasPermission(user, 'canModerate')) {
  // Show moderation features
}

// Get all permissions for role
const permissions = getPermissions(user.role);
```

## Navigation Guards

### Permission Guard Hook

```typescript
import { usePermissionGuard } from '@/hooks/use-auth-guard';

function AdminScreen() {
  const { user, loading } = usePermissionGuard('canViewAdminDashboard');
  
  if (loading) return <LoadingSpinner />;
  if (!user) return null; // Will redirect
  
  return <AdminContent />;
}
```

### Role Guard Hook

```typescript
import { useRoleGuard } from '@/hooks/use-auth-guard';

function CounselorScreen() {
  const { user, loading } = useRoleGuard(['counselor', 'life-coach', 'admin']);
  
  if (loading) return <LoadingSpinner />;
  
  return <CounselorContent />;
}
```

### HOC Guards

```typescript
import { withRoleGuard } from '@/lib/navigation-guards';

function AdminDashboard() {
  return <AdminContent />;
}

export default withRoleGuard(AdminDashboard, ['admin']);
```

## Security Features

### Password Security

- Minimum password requirements
- Password strength indicator
- Secure password hashing (handled by Supabase)
- Password reset via secure email link

### Email Validation

- Email format validation
- Email uniqueness check
- Email verification (optional)
- Secure email change process

### Session Security

- JWT tokens
- Secure token storage
- Automatic token refresh
- Session timeout handling

### Row Level Security (RLS)

- Database-level access control
- User can only access their own data
- Role-based data access
- Admin override capabilities

## Student Verification

### CUT Student Verification

To ensure only CUT students can access the platform:

1. **Email Verification**: User must verify email
2. **Student Number**: User provides CUT student number
3. **Verification Process**: 
   - Student enters number, name, department, year
   - System marks account as "verified"
   - **Future**: Integration with CUT student database API

### Verification Screen

Located at `app/auth/verify-student.tsx`:

- Student number input
- Name input
- Department selection (7 options)
- Year of study (1-5)
- Verification confirmation

## Error Handling

### Common Errors

**Invalid credentials**:
```typescript
try {
  await signIn(email, password);
} catch (error) {
  if (error.message.includes('Invalid login')) {
    Alert.alert('Error', 'Invalid email or password');
  }
}
```

**Email already exists**:
```typescript
try {
  await signUp(email, password, studentData);
} catch (error) {
  if (error.message.includes('already registered')) {
    Alert.alert('Error', 'Email already registered');
  }
}
```

**Network errors**:
```typescript
try {
  await signIn(email, password);
} catch (error) {
  if (error.message.includes('network')) {
    Alert.alert('Error', 'Network error. Please check your connection.');
  }
}
```

## Best Practices

### ✅ Do:

- Always check authentication state before accessing protected routes
- Use navigation guards for route protection
- Handle errors gracefully
- Show loading states during auth operations
- Validate input on client and server

### ❌ Don't:

- Don't store passwords in plain text
- Don't expose API keys in client code
- Don't bypass permission checks
- Don't trust client-side validation alone
- Don't hardcode user roles

## Additional Resources

- [Role-Based Navigation](../Features/Role-Based-Navigation.md)
- [Security Documentation](../Technical-Reference/Security-and-Privacy.md)
- [Developer Guide](../Development/Developer-Guide.md)

---

**Last Updated**: December 2024
