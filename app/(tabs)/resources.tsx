/**
 * Resource Library Screen
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/app/components/themed-view';
import { ThemedText } from '@/app/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/app/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/app/constants/theme';
import { createShadow, getCursorStyle, createInputStyle } from '@/app/utils/platform-styles';

const categories = ['All', 'Articles', 'Videos', 'Coping Skills', 'Academic', 'Mental Health'];

const featuredResources = [
  {
    id: '1',
    title: 'Exam Stress Tips',
    type: 'Article',
    duration: '5 min read',
    iconName: 'library-outline',
    gradient: ['#9B59B6', '#3498DB'],
  },
  {
    id: '2',
    title: 'Guided Meditation',
    type: 'Video',
    duration: '10 min',
    iconName: 'body-outline',
    gradient: ['#E74C3C', '#F39C12'],
  },
];

const copingStrategies = [
  {
    id: '1',
    title: 'Mindfulness Exercises',
    type: 'Article',
    iconName: 'body-outline',
    color: '#90EE90',
  },
  {
    id: '2',
    title: 'Breathing Techniques',
    type: 'Article',
    duration: '2 min read',
    iconName: 'leaf-outline',
    color: '#DDA0DD',
  },
  {
    id: '3',
    title: 'Stress Management',
    type: 'Video',
    duration: '15 min',
    iconName: 'medical-outline',
    color: '#87CEEB',
  },
];

const academicResources = [
  {
    id: '1',
    title: 'Effective Study Habits',
    type: 'Article',
    iconName: 'book-outline',
  },
  {
    id: '2',
    title: 'Time Management',
    type: 'Video',
    iconName: 'time',
  },
];

export default function ResourcesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const renderResourceCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.resourceCard,
        { backgroundColor: colors.card },
        createShadow(2, '#000', 0.1),
      ]}
      activeOpacity={0.8}
    >
      <View style={[styles.resourceImage, { backgroundColor: item.gradient?.[0] + '20' }]}>
        <Ionicons name={item.iconName as any} size={40} color={item.gradient?.[0] || colors.primary} />
      </View>
      <ThemedText type="body" style={styles.resourceTitle}>
        {item.title}
      </ThemedText>
      <ThemedText type="small" style={styles.resourceMeta}>
        {item.duration || item.type}
      </ThemedText>
      <TouchableOpacity style={styles.bookmarkButton}>
        <Ionicons name="bookmark-outline" size={20} color={colors.icon} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderCopingCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.copingCard,
        { backgroundColor: colors.card },
        createShadow(1, '#000', 0.05),
      ]}
      activeOpacity={0.8}
    >
      <View style={[styles.copingIcon, { backgroundColor: item.color + '30' }]}>
        <Text style={styles.copingEmoji}>{item.icon}</Text>
      </View>
      <View style={styles.copingContent}>
        <ThemedText type="body" style={styles.copingTitle}>
          {item.title}
        </ThemedText>
        <ThemedText type="small" style={styles.copingMeta}>
          {item.duration || item.type}
        </ThemedText>
      </View>
      <TouchableOpacity>
        <Ionicons name="bookmark-outline" size={20} color={colors.icon} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
      <ThemedView style={styles.container}>
        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, createInputStyle(), { color: colors.text }]}
            placeholder="Search for articles, videos..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Filters */}
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            data={categories}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      selectedCategory === item ? colors.primary : colors.surface,
                  },
                ]}
                onPress={() => setSelectedCategory(item)}
                activeOpacity={0.7}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: selectedCategory === item ? '#FFFFFF' : colors.text,
                    fontWeight: '600',
                  }}
                >
                  {item}
                </ThemedText>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          />
        </View>

        {/* Featured Section */}
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Featured
          </ThemedText>
          <FlatList
            horizontal
            data={featuredResources}
            renderItem={renderResourceCard}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        {/* Coping Strategies */}
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Coping Strategies
          </ThemedText>
          {copingStrategies.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.copingCard,
                { backgroundColor: colors.card },
                createShadow(1, '#000', 0.05),
              ]}
              activeOpacity={0.8}
            >
              <View style={[styles.copingIcon, { backgroundColor: item.color + '30' }]}>
                <Ionicons name={item.iconName as any} size={28} color={item.color} />
              </View>
              <View style={styles.copingContent}>
                <ThemedText type="body" style={styles.copingTitle}>
                  {item.title}
                </ThemedText>
                <ThemedText type="small" style={styles.copingMeta}>
                  {item.duration || item.type}
                </ThemedText>
              </View>
              <TouchableOpacity>
                <Ionicons name="bookmark-outline" size={20} color={colors.icon} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Academic Support */}
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Academic Support
          </ThemedText>
          <FlatList
            horizontal
            data={academicResources}
            renderItem={renderResourceCard}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaTop: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  filtersContainer: {
    marginBottom: Spacing.lg,
  },
  filtersContent: {
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '700',
  },
  horizontalList: {
    gap: Spacing.md,
  },
  resourceCard: {
    width: 200,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  resourceImage: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceTitle: {
    fontWeight: '600',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  resourceMeta: {
    opacity: 0.7,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  bookmarkButton: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
  },
  copingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  copingIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  copingContent: {
    flex: 1,
  },
  copingTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  copingMeta: {
    opacity: 0.7,
  },
});

