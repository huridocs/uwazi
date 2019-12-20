import { spawn } from 'child-process-promise';

export default async (includeRelationships = true) => {
    try {
      await spawn('yarn', [`e2e-restore-fixtures${includeRelationships ? '' : '-no-rel'}`], { capture: ['stdout', 'stderr'] });
    } catch (e) {
      process.exit(1);
    }
};
