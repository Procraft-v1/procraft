import { execSync } from 'child_process';

export default async function globalTeardown(): Promise<void> {
  try {
    execSync('docker rm -f procraft-e2e-postgres', { stdio: 'ignore' });
  } catch {
    // already gone
  }
}
