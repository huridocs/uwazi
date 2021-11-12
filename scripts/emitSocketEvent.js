import { emitSocketEvent } from '../app/api/socketio/standaloneEmitSocketEvent';

const { tenant, event } = require('yargs')
  .option('tenant', {
    alias: 't',
    type: 'string',
    describe: 'tenant to send event to, "all" sends to all tenants.',
  })
  .option('event', {
    alias: 'e',
    type: 'string',
    describe: 'event name to sent to clients connected',
    choices: ['forceReconnect'],
  })
  .demandOption(['tenant', 'event'], '\n\n').argv;

emitSocketEvent(tenant, event, '');
