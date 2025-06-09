/**
 * Utility functions for converting poll titles to URL-friendly slugs and vice versa
 */

/**
 * Convert a poll title to a URL-friendly slug
 * @param title - The poll title to convert
 * @returns A URL-friendly slug
 */
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters except hyphens
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Convert a slug back to a search pattern for finding polls
 * @param slug - The slug to convert
 * @returns A search pattern for database queries
 */
export function slugToSearchPattern(slug: string): string {
  return slug.replace(/-/g, " ");
}

/**
 * Generate a poll voting URL
 * @param title - The poll title
 * @returns The complete URL path for voting on the poll
 */
export function generatePollUrl(title: string): string {
  const slug = titleToSlug(title);
  return `/dashboard/${slug}`;
}

/**
 * Validate if a slug is valid (contains only allowed characters)
 * @param slug - The slug to validate
 * @returns True if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}
