import { spawn } from 'child-process-promise';

export default async () => {
  try {
    console.log('Applying fixtures...');
    await spawn('yarn', ['e2e-fixtures'], {
      capture: ['stdout', 'stderr'],
    });
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};
