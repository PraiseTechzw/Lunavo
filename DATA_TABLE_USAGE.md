# 📊 Data Table Component - Usage Guide

## Overview

The `DataTable` component is a web-optimized, feature-rich data table with sorting, filtering, pagination, and search capabilities.

## Features

- ✅ **Sorting** - Click column headers to sort
- ✅ **Search/Filter** - Search across all columns
- ✅ **Pagination** - Navigate through large datasets
- ✅ **Custom Rendering** - Custom cell renderers
- ✅ **Row Actions** - Click rows to navigate
- ✅ **Responsive** - Horizontal scroll for wide tables
- ✅ **Web Only** - Automatically hidden on mobile

## Basic Usage

```tsx
import { DataTable } from '@/app/components/web/data-table';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

const columns: Column<User>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { 
    key: 'createdAt', 
    label: 'Created', 
    sortable: true,
    render: (value) => format(new Date(value), 'MMM dd, yyyy')
  },
];

<DataTable
  data={users}
  columns={columns}
  keyExtractor={(user) => user.id}
  onRowPress={(user) => router.push(`/admin/users/${user.id}`)}
  searchable
  pagination
  itemsPerPage={10}
/>
```

## Column Configuration

### Basic Column
```tsx
{ key: 'name', label: 'Name' }
```

### Sortable Column
```tsx
{ key: 'name', label: 'Name', sortable: true }
```

### Custom Width
```tsx
{ key: 'name', label: 'Name', width: 200 }
```

### Custom Alignment
```tsx
{ key: 'amount', label: 'Amount', align: 'right' }
```

### Custom Renderer
```tsx
{
  key: 'status',
  label: 'Status',
  render: (value, row) => (
    <View style={styles.statusBadge}>
      <ThemedText>{value}</ThemedText>
    </View>
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | Required | Array of data objects |
| `columns` | `Column<T>[]` | Required | Column definitions |
| `keyExtractor` | `(item: T) => string` | Required | Function to extract unique key |
| `onRowPress` | `(item: T) => void` | Optional | Callback when row is clicked |
| `sortable` | `boolean` | `true` | Enable column sorting |
| `searchable` | `boolean` | `false` | Enable search/filter |
| `searchPlaceholder` | `string` | `'Search...'` | Search input placeholder |
| `pagination` | `boolean` | `true` | Enable pagination |
| `itemsPerPage` | `number` | `10` | Items per page |
| `emptyMessage` | `string` | `'No data available'` | Message when no data |
| `loading` | `boolean` | `false` | Show loading state |

## Examples

### Users Table
```tsx
const userColumns: Column<User>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { 
    key: 'role', 
    label: 'Role', 
    sortable: true,
    render: (value) => (
      <View style={styles.roleBadge}>
        <ThemedText>{value}</ThemedText>
      </View>
    )
  },
  { 
    key: 'createdAt', 
    label: 'Joined', 
    sortable: true,
    render: (value) => formatDistanceToNow(new Date(value), { addSuffix: true })
  },
];

<DataTable
  data={users}
  columns={userColumns}
  keyExtractor={(user) => user.id}
  onRowPress={(user) => router.push(`/admin/users/${user.id}`)}
  searchable
  pagination
  itemsPerPage={20}
/>
```

### Reports Table
```tsx
const reportColumns: Column<Report>[] = [
  { key: 'targetType', label: 'Type', sortable: true },
  { key: 'reason', label: 'Reason', sortable: false },
  { 
    key: 'status', 
    label: 'Status', 
    sortable: true,
    render: (value) => (
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(value) }]}>
        <ThemedText>{value}</ThemedText>
      </View>
    )
  },
  { 
    key: 'createdAt', 
    label: 'Reported', 
    sortable: true,
    render: (value) => format(new Date(value), 'MMM dd, yyyy')
  },
];

<DataTable
  data={reports}
  columns={reportColumns}
  keyExtractor={(report) => report.id}
  onRowPress={(report) => router.push(`/admin/reports/${report.id}`)}
  searchable
  pagination
  emptyMessage="No reports found"
/>
```

### Posts Table
```tsx
const postColumns: Column<Post>[] = [
  { key: 'title', label: 'Title', sortable: true, width: '40%' },
  { key: 'category', label: 'Category', sortable: true },
  { 
    key: 'escalationLevel', 
    label: 'Priority', 
    sortable: true,
    render: (value) => (
      <View style={styles.priorityBadge}>
        <MaterialIcons name="priority-high" size={16} color={getPriorityColor(value)} />
        <ThemedText>{value}</ThemedText>
      </View>
    )
  },
  { key: 'upvotes', label: 'Upvotes', sortable: true, align: 'right' },
  { 
    key: 'createdAt', 
    label: 'Created', 
    sortable: true,
    render: (value) => formatDistanceToNow(new Date(value), { addSuffix: true })
  },
];

<DataTable
  data={posts}
  columns={postColumns}
  keyExtractor={(post) => post.id}
  onRowPress={(post) => router.push(`/post/${post.id}`)}
  searchable
  pagination
  itemsPerPage={25}
/>
```

## Styling

The component uses the theme system and automatically adapts to light/dark mode. Custom styling can be applied through:

1. **Column renderers** - Custom cell content
2. **Theme colors** - Automatic color adaptation
3. **Component styles** - Modify `data-table.tsx` styles

## Best Practices

1. **Use sortable for important columns** - Make key columns sortable
2. **Custom renderers for complex data** - Use renderers for dates, badges, etc.
3. **Set appropriate widths** - Prevent column overflow
4. **Enable search for large datasets** - Help users find data quickly
5. **Use pagination for performance** - Don't render thousands of rows at once
6. **Provide meaningful empty messages** - Guide users when no data

## Limitations

- **Web only** - Component is hidden on mobile (returns `null`)
- **No column resizing** - Column widths are fixed
- **No column reordering** - Columns appear in defined order
- **No bulk actions** - Individual row actions only

## Future Enhancements

Potential improvements:
- Column resizing
- Column reordering
- Bulk selection and actions
- Export to CSV/PDF
- Advanced filtering
- Column visibility toggle

---

**Status**: ✅ Ready for use

**Component**: `app/components/web/data-table.tsx`

