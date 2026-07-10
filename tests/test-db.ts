/**
 * The dedicated test database URL. Tests must NEVER run against the .env
 * development/production database — this module is the single source of
 * truth, imported by both playwright.config.ts and global-setup.ts (which
 * must not import each other).
 *
 * Locally, global-setup boots a docker Postgres (duet-test-pg) on :5533
 * unless TEST_DATABASE_URL points somewhere else; CI provides a service
 * container and sets TEST_DATABASE_URL explicitly.
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5533/duet_test";
