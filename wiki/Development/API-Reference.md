# API Reference

Complete API reference for the Lunavo platform libraries and utilities.

## Authentication API

### `lib/auth.ts`

#### `signUp(email: string, password: string, studentData?: StudentData): Promise<AuthResponse>`

Register a new user.

**Parameters:**
- `email`: User email address
- `password`: User password
- `studentData`: Optional student verification data

**Returns:** Promise resolving to auth response with user and session

**Example:**
```typescript
const result = await signUp('user@example.com', 'password123', {
  student_number: '12345',
  name: 'John Doe',
});
```

#### `signIn(email: string, password: string): Promise<AuthResponse>`

Sign in an existing user.

**Parameters:**
- `email`: User email address
- `password`: User password

**Returns:** Promise resolving to auth response

**Example:**
```typescript
const result = await signIn('user@example.com', 'password123');
```

#### `signOut(): Promise<void>`

Sign out the current user.

**Returns:** Promise resolving when sign out is complete

**Example:**
```typescript
await signOut();
```

#### `getCurrentUser(): Promise<User | null>`

Get the currently authenticated user.

**Returns:** Promise resolving to user object or null

**Example:**
```typescript
const user = await getCurrentUser();
```

#### `getSession(): Promise<Session | null>`

Get the current session.

**Returns:** Promise resolving to session object or null

**Example:**
```typescript
const session = await getSession();
```

#### `resetPassword(email: string): Promise<void>`

Send password reset email.

**Parameters:**
- `email`: User email address

**Returns:** Promise resolving when email is sent

**Example:**
```typescript
await resetPassword('user@example.com');
```

#### `updatePassword(newPassword: string): Promise<void>`

Update user password.

**Parameters:**
- `newPassword`: New password

**Returns:** Promise resolving when password is updated

**Example:**
```typescript
await updatePassword('newPassword123');
```

#### `onAuthStateChange(callback: (user: User | null) => void): { unsubscribe: () => void }`

Listen to authentication state changes.

**Parameters:**
- `callback`: Function called when auth state changes

**Returns:** Object with unsubscribe method

**Example:**
```typescript
const subscription = onAuthStateChange((user) => {
  console.log('Auth state changed:', user);
});

// Later
subscription.unsubscribe();
```

## Database API

### `lib/database.ts`

#### `getUser(userId: string): Promise<User | null>`

Get user by ID.

**Parameters:**
- `userId`: User ID

**Returns:** Promise resolving to user object or null

#### `createUser(userData: CreateUserData): Promise<User>`

Create a new user.

**Parameters:**
- `userData`: User data

**Returns:** Promise resolving to created user

#### `updateUser(userId: string, updates: Partial<User>): Promise<User>`

Update user data.

**Parameters:**
- `userId`: User ID
- `updates`: Partial user data to update

**Returns:** Promise resolving to updated user

#### `getPosts(filters?: PostFilters): Promise<Post[]>`

Get posts with optional filters.

**Parameters:**
- `filters`: Optional filters (category, author, etc.)

**Returns:** Promise resolving to array of posts

**Example:**
```typescript
const posts = await getPosts({ category: 'academic' });
```

#### `createPost(postData: CreatePostData): Promise<Post>`

Create a new post.

**Parameters:**
- `postData`: Post data

**Returns:** Promise resolving to created post

#### `updatePost(postId: string, updates: Partial<Post>): Promise<Post>`

Update a post.

**Parameters:**
- `postId`: Post ID
- `updates`: Partial post data to update

**Returns:** Promise resolving to updated post

#### `deletePost(postId: string): Promise<void>`

Delete a post.

**Parameters:**
- `postId`: Post ID

**Returns:** Promise resolving when post is deleted

#### `getReplies(postId: string): Promise<Reply[]>`

Get replies for a post.

**Parameters:**
- `postId`: Post ID

**Returns:** Promise resolving to array of replies

#### `createReply(replyData: CreateReplyData): Promise<Reply>`

Create a reply to a post.

**Parameters:**
- `replyData`: Reply data

**Returns:** Promise resolving to created reply

#### `getEscalations(filters?: EscalationFilters): Promise<Escalation[]>`

Get escalations with optional filters.

**Parameters:**
- `filters`: Optional filters (level, status, etc.)

**Returns:** Promise resolving to array of escalations

#### `createEscalation(escalationData: CreateEscalationData): Promise<Escalation>`

Create an escalation.

**Parameters:**
- `escalationData`: Escalation data

**Returns:** Promise resolving to created escalation

## Permissions API

### `lib/permissions.ts`

#### `hasPermission(user: User, permission: Permission): boolean`

Check if user has a specific permission.

**Parameters:**
- `user`: User object
- `permission`: Permission name

**Returns:** Boolean indicating if user has permission

#### `getPermissions(role: UserRole): Permission[]`

Get all permissions for a role.

