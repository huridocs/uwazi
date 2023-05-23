export class MigrationService {
  migrate(dryRun: boolean) {
    console.log('request got in service');
    if (dryRun) {
      console.log('dry run');
    } else {
      console.log('not dry run, performing migration');
    }
    
  }
}
