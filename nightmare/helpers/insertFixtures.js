import { spawn } from 'child-process-promise';

export default async () => {
  try {
    const fixtures = await spawn('yarn', ['e2e-restore-fixtures'], {
      capture: ['stdout', 'stderr'],
    });
    console.log(fixtures.stdout);
  } catch (e) {
    process.exit(1);
  }
};
