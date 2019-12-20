import { spawn } from 'child-process-promise';

export default async () => {
  try {
    await spawn('yarn', ['blank-state'], { capture: ['stdout', 'stderr'] });
    await spawn('yarn', ['admin-user'], { capture: ['stdout', 'stderr'] });
  } catch (e) {
    process.exit(1);
  }
}
