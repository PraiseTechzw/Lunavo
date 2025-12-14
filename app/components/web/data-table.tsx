/**
 * Data Table Component
 * Web-optimized data table with sorting, filtering, and pagination
 */

import { ThemedText } from '@/app/components/themed-text';
import { BorderRadius, Colors, Spacing } from '@/app/constants/theme';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { createShadow, getCursorStyle } from '@/app/utils/platform-styles';
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowPress?: (item: T) => void;
  sortable?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  pagination?: boolean;
  itemsPerPage?: number;
  emptyMessage?: string;
  loading?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  onRowPress,
  sortable = true,
  searchable = false,
  searchPlaceholder = 'Search...',
  pagination = true,
  itemsPerPage = 10,
  emptyMessage = 'No data available',
  loading = false,
}: DataTableProps<T>) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [sortColumn, setSortColumn] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Only render on web
  if (Platform.OS !== 'web') {
    return null;
  }

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchable || !searchQuery.trim()) {
      return data;
    }

    const query = searchQuery.toLowerCase();
    return data.filter((row) => {
      return columns.some((column) => {
        const value = row[column.key as keyof T];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, searchable, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortable || !sortColumn || !sortDirection) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn as keyof T];
      const bValue = b[sortColumn as keyof T];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection, sortable]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) {
      return sortedData;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage, pagination]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (columnKey: keyof T | string) => {
    if (!sortable) return;

    const column = columns.find((col) => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (columnKey: keyof T | string) => {
    if (sortColumn !== columnKey) {
      return 'unfold-more';
    }
    return sortDirection === 'asc' ? 'arrow-upward' : 'arrow-downward';
  };

  const renderCell = (column: Column<T>, row: T) => {
    const value = row[column.key as keyof T];
    
    if (column.render) {
      return column.render(value, row);
    }

    if (value === null || value === undefined) {
      return (
        <ThemedText type="small" style={[styles.cellText, { color: colors.icon }]}>
          —
        </ThemedText>
      );
    }

    return (
      <ThemedText type="body" style={[styles.cellText, { color: colors.text }]}>
        {String(value)}
      </ThemedText>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.loadingContainer}>
          <MaterialIcons name="hourglass-empty" size={48} color={colors.icon} />
          <ThemedText type="body" style={[styles.loadingText, { color: colors.icon }]}>
            Loading data...
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Search Bar */}
      {searchable && (
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={20} color={colors.icon} />
          <TextInput
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setCurrentPage(1);
            }}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <MaterialIcons name="close" size={18} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tableContainer}>
          {/* Header */}
          <View style={[styles.tableHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            {columns.map((column) => (
              <TouchableOpacity
                key={String(column.key)}
                style={[
                  styles.headerCell,
                  { width: column.width || 'auto' },
                  column.sortable && sortable && getCursorStyle(),
                ]}
                onPress={() => column.sortable && handleSort(column.key)}
                disabled={!column.sortable || !sortable}
              >
                <ThemedText
                  type="body"
                  style={[
                    styles.headerText,
                    {
                      color: colors.text,
                      fontWeight: sortColumn === column.key ? '600' : '500',
                      textAlign: column.align || 'left',
                    },
                  ]}
                >
                  {column.label}
                </ThemedText>
                {column.sortable && sortable && (
                  <MaterialIcons
                    name={getSortIcon(column.key) as any}
                    size={18}
                    color={sortColumn === column.key ? colors.primary : colors.icon}
                    style={styles.sortIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Body */}
          {paginatedData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="inbox" size={48} color={colors.icon} />
              <ThemedText type="body" style={[styles.emptyText, { color: colors.icon }]}>
                {emptyMessage}
              </ThemedText>
            </View>
          ) : (
            paginatedData.map((row) => (
              <TouchableOpacity
                key={keyExtractor(row)}
                style={[
                  styles.tableRow,
                  { borderBottomColor: colors.border },
                  onRowPress && getCursorStyle(),
                ]}
                onPress={() => onRowPress?.(row)}
                disabled={!onRowPress}
              >
                {columns.map((column) => (
                  <View
                    key={String(column.key)}
                    style={[
                      styles.cell,
                      { width: column.width || 'auto' },
                      { justifyContent: column.align === 'right' ? 'flex-end' : column.align === 'center' ? 'center' : 'flex-start' },
                    ]}
                  >
                    {renderCell(column, row)}
                  </View>
                ))}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <View style={[styles.pagination, { borderTopColor: colors.border }]}>
          <ThemedText type="small" style={[styles.paginationInfo, { color: colors.icon }]}>
            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length}
          </ThemedText>
          <View style={styles.paginationControls}>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                { backgroundColor: colors.surface },
                currentPage === 1 && { opacity: 0.5 },
              ]}
              onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <MaterialIcons name="chevron-left" size={20} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="body" style={[styles.pageNumber, { color: colors.text }]}>
              {currentPage} / {totalPages}
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                { backgroundColor: colors.surface },
                currentPage === totalPages && { opacity: 0.5 },
              ]}
              onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <MaterialIcons name="chevron-right" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...createShadow(2, '#000', 0.1),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: Spacing.xs,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  tableContainer: {
    minWidth: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
  },
  headerCell: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    minWidth: 120,
    gap: Spacing.xs,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortIcon: {
    marginLeft: 'auto',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    minHeight: 48,
  },
  cell: {
    padding: Spacing.md,
    minWidth: 120,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  loadingContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  paginationInfo: {
    fontSize: 14,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  paginationButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageNumber: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 60,
    textAlign: 'center',
  },
});
