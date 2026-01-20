import yargs from 'yargs';
import { emitSocketEvent } from '#api/socketio/standaloneEmitSocketEvent.js';

const { tenant, event } = await yargs
  .option('tenant', {
    alias: 't',
    type: 'string',
    describe: 'tenant to send event to, defaults to all tenants.',
    default: '',
  })
  .option('event', {
    alias: 'e',
    type: 'string',
    describe: 'event name to sent to clients connected',
    choices: ['forceReconnect'],
  })
  .demandOption(['event'], '\n\n').argv;

emitSocketEvent(event, tenant, '');
