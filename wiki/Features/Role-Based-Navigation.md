# Role-Based Navigation

Complete guide to the role-based navigation system in Lunavo.

## Overview

The Lunavo platform uses a sophisticated role-based navigation system that adapts to both user role and device type (mobile/web). Different roles see different navigation options and have access to different routes.

## Navigation Strategy

### Hybrid Navigation System

- **Bottom Tabs**: Students, Peer Educators, Counselors (Mobile)
- **Drawer Menu**: All mobile roles (Secondary actions)
- **Sidebar**: Admin & Student Affairs (Web only)
- **FAB**: Mobile primary actions
- **Top Navigation**: Web dashboards

## User Roles and Navigation

### 👨‍🎓 Students

**Tabs**: Home, Forum, Chat, Resources, Profile

**Home**: Student dashboard with stats, mood check-in, quick actions

**Drawer**: Settings, Help, Privacy, Feedback, About

**FAB**: "Ask for Help" (create post)

**Access**: All student features

**Blocked**: Admin, Peer Educator, Counselor, Student Affairs routes

### 👨‍🏫 Peer Educators

**Tabs**: Home, Forum, Chat, Resources, Profile

**Home**: Student home + Peer Educator Dashboard card

**Drawer**: Peer Dashboard, Meetings, Club Info + Common items

**FAB**: "Respond" (respond to posts)

**Access**: Peer Educator dashboard, posts, meetings, resources

**Blocked**: Admin, Counselor, Student Affairs routes

### 👨‍💼 Peer Educator Executives

**Everything Peer Educator has +**

**Drawer**: Executive Dashboard, Manage Meetings, Manage Members

**Access**: Executive features, member management, announcements

### 🛡️ Moderators

**Tabs**: Home, Forum, Moderation, Resources, Profile

**Drawer**: Moderation Queue, Reports + Common items

**Access**: Admin Moderation, Admin Reports

**Can**: Moderate content, review reports, escalate posts

### 👨‍⚕️ Counselors / Life Coaches

**Tabs**: Dashboard, Escalations, Messages, Resources, Profile

**🚫 NO Forum Tab**

**Drawer**: Counselor Dashboard, Escalations + Common items

**Home**: Escalated cases overview

**Access**: Only escalated posts

**Blocked**: General forum, Admin, Peer Educator, Student Affairs

### 👨‍💻 Admin

**Web**: Sidebar (Dashboard, Analytics, Moderation, Escalations, Reports, Users, Resources, Settings)

**Mobile**: Limited tabs

**Drawer**: Admin Dashboard, Analytics, Moderation, User Management + Common items

**Access**: Full access to all features

**Blocked**: None

### 🏛️ Student Affairs

**🚫 Mobile**: BLOCKED (redirects to web-required screen)

**Web**: Sidebar (Dashboard, Analytics, Trends, Reports, Resources, Settings)

**🚫 NO Forum or Chat access**

**Access**: Analytics, trends, resource management

**Blocked**: Forum, Chat, Admin, Peer Educator, Counselor routes

## Route Protection

### Access Control Matrix

Routes are protected based on:
- User role
- Device type (mobile/web)
- Route access matrix in `app/utils/navigation.ts`

### Route Access Functions

```typescript
import { canAccessRoute, getDefaultRoute } from '@/app/utils/navigation';

// Check if user can access route
const canAccess = canAccessRoute(
  userRole, 
  '/admin/dashboard', 
  isMobile ? 'mobile' : 'web'
);

// Get default route for role
const defaultRoute = getDefaultRoute(userRole, isMobile ? 'mobile' : 'web');
```

### Automatic Redirects

The system automatically redirects users who try to access unauthorized routes:

- Students trying to access admin routes → Redirected to home
- Student Affairs on mobile → Redirected to web-required screen
- Counselors trying to access forum → Redirected to dashboard

## Navigation Components

### Sidebar Navigation (Web)

**Location**: `app/components/navigation/sidebar-navigation.tsx`

