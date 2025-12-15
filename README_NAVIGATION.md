# 🧭 Navigation System - Quick Start Guide

## Overview

The Lunavo platform uses a **hybrid navigation system** that adapts to user roles and device types. This guide will help you understand and use the navigation system.

---

## 🚀 Quick Start

### Import Navigation Components

```tsx
// Import from central location
import { SidebarNavigation, DrawerMenu, DrawerHeader, FAB } from '@/app/components/navigation';
import { DataTable } from '@/app/components/web';
import { canAccessRoute, getDefaultRoute, isMobile, isWeb } from '@/app/utils/navigation';
```

### Basic Usage Examples

#### Add Drawer Menu to Screen
```tsx
import { DrawerMenu } from '@/app/components/navigation';
import { useState } from 'react';

const [drawerVisible, setDrawerVisible] = useState(false);

<DrawerMenu
  visible={drawerVisible}
  onClose={() => setDrawerVisible(false)}
  role={userRole}
/>
```

#### Add FAB Button
```tsx
import { FAB } from '@/app/components/navigation';
import { Platform } from 'react-native';

{Platform.OS !== 'web' && (
  <FAB
    icon="add"
    label="Create Post"
    onPress={() => router.push('/create-post')}
    position="bottom-right"
  />
)}
```

#### Check Route Access
```tsx
import { canAccessRoute, isMobile } from '@/app/utils/navigation';

const canAccess = canAccessRoute(
  userRole,
  '/admin/dashboard',
  isMobile ? 'mobile' : 'web'
);

if (!canAccess) {
  router.replace('/unauthorized');
}
```

---

## 📖 Documentation

### For Developers
- **`DEVELOPER_GUIDE.md`** - Complete developer reference
- **`NAVIGATION_QUICK_REFERENCE.md`** - Quick lookup guide
- **`DATA_TABLE_USAGE.md`** - Data table examples

### For Project Management
- **`FINAL_IMPLEMENTATION_SUMMARY.md`** - Complete overview
- **`PROJECT_COMPLETION_REPORT.md`** - Project status
- **`DEPLOYMENT_CHECKLIST.md`** - Deployment guide

---

## 🎯 Key Concepts

### Role-Based Access
Each user role has specific route access:
- **Students**: Student routes only
- **Peer Educators**: Student + Peer Educator routes
- **Counselors**: Counselor routes only (no forum)
- **Admin**: Full access
- **Student Affairs**: Web-only, analytics focus

### Device Detection
- **Mobile**: Bottom tabs + Drawer menu + FAB
- **Web**: Sidebar (Admin/Student Affairs) or Tabs (others)

### Navigation Types
1. **Bottom Tabs** - Core actions (mobile)
2. **Drawer Menu** - Secondary actions (mobile)
3. **Sidebar** - Power user navigation (web)
4. **FAB** - Primary action button (mobile)

---

## 🔧 Common Tasks

### Add New Route
1. Create screen file
2. Add to `app/_layout.tsx`
3. Update `ROUTE_ACCESS` in `app/utils/navigation.ts`

### Add Navigation Item
1. Update drawer menu: `app/components/navigation/drawer-menu.tsx`
2. Update sidebar: `app/components/navigation/sidebar-navigation.tsx`
3. Add route to access matrix

### Check User Role
```tsx
import { getCurrentUser } from '@/lib/database';
import { UserRole } from '@/lib/permissions';

const user = await getCurrentUser();
const role = user?.role as UserRole;
```

---

## ⚠️ Important Notes

1. **Student Affairs is Web-Only** - Mobile access is blocked
2. **Counselors Cannot Access Forum** - Forum tab is hidden
3. **Route Protection is Automatic** - Unauthorized access redirects
4. **Components are Platform-Aware** - Automatically show/hide based on platform

---

## 🆘 Troubleshooting

### Route Not Working?
- Check route is in `ROUTE_ACCESS` matrix
- Verify route is registered in `_layout.tsx`
- Check user role is correct
- Verify device type (mobile vs web)

### Component Not Showing?
- Check `Platform.OS` conditions
- Verify role-based conditions
- Check component is imported
- Verify component is in render tree

### Navigation Issues?
- Check route guards in `_layout.tsx`
- Verify route paths are correct
- Check user authentication status
- Review navigation utilities

---

## 📞 Support

For questions or issues:
1. Check `DEVELOPER_GUIDE.md`
2. Review `NAVIGATION_QUICK_REFERENCE.md`
3. Check component source files
4. Review route access matrix

---

**Version**: 1.0.0  
**Last Updated**: {{ current_date }}