**Parameters:**
- `role`: User role

**Returns:** Array of permission names

#### Permission Functions

- `canViewDashboard(role: UserRole): boolean`
- `canModerate(role: UserRole): boolean`
- `canEscalate(role: UserRole): boolean`
- `canManageMeetings(role: UserRole): boolean`
- `canViewAnalytics(role: UserRole): boolean`
- `canManageUsers(role: UserRole): boolean`
- `canViewEscalations(role: UserRole): boolean`
- `canRespondAsVolunteer(role: UserRole): boolean`
- `canCreateResources(role: UserRole): boolean`
- `canViewAdminDashboard(role: UserRole): boolean`
- `canViewStudentAffairsDashboard(role: UserRole): boolean`
- `canViewPeerEducatorDashboard(role: UserRole): boolean`

## Navigation API

### `app/utils/navigation.ts`

#### `canAccessRoute(role: UserRole, route: string, platform: 'mobile' | 'web'): boolean`

Check if a role can access a route.

**Parameters:**
- `role`: User role
- `route`: Route path
- `platform`: Platform type

**Returns:** Boolean indicating if route is accessible

#### `getDefaultRoute(role: UserRole, platform: 'mobile' | 'web'): string`

Get default route for a role and platform.

**Parameters:**
- `role`: User role
- `platform`: Platform type

**Returns:** Default route path

#### `isMobile: boolean`

Boolean indicating if running on mobile platform.

#### `isWeb: boolean`

Boolean indicating if running on web platform.

## Real-time API

### `lib/realtime.ts`

#### `subscribeToPosts(callback: (post: Post) => void): { unsubscribe: () => void }`

Subscribe to new posts.

**Parameters:**
- `callback`: Function called when new post is created

**Returns:** Object with unsubscribe method

#### `subscribeToReplies(postId: string, callback: (reply: Reply) => void): { unsubscribe: () => void }`

Subscribe to replies for a post.

**Parameters:**
- `postId`: Post ID
- `callback`: Function called when new reply is created

**Returns:** Object with unsubscribe method

#### `subscribeToEscalations(callback: (escalation: Escalation) => void): { unsubscribe: () => void }`

Subscribe to new escalations.

**Parameters:**
- `callback`: Function called when new escalation is created

**Returns:** Object with unsubscribe method

## Gamification API

### `lib/gamification.ts`

#### `awardPoints(userId: string, points: number, reason: string): Promise<void>`

Award points to a user.

**Parameters:**
- `userId`: User ID
- `points`: Points to award
- `reason`: Reason for awarding points

**Returns:** Promise resolving when points are awarded

#### `getUserPoints(userId: string): Promise<number>`

Get total points for a user.

**Parameters:**
- `userId`: User ID

**Returns:** Promise resolving to total points

#### `awardBadge(userId: string, badgeId: string): Promise<void>`

Award a badge to a user.

**Parameters:**
- `userId`: User ID
- `badgeId`: Badge ID

**Returns:** Promise resolving when badge is awarded

#### `getUserBadges(userId: string): Promise<Badge[]>`

Get all badges for a user.

**Parameters:**
- `userId`: User ID

**Returns:** Promise resolving to array of badges

## Performance API

### `lib/performance-utils.ts`

#### `usePagination<T>(fetchFn: (page: number, pageSize: number) => Promise<T[]>, options?: PaginationOptions): PaginationResult<T>`

Hook for paginated data loading.

**Parameters:**
- `fetchFn`: Function to fetch data for a page
- `options`: Optional pagination options

**Returns:** Pagination result with data, loading state, and controls

#### `debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T`

Debounce a function.

**Parameters:**
- `fn`: Function to debounce
- `delay`: Delay in milliseconds

**Returns:** Debounced function

#### `throttle<T extends (...args: any[]) => any>(fn: T, delay: number): T`

Throttle a function.

**Parameters:**
- `fn`: Function to throttle
- `delay`: Delay in milliseconds

**Returns:** Throttled function

#### `memoize<T extends (...args: any[]) => any>(fn: T): T`

Memoize a function.

**Parameters:**
- `fn`: Function to memoize

**Returns:** Memoized function

## Types

### User Roles

```typescript
type UserRole = 
  | 'student'
  | 'peer-educator'
  | 'peer-educator-executive'
  | 'moderator'
  | 'counselor'
  | 'life-coach'
  | 'student-affairs'
  | 'admin';
```

### Post Categories

```typescript
type PostCategory = 
  | 'academic'
  | 'mental-health'
  | 'relationships'
  | 'career'
  | 'general';
```

### Escalation Levels

```typescript
type EscalationLevel = 
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';
```

## Additional Resources

- [Developer Guide](Developer-Guide.md)
- [Architecture Overview](Architecture.md)
- [Authentication Documentation](../Features/Authentication.md)

---

**Last Updated**: December 2024
