/**
 * Utilities for generating and managing anonymous identities
 */

/**
 * Generate a random pseudonym for anonymous users
 */
export function generatePseudonym(): string {
  const adjectives = [
    'Calm', 'Brave', 'Kind', 'Wise', 'Gentle', 'Strong', 'Hopeful',
    'Peaceful', 'Caring', 'Bright', 'Warm', 'Quiet', 'Bold', 'True',
    'Free', 'Clear', 'Safe', 'Steady', 'Calm', 'Sure',
  ];
  
  const nouns = [
    'Student', 'Friend', 'Listener', 'Helper', 'Seeker', 'Learner',
    'Traveler', 'Dreamer', 'Thinker', 'Guide', 'Soul', 'Heart',
    'Spirit', 'Mind', 'Voice', 'Light', 'Star', 'Tree', 'River',
  ];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  
  return `${adjective}${noun}${number}`;
}

/**
 * Sanitize content to remove potential identifying information
 */
export function sanitizeContent(content: string): string {
  // Remove email patterns
  let sanitized = content.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[email]');
  
  // Remove phone numbers (South African format)
  sanitized = sanitized.replace(/(\+27|0)[\s-]?[\d\s-]{8,9}/g, '[phone]');
  
  // Remove student numbers (common patterns)
  sanitized = sanitized.replace(/\b\d{7,9}\b/g, '[student-id]');
  
  return sanitized;
}

/**
 * Check if content might contain identifying information
 */
export function containsIdentifyingInfo(content: string): boolean {
  const emailPattern = /[\w.-]+@[\w.-]+\.\w+/;
  const phonePattern = /(\+27|0)[\s-]?[\d\s-]{8,9}/;
  const studentIdPattern = /\b\d{7,9}\b/;
  
  return (
    emailPattern.test(content) ||
    phonePattern.test(content) ||
    studentIdPattern.test(content)
  );
}






