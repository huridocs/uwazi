import { spawn } from 'child-process-promise';

export default async () => {
  try {
    await spawn('yarn', ['e2e-puppeteer-fixtures'], { capture: ['stdout', 'stderr'] });
  } catch (e) {
    process.exit(1);
  }
};
