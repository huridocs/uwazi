import { spawn } from 'child-process-promise';

export default async () => {
  try {
    console.log('Applying fixtures...');
    const result = await spawn('yarn', ['e2e-puppeteer-fixtures'], {
      capture: ['stdout', 'stderr'],
    });

    console.log(result.stdout.toString());

  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};
