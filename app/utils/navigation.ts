/**
 * Role-based navigation utilities
 * Handles route access, device detection, and navigation logic
 */

import { UserRole } from "@/app/types";
import { Dimensions, Platform } from "react-native";

export const isWeb = Platform.OS === "web";
export const isMobile = !isWeb;
const { width } = Dimensions.get("window");
export const isTablet = width >= 768;
export const isDesktop = isWeb && width >= 1024;

/**
 * Route access matrix - defines what routes each role can access
 */
export const ROUTE_ACCESS: Record<
  UserRole,
  {
    mobile: string[];
    web: string[];
    blocked: string[];
  }
> = {
  student: {
    mobile: [
      "/(tabs)",
      "/create-post",
      "/post",
      "/topic",
      "/check-in",
      "/badges",
      "/rewards",
      "/leaderboard",
      "/search",
      "/notifications",
      "/report",
      "/urgent-support",
      "/book-counsellor",
      "/academic-help",
      "/mentorship",
      "/profile-settings",
      "/accessibility-settings",
      "/chat",
      "/resource",
      "/gallery",
      "/create-channel",
    ],
    web: [
      "/(tabs)",
      "/create-post",
      "/post",
      "/topic",
      "/check-in",
      "/badges",
      "/rewards",
      "/leaderboard",
      "/search",
      "/notifications",
      "/report",
      "/urgent-support",
      "/book-counsellor",
      "/academic-help",
      "/mentorship",
      "/profile-settings",
      "/accessibility-settings",
      "/chat",
      "/resource",
      "/gallery",
      "/create-channel",
    ],
    blocked: [
      "/admin",
      "/peer-educator",
      "/counselor",
      "/student-affairs",
      "/volunteer",
    ],
  },
  "peer-educator": {
    mobile: [
      "/(tabs)",
      "/create-post",
      "/post",
      "/topic",
      "/check-in",
      "/badges",
      "/rewards",
      "/leaderboard",
      "/search",
      "/notifications",
      "/report",
      "/urgent-support",
      "/book-counsellor",
      "/academic-help",
      "/mentorship",
      "/profile-settings",
      "/accessibility-settings",
      "/chat",
      "/resource",
      "/gallery",
      "/create-channel",
      "/peer-educator",
      "/meetings",
    ],
    web: [
      "/(tabs)",
      "/create-post",
      "/post",
      "/topic",
      "/check-in",
      "/badges",
      "/rewards",
      "/leaderboard",
      "/search",
      "/notifications",
      "/report",
      "/urgent-support",
      "/book-counsellor",
      "/academic-help",
      "/mentorship",
      "/profile-settings",
      "/accessibility-settings",
      "/chat",
      "/resource",
      "/gallery",
      "/create-channel",
      "/peer-educator",
      "/meetings",
    ],
    blocked: ["/admin", "/counselor", "/student-affairs"],
  },
  "peer-educator-executive": {
    mobile: [
      "/(tabs)",
      "/create-post",
      "/post",
      "/topic",
      "/check-in",
      "/badges",
      "/rewards",
      "/leaderboard",
      "/search",
      "/notifications",
      "/report",
      "/urgent-support",
      "/book-counsellor",
      "/academic-help",
      "/mentorship",
      "/profile-settings",
      "/accessibility-settings",
      "/chat",
      "/resource",
      "/gallery",
      "/create-channel",
      "/executive",
      "/peer-educator",
      "/meetings",
    ],
    web: [
      "/(tabs)",
      "/create-post",
      "/post",
      "/topic",
      "/check-in",
      "/badges",
      "/rewards",
      "/leaderboard",
      "/search",
      "/notifications",
      "/report",
      "/urgent-support",
      "/book-counsellor",
      "/academic-help",
      "/mentorship",
      "/profile-settings",
      "/accessibility-settings",
      "/chat",
      "/resource",
      "/gallery",
      "/create-channel",
      "/executive",
      "/peer-educator",
      "/meetings",
    ],
    blocked: ["/admin", "/counselor", "/student-affairs"],
  },
  moderator: {
    mobile: ["/admin/moderation", "/admin/reports", "/resource", "/gallery"],
    web: ["/admin/moderation", "/admin/reports", "/resource", "/gallery"],
    blocked: [
      "/admin/dashboard",
      "/admin/analytics",
      "/admin/escalations",
      "/counselor",
      "/student-affairs",
    ],
  },
  counselor: {
    mobile: [
      "/counselor",
      "/post", // Only escalated posts
      "/check-in",
      "/notifications",
      "/chat",
      "/profile-settings",
      "/accessibility-settings",
      "/resource",
      "/gallery",
    ],
    web: [
      "/counselor",
      "/post", // Only escalated posts
      "/check-in",
      "/notifications",
      "/chat",
      "/profile-settings",
      "/accessibility-settings",
      "/resource",
      "/gallery",
    ],
    blocked: [
      "/(tabs)/forum", // No general forum
      "/create-post",
      "/topic",
      "/admin",
      "/peer-educator",
      "/student-affairs",
    ],
  },
  "life-coach": {
    mobile: [
      "/counselor",
      "/post", // Only escalated posts
      "/check-in",
      "/notifications",
      "/chat",
      "/profile-settings",
      "/accessibility-settings",
      "/resource",
      "/gallery",
    ],
    web: [
      "/counselor",
      "/post", // Only escalated posts
      "/check-in",
      "/notifications",
      "/chat",
      "/profile-settings",
      "/accessibility-settings",
      "/resource",
      "/gallery",
    ],
    blocked: [
      "/(tabs)/forum", // No general forum
      "/create-post",
      "/topic",
      "/admin",
      "/peer-educator",
      "/student-affairs",
    ],
  },
  "student-affairs": {
    mobile: [], // STRICTLY BLOCKED ON MOBILE
    web: [
      "/student-affairs",
      "/(tabs)/resources",
      "/(tabs)/profile",
      "/resource",
      "/gallery",
      "/profile-settings",
      "/accessibility-settings",
    ],
    blocked: [
      "/(tabs)/forum",
      "/(tabs)/chat",
      "/create-post",
      "/post",
      "/topic",
      "/check-in",
      "/admin",
      "/peer-educator",
      "/counselor",
    ],
  },
  admin: {
    mobile: [
      "/admin/dashboard",
      "/admin/reports",
      "/(tabs)",
      "/create-post",
      "/post",
      "/topic",
      "/check-in",
      "/badges",
      "/rewards",
      "/leaderboard",
      "/search",
      "/notifications",
      "/chat",
      "/resource",
      "/gallery",
      "/profile-settings",
      "/accessibility-settings",
      "/create-channel",
    ],
    web: [
      "/admin",
      "/(tabs)",
      "/peer-educator",
      "/counselor",
      "/student-affairs",
      "/create-post",
      "/post",
      "/topic",
      "/check-in",
      "/badges",
      "/rewards",
      "/leaderboard",
      "/search",
      "/notifications",
      "/chat",
      "/resource",
      "/gallery",
      "/profile-settings",
      "/accessibility-settings",
      "/create-channel",
    ],
    blocked: [], // Admin has full access
  },
};

