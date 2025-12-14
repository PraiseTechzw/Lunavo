import { Resource } from '@/app/types';

/**
 * Map database resource to Resource interface
 * Handles resource type mapping from database enum to app types
 */
export function mapResourceFromDB(data: any): Resource & { approved?: boolean; sourceType?: string } {
  // Check tags for actual resource type (handles images/infographics stored as PDFs)
  const tags = data.tags || [];
  let actualResourceType = data.resource_type;
  
  // Extract actual type from tags if present (e.g., "type:image", "type:infographic")
  // Also handle partial matches (e.g., "type:ins" might be "type:infographic" truncated)
  const typeTag = tags.find((tag: string) => tag.startsWith('type:'));
  if (typeTag) {
    const extractedType = typeTag.replace('type:', '').toLowerCase();
    
    // Handle partial matches and common abbreviations
    let resolvedType = extractedType;
    if (extractedType.startsWith('inf')) {
      resolvedType = 'infographic';
    } else if (extractedType.startsWith('img') || extractedType === 'image') {
      resolvedType = 'image';
    } else if (extractedType.startsWith('short-art')) {
      resolvedType = 'short-article';
    } else if (extractedType.startsWith('short-vid')) {
      resolvedType = 'short-video';
    }
    
    // Only override if it's a valid type that differs from database type
    if (['image', 'infographic', 'short-article', 'short-video'].includes(resolvedType)) {
      actualResourceType = resolvedType;
    }
  }
  
  // Generate thumbnail URL based on actual resource type if not provided
  let thumbnailUrl = data.thumbnail_url;
  
  if (!thumbnailUrl) {
    // Auto-generate thumbnail URLs based on actual resource type
    if (actualResourceType === 'image' || actualResourceType === 'infographic') {
      thumbnailUrl = data.file_path || data.url;
    } else if (actualResourceType === 'video' || actualResourceType === 'short-video') {
      // For videos, use the URL or file path as thumbnail (first frame)
      thumbnailUrl = data.file_path || data.url;
    } else if (actualResourceType === 'pdf') {
      // For PDFs, don't auto-generate thumbnail (use fallback icon)
      thumbnailUrl = undefined;
    }
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description || '',
    category: data.category,
    resourceType: actualResourceType, // Use the actual type, not the database type
    url: data.url || undefined,
    filePath: data.file_path || undefined,
    thumbnailUrl: thumbnailUrl || undefined,
    tags: tags,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    // Include approval metadata if available
    approved: data.approved,
    sourceType: data.source_type,
  } as Resource & { approved?: boolean; sourceType?: string };
}

/**
 * Get resource type color
 */
export function getResourceTypeColor(resourceType: string, colors: any): string {
  switch (resourceType) {
    case 'article':
    case 'short-article':
      return colors.academic || '#3B82F6';
    case 'video':
    case 'short-video':
      return colors.danger || '#EF4444';
    case 'pdf':
      return colors.warning || '#F59E0B';
    case 'infographic':
      return colors.secondary || '#8B5CF6';
    case 'image':
      return colors.info || '#06B6D4';
    case 'link':
      return colors.success || '#10B981';
    case 'training':
      return colors.mentalHealth || '#A855F7';
    case 'document':
      return colors.success || '#10B981';
    case 'quiz':
      return colors.warning || '#F59E0B';
    default:
      return colors.primary || '#6366F1';
  }
}

/**
 * Get resource type icon (MaterialIcons)
 */
export function getResourceIconMaterial(resourceType: string): string {
  switch (resourceType) {
    case 'article':
    case 'short-article':
      return 'article';
    case 'video':
    case 'short-video':
      return 'play-circle-filled';
    case 'pdf':
      return 'description';
    case 'infographic':
      return 'bar-chart';
    case 'image':
      return 'image';
    case 'link':
      return 'link';
    case 'training':
      return 'school';
    case 'document':
      return 'description';
    case 'quiz':
      return 'quiz';
    default:
      return 'article';
  }
}

/**
 * Get resource type icon (Ionicons) - for compatibility
 */
export function getResourceIcon(resourceType: string): string {
  switch (resourceType) {
    case 'article':
    case 'short-article':
      return 'newspaper-outline';
    case 'video':
    case 'short-video':
      return 'play-circle-outline';
    case 'pdf':
      return 'document-text-outline';
    case 'infographic':
      return 'stats-chart-outline';
    case 'image':
      return 'image-outline';
    case 'link':
      return 'link-outline';
    case 'training':
      return 'school-outline';
    case 'document':
      return 'document-text-outline';
    case 'quiz':
      return 'help-circle-outline';
    default:
      return 'document-outline';
  }
}

/**
 * Get resource type label for display in badges and UI
 */
export function getResourceTypeLabel(resourceType: string): string {
  switch (resourceType) {
    case 'short-article':
      return 'Short Article';
    case 'short-video':
      return 'Short Video';
    case 'infographic':
      return 'Infographic';
    case 'image':
      return 'Image';
    case 'pdf':
      return 'PDF';
    case 'article':
      return 'Article';
    case 'video':
      return 'Video';
    case 'link':
      return 'Link';
    case 'training':
      return 'Training';
    default:
      // Capitalize first letter and handle camelCase
      return resourceType
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
  }
}
