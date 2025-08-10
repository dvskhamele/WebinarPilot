export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBl9ffny9UKYrk7e7dWVBmV4-0ZjP1-VP9a3hDONw9crQ1sQXcxTRF8JeTNQAvesHJ/exec';

export const CATEGORIES = [
  'Technology',
  'Business',
  'Marketing',
  'Design',
  'Data Science',
  'DevOps',
  'AI/ML',
  'Career',
] as const;

export const REGISTRATION_TYPES = {
  REMINDER: 'reminder',
  LIVE_JOIN: 'live_join',
} as const;

// Community links per interest/category (default used for all until expanded)
export const COMMUNITY_LINKS: Record<string, string> = {
  default: 'https://chat.whatsapp.com/Ck8VbaM9bWi9UvNG4iJYbp',
};