/**
 * Check if a route is accessible for a role on a specific platform
 */
export function canAccessRoute(
  role: UserRole,
  route: string,
  platform: "mobile" | "web" = isMobile ? "mobile" : "web",
): boolean {
  const access = ROUTE_ACCESS[role];

  // Check if route is blocked
  const isBlocked = access.blocked.some((blockedRoute) =>
    route.startsWith(blockedRoute),
  );
  if (isBlocked) return false;

  // Check if route is allowed
  const allowedRoutes = access[platform];
  const isAllowed = allowedRoutes.some(
    (allowedRoute) => route.startsWith(allowedRoute) || route === allowedRoute,
  );

  return isAllowed;
}

/**
 * Check if Student Affairs can access on mobile (they can't)
 */
export function isStudentAffairsMobileBlocked(
  role: UserRole,
  platform: "mobile" | "web",
): boolean {
  return role === "student-affairs" && platform === "mobile";
}

/**
 * Get default route for a role based on platform
 */
export function getDefaultRoute(
  role: UserRole,
  platform: "mobile" | "web" = isMobile ? "mobile" : "web",
): string {
  // Student Affairs blocked on mobile
  if (isStudentAffairsMobileBlocked(role, platform)) {
    return "/web-required";
  }

  switch (role) {
    case "student":
      return "/(tabs)";
    case "peer-educator":
      return "/(tabs)";
    case "peer-educator-executive":
      return "/(tabs)";
    case "moderator":
      return "/admin/moderation";
    case "counselor":
    case "life-coach":
      return "/counselor/dashboard";
    case "student-affairs":
      return "/student-affairs/dashboard";
    case "admin":
      return platform === "web" ? "/admin/dashboard" : "/admin/dashboard";
    default:
      return "/(tabs)";
  }
}

/**
 * Get navigation type for a role and platform
 */
export function getNavigationType(
  role: UserRole,
  platform: "mobile" | "web" = isMobile ? "mobile" : "web",
): "tabs" | "sidebar" | "drawer" {
  if (platform === "web") {
    if (role === "admin" || role === "student-affairs") {
      return "sidebar";
    }
    return "tabs";
  }

  // Mobile
  if (role === "admin" || role === "student-affairs") {
    return "sidebar"; // Will be blocked for student-affairs
  }

  return "tabs";
}
