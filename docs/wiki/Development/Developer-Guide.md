# Developer Guide

Complete reference guide for developing on the Lunavo platform.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Adding New Routes](#adding-new-routes)
3. [Navigation System](#navigation-system)
4. [Component Patterns](#component-patterns)
5. [Database Operations](#database-operations)
6. [Authentication](#authentication)
7. [Best Practices](#best-practices)

## Project Structure

```
Lunavo/
├── app/                          # Application code
│   ├── (tabs)/                  # Tab navigation screens
│   │   ├── index.tsx           # Home screen
│   │   ├── forum.tsx           # Forum screen
│   │   ├── chat.tsx            # Chat screen
│   │   ├── resources.tsx       # Resources screen
│   │   └── profile.tsx         # Profile screen
│   ├── admin/                   # Admin screens
│   ├── auth/                    # Authentication screens
│   ├── components/              # Reusable components
│   │   └── navigation/         # Navigation components
│   ├── utils/                   # Utility functions
│   └── types/                   # TypeScript types
├── lib/                          # Core libraries
│   ├── auth.ts                 # Authentication functions
│   ├── database.ts             # Database operations
│   ├── supabase.ts             # Supabase client
│   ├── permissions.ts          # Permission system
│   └── ...
├── hooks/                        # Custom React hooks
├── supabase/                    # Database migrations
└── assets/                      # Static assets
```

## Adding New Routes

### 1. Create the Screen File

Create your screen in the appropriate directory:

```typescript
// app/your-feature/screen.tsx
import { View, Text } from 'react-native';

export default function YourScreen() {
  return (
    <View>
      <Text>Your Screen</Text>
    </View>
  );
}
```

### 2. Add Route to Layout

Add the route to `app/_layout.tsx`:

```typescript
<Stack.Screen 
  name="your-route" 
  options={{ 
    headerShown: false,
    presentation: 'card',
  }} 
/>
```

### 3. Update Route Access Matrix

Update `app/utils/navigation.ts`:

```typescript
const ROUTE_ACCESS = {
  student: {
    mobile: ['/your-route', ...],
    web: ['/your-route', ...],
    blocked: [...],
  },
  // ... other roles
};
```

## Navigation System

### Route Protection

Routes are automatically protected based on user role. See [Role-Based Navigation](../Features/Role-Based-Navigation.md) for details.

### Navigation Utilities

```typescript
import { canAccessRoute, isMobile, isWeb } from '@/app/utils/navigation';

// Check if user can access route
const canAccess = canAccessRoute(
  userRole, 
  '/your-route', 
  isMobile ? 'mobile' : 'web'
);

// Get default route for role
const defaultRoute = getDefaultRoute(userRole, isMobile ? 'mobile' : 'web');
```

### Navigation Guards

Use hooks for route protection:

```typescript
import { usePermissionGuard, useRoleGuard } from '@/hooks/use-auth-guard';

// Permission-based guard
const { user, loading } = usePermissionGuard('canViewAdminDashboard');

// Role-based guard
const { user, loading } = useRoleGuard(['admin', 'moderator']);
```

## Component Patterns

### Platform-Specific Components

```typescript
import { Platform } from 'react-native';

// Mobile-only component
{Platform.OS !== 'web' && (
  <MobileOnlyComponent />
)}

// Web-only component
{Platform.OS === 'web' && (
  <WebOnlyComponent />
)}
```

### Role-Based Rendering

```typescript
import { getCurrentUser } from '@/lib/database';
import { UserRole } from '@/lib/permissions';

const [userRole, setUserRole] = useState<UserRole | null>(null);

useEffect(() => {
  getCurrentUser().then(user => {
    if (user) {
      setUserRole(user.role as UserRole);
    }
  });
}, []);

// Conditional rendering
{userRole === 'admin' && (
  <AdminOnlyComponent />
)}
```

### Loading States

```typescript
import { ActivityIndicator } from 'react-native';

const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);

if (loading) {
  return <ActivityIndicator size="large" />;
}

return <YourContent data={data} />;
```

## Database Operations

### Using Database Functions

```typescript
import { 
  getPosts, 
  createPost, 
  updatePost, 
  deletePost 
} from '@/lib/database';

// Get posts
const posts = await getPosts({ category: 'academic' });

// Create post
const newPost = await createPost({
  title: 'My Post',
  content: 'Post content',
  category: 'academic',
  author_id: userId,
});

// Update post
await updatePost(postId, { title: 'Updated Title' });

// Delete post
await deletePost(postId);
```

### Error Handling

```typescript
try {
  const result = await createPost(postData);
  // Handle success
} catch (error) {
  console.error('Error creating post:', error);
  // Show error to user
  Alert.alert('Error', 'Failed to create post');
}
```

## Authentication

### Sign Up

```typescript
import { signUp } from '@/lib/auth';

const result = await signUp(email, password, {
  student_number: '12345',
  name: 'John Doe',
});
```

### Sign In

```typescript
import { signIn } from '@/lib/auth';

const result = await signIn(email, password);
```

### Get Current User

```typescript
import { getCurrentUser } from '@/lib/database';

const user = await getCurrentUser();
if (user) {
  console.log('User:', user.email, user.role);
}
```

### Sign Out

```typescript
import { signOut } from '@/lib/auth';

await signOut();
```

## Adding FAB Buttons

Floating Action Buttons appear on mobile screens:

```typescript
import { FAB as FABButton } from '@/app/components/navigation/fab-button';

{Platform.OS !== 'web' && (
  <FABButton
    icon="add"
    label="Create Post"
    onPress={() => router.push('/create-post')}
    position="bottom-right"
    color={colors.primary}
  />
)}
```

## Adding Drawer Menu Items

Update `app/components/navigation/drawer-menu.tsx`:

```typescript
const ROLE_SPECIFIC_ITEMS: Record<string, DrawerItem[]> = {
  'your-role': [
    { 
      id: 'your-item', 
      label: 'Your Item', 
      icon: 'your-icon', 
      route: '/your-route', 
      section: 'role' 
    },
  ],
};
```

## Adding Sidebar Items

For Admin/Student Affairs web layouts, update `app/components/navigation/sidebar-navigation.tsx`:

```typescript
const ADMIN_ITEMS: SidebarItem[] = [
  { 
    id: 'your-item', 
    label: 'Your Item', 
    icon: 'your-icon', 
    route: '/your-route', 
    section: 'main' 
  },
];
```

## Best Practices

### 1. Always Check Role Before Rendering

```typescript
// ✅ Good
{userRole === 'admin' && <AdminComponent />}

// ❌ Bad
<AdminComponent /> // Will break for non-admins
```

### 2. Use Platform.OS for Platform-Specific Code

```typescript
// ✅ Good
{Platform.OS !== 'web' && <MobileComponent />}

// ❌ Bad
// Hardcoding platform checks
```

### 3. Keep Route Access Matrix Updated

When adding new routes, always update `app/utils/navigation.ts`:

```typescript
// ✅ Good - Updated route access
student: {
  mobile: ['/new-route', ...],
}

// ❌ Bad - Route not in matrix
// Route will be blocked by default
```

### 4. Use TypeScript Types

```typescript
// ✅ Good
import { User, Post } from '@/app/types';

const user: User = await getCurrentUser();

// ❌ Bad
const user: any = await getCurrentUser();
```

### 5. Handle Loading and Error States

```typescript
// ✅ Good
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

// ❌ Bad
// No loading/error handling
```

### 6. Use Environment Variables

```typescript
// ✅ Good
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

// ❌ Bad
const apiUrl = 'https://hardcoded-url.com';
```

### 7. Follow File Naming Conventions

- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Screens: `kebab-case.tsx` (e.g., `user-profile.tsx`)

## Testing Checklist

When adding new features:

- [ ] Test on mobile (iOS/Android)
- [ ] Test on web
- [ ] Test with different user roles
- [ ] Test route protection
- [ ] Test loading states
- [ ] Test error handling
- [ ] Test navigation flow
- [ ] Check TypeScript types
- [ ] Review code style

## Common Patterns

### Fetching Data with Loading

```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchData() {
    try {
      setLoading(true);
      const result = await getData();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, []);
```

### Real-time Subscriptions

```typescript
import { subscribeToPosts } from '@/lib/realtime';

useEffect(() => {
  const subscription = subscribeToPosts((post) => {
    // Handle new post
    setPosts(prev => [post, ...prev]);
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## Additional Resources

- [Role-Based Navigation Guide](../Features/Role-Based-Navigation.md)
- [Authentication Documentation](../Features/Authentication.md)
- [API Reference](API-Reference.md)
- [Architecture Overview](Architecture.md)

---

**Need Help?** Check the [Troubleshooting Guide](../Technical-Reference/Troubleshooting.md) or review existing code examples in the codebase.
