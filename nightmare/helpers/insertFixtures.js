import { spawn } from 'child-process-promise';

export default async () => {
    try {
      await spawn('yarn', ['e2e-restore-fixtures'], { capture: ['stdout', 'stderr'] });
    } catch (e) {
      process.exit(1);
    }
};

export const insertFixturesWithoutRelationships = async () => {
  try {
    await spawn('yarn', ['e2e-restore-fixtures-no-rel'], { capture: ['stdout', 'stderr'] });
  } catch (e) {
    process.exit(1);
  }
}
