# 🛠️ Developer Guide - Role-Based Navigation System

## Quick Reference

### Adding a New Route

1. **Create the screen file** in the appropriate directory
2. **Add route to `app/_layout.tsx`**:
   ```tsx
   <Stack.Screen 
     name="your-route" 
     options={{ 
       headerShown: false,
       presentation: 'card',
     }} 
   />
   ```
3. **Update route access matrix** in `app/utils/navigation.ts`:
   ```tsx
   student: {
     mobile: ['/your-route', ...],
     web: ['/your-route', ...],
     blocked: [...],
   }
   ```

### Adding a FAB Button

```tsx
import { FAB as FABButton } from '@/app/components/navigation/fab-button';

// In your component
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

### Adding Drawer Menu Item

Update `app/components/navigation/drawer-menu.tsx`:

```tsx
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

```tsx
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

### Checking Route Access

```tsx
import { canAccessRoute, isMobile, isWeb } from '@/app/utils/navigation';

const canAccess = canAccessRoute(
  userRole, 
  '/your-route', 
  isMobile ? 'mobile' : 'web'
);
```

### Role-Based Rendering

```tsx
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

---

## Common Patterns

### Mobile-Only Component

```tsx
import { Platform } from 'react-native';

{Platform.OS !== 'web' && (
  <MobileOnlyComponent />
)}
```

### Web-Only Component

```tsx
import { Platform } from 'react-native';

{Platform.OS === 'web' && (
  <WebOnlyComponent />
)}
```

### Role-Based Tab Hiding

Update `app/(tabs)/_layout.tsx`:

```tsx
const shouldShowTab = (tabName: string): boolean => {
  if (!userRole) return true;
  
  if (tabName === 'your-tab' && userRole === 'blocked-role') {
    return false;
  }
  
  return true;
};

// In tab definition
<Tabs.Screen
  name="your-tab"
  options={{
    ...(shouldShowTab('your-tab') ? {} : { href: null }),
  }}
/>
```

---

## File Structure

```
app/
├── _layout.tsx                    # Root layout with route protection
├── (tabs)/
│   ├── _layout.tsx                # Tab layout (role-aware)
│   ├── index.tsx                  # Home screen
│   ├── forum.tsx                  # Forum screen
│   └── ...
├── admin/
│   ├── _layout.tsx                # Admin layout (sidebar on web)
│   └── dashboard.tsx              # Admin dashboard
├── student-affairs/
│   ├── _layout.tsx                # Student Affairs layout (sidebar on web)
│   └── dashboard.tsx              # Student Affairs dashboard
├── components/
│   └── navigation/
│       ├── sidebar-navigation.tsx # Web sidebar
│       ├── drawer-menu.tsx        # Mobile drawer
│       ├── drawer-header.tsx      # Mobile header
│       └── fab-button.tsx         # FAB component
├── utils/
│   └── navigation.ts              # Navigation utilities
├── help.tsx                       # Help screen
├── privacy.tsx                    # Privacy screen
├── feedback.tsx                   # Feedback screen
├── about.tsx                      # About screen
└── web-required.tsx               # Student Affairs mobile block
```

---

## Role Definitions

### Available Roles
- `student`
- `peer-educator`
- `peer-educator-executive`
- `moderator`
- `counselor`
- `life-coach`
- `student-affairs`
- `admin`

### Role Hierarchy
1. **Student** - Base level, most restricted
2. **Peer Educator** - Can help students
3. **Peer Educator Executive** - Can manage peer educators
4. **Moderator** - Can moderate content
5. **Counselor/Life Coach** - Professional support
6. **Student Affairs** - Analytics and insights
7. **Admin** - Full access

---

## Testing Checklist

### Route Protection
- [ ] Test each role can access allowed routes
- [ ] Test each role is blocked from restricted routes
- [ ] Test Student Affairs mobile blocking
- [ ] Test automatic redirects

### Navigation Components
- [ ] Test sidebar on web (Admin/Student Affairs)
- [ ] Test drawer menu on mobile
- [ ] Test FAB buttons on mobile
- [ ] Test tab visibility based on role

### User Experience
- [ ] Test role-specific content
- [ ] Test quick actions
- [ ] Test responsive design
- [ ] Test navigation flow

---

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

---

## Best Practices

1. **Always check role before rendering** - Don't assume user role
2. **Use Platform.OS for platform-specific code** - Don't hardcode
3. **Keep route access matrix updated** - When adding new routes
4. **Test on both mobile and web** - Different navigation systems
5. **Use role guards** - Don't rely only on UI hiding
6. **Follow navigation patterns** - Consistency is key

---

## Support

For questions or issues:
1. Check this guide
2. Review `FINAL_IMPLEMENTATION_SUMMARY.md`
3. Check route access matrix in `app/utils/navigation.ts`
4. Review component implementations

---

**Last Updated**: {{ current_date }}

**Version**: 1.0.0