- Collapsible sidebar for Admin/Student Affairs
- Role-specific navigation items
- Active route highlighting
- Web-only (hidden on mobile)

### Drawer Menu (Mobile)

**Location**: `app/components/navigation/drawer-menu.tsx`

- Mobile secondary navigation
- Role-specific menu items
- Settings, Help, Privacy, Feedback, About
- Slide-in animation

### Drawer Header (Mobile)

**Location**: `app/components/navigation/drawer-header.tsx`

- Mobile header with menu button
- Customizable title and actions
- Mobile-only (hidden on web)

### FAB Component (Mobile)

**Location**: `app/components/navigation/fab-button.tsx`

- Floating Action Button
- Customizable icon, label, position
- Mobile-only (hidden on web)

## Adding New Routes

### 1. Create Screen

Create your screen file in the appropriate directory.

### 2. Add to Layout

Add route to `app/_layout.tsx`:

```typescript
<Stack.Screen 
  name="your-route" 
  options={{ 
    headerShown: false,
    presentation: 'card',
  }} 
/>
```

### 3. Update Route Access

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

## Adding Navigation Items

### Adding Drawer Menu Item

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

### Adding Sidebar Item

Update `app/components/navigation/sidebar-navigation.tsx`:

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

### Adding FAB Button

```typescript
import { FAB as FABButton } from '@/app/components/navigation/fab-button';

{Platform.OS !== 'web' && (
  <FABButton
    icon="add"
    label="Your Action"
    onPress={() => router.push('/your-route')}
    position="bottom-right"
    color={colors.primary}
  />
)}
```

## Platform-Specific Navigation

### Mobile-Only Components

```typescript
import { Platform } from 'react-native';

{Platform.OS !== 'web' && (
  <MobileOnlyComponent />
)}
```

### Web-Only Components

```typescript
import { Platform } from 'react-native';

{Platform.OS === 'web' && (
  <WebOnlyComponent />
)}
```

## Role-Based Rendering

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

## Tab Visibility

Tabs can be hidden based on role. Update `app/(tabs)/_layout.tsx`:

```typescript
const shouldShowTab = (tabName: string): boolean => {
  if (!userRole) return true;
  
  if (tabName === 'forum' && userRole === 'counselor') {
    return false; // Hide forum for counselors
  }
  
  return true;
};

<Tabs.Screen
  name="forum"
  options={{
    ...(shouldShowTab('forum') ? {} : { href: null }),
  }}
/>
```

## Testing Navigation

### Checklist

- [ ] Test each role can access allowed routes
- [ ] Test each role is blocked from restricted routes
- [ ] Test Student Affairs mobile blocking
- [ ] Test automatic redirects
- [ ] Test sidebar on web (Admin/Student Affairs)
- [ ] Test drawer menu on mobile
- [ ] Test FAB buttons on mobile
- [ ] Test tab visibility based on role

## Troubleshooting

### Route Not Accessible

1. Check route is in `ROUTE_ACCESS` matrix
2. Check route is not in `blocked` array
3. Check device type (mobile vs web)
4. Check role is correct

### Component Not Showing

1. Check Platform.OS condition
2. Check role-based conditions
3. Check component is imported
4. Check component is in render tree

### Navigation Not Working

1. Check route is registered in `_layout.tsx`
2. Check route path is correct
3. Check navigation guard is not blocking
4. Check user role is loaded

## Best Practices

1. **Always check role before rendering** - Don't assume user role
2. **Use Platform.OS for platform-specific code** - Don't hardcode
3. **Keep route access matrix updated** - When adding new routes
4. **Test on both mobile and web** - Different navigation systems
5. **Use role guards** - Don't rely only on UI hiding
6. **Follow navigation patterns** - Consistency is key

## Additional Resources

- [Developer Guide](../Development/Developer-Guide.md)
- [Authentication Documentation](Authentication.md)
- [Implementation Status](../Implementation-Status/Current-Status.md)

---

**Last Updated**: December 2024
