import { spawn } from 'child-process-promise';

export default async () => {
  try {
    console.log('Applying fixtures...');
    await spawn('yarn', ['e2e-puppeteer-fixtures'], {
      capture: ['stdout', 'stderr'],
    });
    console.log('Done applying fixtures...');
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};
