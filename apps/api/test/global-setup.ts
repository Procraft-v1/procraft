import { execSync } from 'child_process';

const CONTAINER_NAME = 'procraft-e2e-postgres';
export const TEST_DB_PORT = 54329;

export default async function globalSetup(): Promise<void> {
  try {
    execSync(`docker rm -f ${CONTAINER_NAME}`, { stdio: 'ignore' });
  } catch {
    // not running — fine
  }

  execSync(
    `docker run -d --name ${CONTAINER_NAME} -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=e2e_test_password -e POSTGRES_DB=procraft_test -p ${TEST_DB_PORT}:5432 postgres:16-alpine`,
    { stdio: 'inherit' },
  );

  const deadline = Date.now() + 60_000;
  for (;;) {
    try {
      execSync(`docker exec ${CONTAINER_NAME} pg_isready -U postgres -d procraft_test`, { stdio: 'ignore' });
      break;
    } catch {
      if (Date.now() > deadline) {
        throw new Error('Postgres test container did not become ready in time.');
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // pg_isready can return before the init scripts finish; settle briefly.
  await new Promise((resolve) => setTimeout(resolve, 1500));
}
