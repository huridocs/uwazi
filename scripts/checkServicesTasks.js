const RedisSMQ = require('rsmq');
const Redis = require('redis');

const { tenant, redisUrl, read, deleteAll, service, deleteOne } = require('yargs')
  .option('tenant', {
    alias: 't',
    type: 'string',
    describe: 'Tenant to check',
  })
  .option('redisUrl', {
    alias: 'u',
    type: 'string',
    describe: 'Redis url',
    default: 'redis://localhost:6379',
  })
  .option('service', {
    alias: 's',
    type: 'string',
    describe: 'Service queue',
    choices: ['information_extraction', 'segmentation'],
  })
  .option('read', {
    alias: 'r',
    type: 'boolean',
    describe: 'Read the queue',
    default: true,
  })
  .option('deleteAll', {
    alias: 'D',
    type: 'boolean',
    describe: 'Delete all messages from the queue',
    default: false,
  })
  .option('deleteOne', {
    alias: 'd',
    type: 'string',
    describe: 'ID of the message to be deleted',
  })

  .demandOption(['service'], '\n\n').argv;

const run = async () => {
  const redisClient = await Redis.createClient(redisUrl);
  const redisSMQ = await new RedisSMQ({ client: redisClient });

  const readFirstTaskMessage = async () => {
    const message = await redisSMQ.receiveMessageAsync({
      qname: `${service}_tasks`,
      vt: 1,
    });

    if (!message.id) {
      return undefined;
    }

    return message;
  };

  const deleteMessage = async id => {
    await redisSMQ.deleteMessageAsync({
      qname: `${service}_tasks`,
      id,
    });
  };

  const readAllTaskMessages = async () => {
    const messages = [];
    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const message = await readFirstTaskMessage();
      if (!message) {
        break;
      }

      messages.push(message);
    }

    return messages;
  };

  const formatMessage = message => {
    const messageData = JSON.parse(message.message);
    return {
      id: message.id,
      task: messageData.task,
      tenant: messageData.tenant,
      params: messageData.params,
      sent: new Date(message.sent).toLocaleString(),
    };
  };

  if (deleteOne) {
    console.log(`💣 \u001b[31m DELETING message \u001b[32m${deleteOne}\u001b[37m`);
    try {
      await deleteMessage(deleteOne);
    } catch (e) {
      console.log(e);
    }
  }

  const queue = await redisSMQ.getQueueAttributesAsync({ qname: `${service}_tasks` });
  console.log(`⚠️ \u001b[33m ${queue.hiddenmsgs} hidden\u001b[37m tasks (been read by others)`);
  let messages = await readAllTaskMessages();
  messages = messages.map(formatMessage);

  if (tenant) {
    messages = messages.filter(message => message.tenant === tenant);
  }

  if (deleteAll) {
    console.log(`💣 \u001b[31m DELETING ${messages.length} messages\u001b[37m`);
    await Promise.all(messages.map(message => deleteMessage(message.id)));
    messages = [];
  }

  if (read) {
    console.table(messages);
  }

  await redisClient.end(true);
};
run();
