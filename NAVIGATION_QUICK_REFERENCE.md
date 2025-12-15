# 🚀 Navigation System - Quick Reference Card

## Role Access Matrix

| Role | Mobile | Web | Navigation Type | Special Notes |
|------|--------|-----|-----------------|---------------|
| **Student** | ✅ | ✅ | Bottom Tabs | Full access to student features |
| **Peer Educator** | ✅ | ✅ | Bottom Tabs | Student home + Dashboard card |
| **Peer Educator Exec** | ✅ | ✅ | Bottom Tabs | Executive features added |
| **Moderator** | ✅ | ✅ | Bottom Tabs | Moderation access |
| **Counselor** | ✅ | ✅ | Bottom Tabs | **NO Forum** - Escalations only |
| **Life Coach** | ✅ | ✅ | Bottom Tabs | **NO Forum** - Escalations only |
| **Admin** | ⚠️ Limited | ✅ Full | Sidebar (Web) | Full access, web-optimized |
| **Student Affairs** | ❌ **BLOCKED** | ✅ Only | Sidebar (Web) | **Web ONLY** - Analytics focus |

---

## Navigation Components

### Bottom Tabs (Mobile)
- **Used by**: Students, Peer Educators, Counselors
- **Tabs**: Home, Forum, Chat, Resources, Profile
- **Role-aware**: Tabs hide based on role

### Drawer Menu (Mobile)
- **Used by**: All mobile roles
- **Access**: Menu button in header
- **Contains**: Settings, Help, Privacy, Feedback, About + Role-specific items

### Sidebar (Web)
- **Used by**: Admin, Student Affairs
- **Features**: Collapsible, active route highlighting
- **Always visible** on desktop

### FAB (Mobile)
- **Used by**: All mobile roles
- **Purpose**: Primary action button
- **Positions**: bottom-right (default), bottom-left, top-right, top-left

---

## Route Protection

### Quick Check
```tsx
import { canAccessRoute, isMobile, isWeb } from '@/app/utils/navigation';

const canAccess = canAccessRoute(
  userRole, 
  '/your-route', 
  isMobile ? 'mobile' : 'web'
);
```

### Student Affairs Mobile Block
```tsx
import { isStudentAffairsMobileBlocked } from '@/app/utils/navigation';

if (isStudentAffairsMobileBlocked(role, platform)) {
  // Redirect to /web-required
}
```

---

## Common Patterns

### Add FAB to Screen
```tsx
import { FAB as FABButton } from '@/app/components/navigation/fab-button';

{Platform.OS !== 'web' && (
  <FABButton
    icon="add"
    label="Create Post"
    onPress={() => router.push('/create-post')}
    position="bottom-right"
  />
)}
```

### Add Drawer Header
```tsx
import { DrawerHeader } from '@/app/components/navigation/drawer-header';

<DrawerHeader
  title="Screen Title"
  onMenuPress={() => setDrawerVisible(true)}
  rightAction={{
    icon: 'settings',
    onPress: () => router.push('/settings'),
  }}
/>
```

### Role-Based Rendering
```tsx
import { getCurrentUser } from '@/lib/database';
import { UserRole } from '@/lib/permissions';

const [userRole, setUserRole] = useState<UserRole | null>(null);

useEffect(() => {
  getCurrentUser().then(user => {
    if (user) setUserRole(user.role as UserRole);
  });
}, []);

{userRole === 'admin' && <AdminComponent />}
```

### Use Data Table (Web)
```tsx
import { DataTable, Column } from '@/app/components/web/data-table';

const columns: Column<User>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
];

<DataTable
  data={users}
  columns={columns}
  keyExtractor={(user) => user.id}
  searchable
  pagination
/>
```

---

## Route Access Rules

### Students
- ✅ All student routes
- ❌ Admin, Peer Educator, Counselor, Student Affairs routes

### Peer Educators
- ✅ Student routes + Peer Educator routes
- ❌ Admin, Counselor, Student Affairs routes

### Counselors/Life Coaches
- ✅ Counselor routes, Escalations
- ❌ Forum, Admin, Peer Educator, Student Affairs routes

### Admin
- ✅ **Full access** to all routes

### Student Affairs
- ✅ Analytics, Trends, Reports, Resources
- ❌ Forum, Chat, Admin routes
- ❌ **Mobile completely blocked**

---

## File Locations

### Navigation Components
- `app/components/navigation/sidebar-navigation.tsx` - Web sidebar
- `app/components/navigation/drawer-menu.tsx` - Mobile drawer
- `app/components/navigation/drawer-header.tsx` - Mobile header
- `app/components/navigation/fab-button.tsx` - FAB component

### Web Components
- `app/components/web/data-table.tsx` - Data table

### Utilities
- `app/utils/navigation.ts` - Navigation utilities

### Route Screens
- `app/web-required.tsx` - Student Affairs mobile block
- `app/help.tsx` - Help & Support
- `app/privacy.tsx` - Privacy Policy
- `app/feedback.tsx` - Feedback
- `app/about.tsx` - About

---

## Quick Troubleshooting

### Route Not Accessible?
1. Check `ROUTE_ACCESS` matrix in `app/utils/navigation.ts`
2. Verify route is not in `blocked` array
3. Check device type (mobile vs web)
4. Verify user role is correct

### Component Not Showing?
1. Check `Platform.OS` condition
2. Check role-based conditions
3. Verify component is imported
4. Check component is in render tree

### Navigation Not Working?
1. Verify route is registered in `_layout.tsx`
2. Check route path is correct
3. Verify navigation guard is not blocking
4. Check user role is loaded

---

## Key Functions

### Navigation Utilities
```tsx
// Check route access
canAccessRoute(role, route, platform)

// Get default route
getDefaultRoute(role, platform)

// Check mobile block
isStudentAffairsMobileBlocked(role, platform)

// Device detection
isWeb, isMobile, isDesktop, isTablet
```

---

**Version**: 1.0.0  
**Last Updated**: {{ current_date }}






