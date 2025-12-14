import { Resource } from '@/app/types';

/**
 * Map database resource to Resource interface
 */
export function mapResourceFromDB(data: any): Resource & { approved?: boolean; sourceType?: string } {
  // Generate thumbnail URL based on resource type if not provided
  let thumbnailUrl = data.thumbnail_url;
  
  if (!thumbnailUrl) {
    // Auto-generate thumbnail URLs based on resource type
    if (data.resource_type === 'image' || data.resource_type === 'infographic') {
      thumbnailUrl = data.file_path || data.url;
    } else if (data.resource_type === 'video' || data.resource_type === 'short-video') {
      // For videos, use the URL or file path as thumbnail (first frame)
      thumbnailUrl = data.file_path || data.url;
    } else if (data.resource_type === 'pdf') {
      // For PDFs, could use a preview service or first page snapshot
      // For now, we'll use a fallback icon
      thumbnailUrl = undefined;
    }
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description || '',
    category: data.category,
    resourceType: data.resource_type,
    url: data.url || undefined,
    filePath: data.file_path || undefined,
    thumbnailUrl: thumbnailUrl || undefined,
    tags: data.tags || [],
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
 * Get resource type label
 */
export function getResourceTypeLabel(resourceType: string): string {
  switch (resourceType) {
    case 'short-article':
      return 'Short Article';
    case 'short-video':
      return 'Short Video';
    default:
      return resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
  }
}
