import { execSync } from "node:child_process";
import { TEST_DATABASE_URL } from "../playwright.config";

const CONTAINER = "duet-test-pg";

function sh(command: string, quiet = false) {
  return execSync(command, { stdio: quiet ? "ignore" : "inherit" });
}

/**
 * Ensures the dedicated test database exists and has the current schema.
 * Locally this boots a docker Postgres on port 5533; in CI (or when
 * TEST_DATABASE_URL is set) the database is expected to already be running.
 */
export default async function globalSetup() {
  if (!process.env.CI && !process.env.TEST_DATABASE_URL) {
    try {
      sh(`docker start ${CONTAINER}`, true);
    } catch {
      try {
        sh(
          `docker run -d --name ${CONTAINER} -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=duet_test -p 5533:5432 postgres:16-alpine`,
        );
      } catch (error) {
        throw new Error(
          `Could not start the test database container. Start Docker, or set TEST_DATABASE_URL to a disposable Postgres. (${String(error)})`,
        );
      }
    }
    // Wait for Postgres to accept connections.
    let ready = false;
    for (let i = 0; i < 30 && !ready; i++) {
      try {
        sh(`docker exec ${CONTAINER} pg_isready -U postgres`, true);
        ready = true;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    if (!ready) {
      throw new Error("Test database container did not become ready in 30s.");
    }
  }

  execSync("npx prisma db push", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
