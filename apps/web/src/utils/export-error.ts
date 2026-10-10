import { isAxiosError } from "axios";

/**
 * The alert to show when an export request fails. Exports are rate limited per
 * user on the backend; a 429 deserves its own message, because "try again" is
 * precisely the wrong advice while the limit is in force.
 */
export const exportErrorMessage = (error: unknown, fallback: string): string =>
  isAxiosError(error) && error.response?.status === 429
    ? "You're exporting too quickly. Please wait a minute and try again."
    : fallback;
