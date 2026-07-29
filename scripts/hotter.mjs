import http from 'http';
import https from 'https';
import net from 'net';
import { spawn } from 'child_process';
import { URL } from 'url';

const START_PORT = 3000;
const END_PORT = 3100;
const START_WEBPACK_PORT = 8080;
const END_WEBPACK_PORT = 8180;
const START_INSPECT_PORT = 9229;
const END_INSPECT_PORT = 9329;
const DB_PREFIX = 'uwazi_development';
const MIGRATION_RESULT_PREFIX = '__UWAZI_MIGRATE_RESULT__=';
const requestedOffset = process.argv[2];

const isPortFree = port =>
  new Promise(resolve => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port, '127.0.0.1');
  });

const findFreePort = async (start, end) => {
  for (let port = start; port <= end; port += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(port)) {
      return port;
    }
  }
  return null;
};

const parsePreferredPort = offsetArg => {
  if (!offsetArg) {
    return null;
  }
  const offset = Number.parseInt(offsetArg, 10);
  if (Number.isNaN(offset) || offset < 0) {
    throw new Error('Invalid hotter offset. Use `yarn hotter <n>` with n >= 0 (example: `yarn hotter 3`).');
  }
  const preferredPort = START_PORT + offset;
  if (preferredPort > END_PORT) {
    throw new Error(`Requested port ${preferredPort} is outside allowed range ${START_PORT}-${END_PORT}.`);
  }
  return preferredPort;
};

const findMainPort = async preferredPort => {
  if (!preferredPort) {
    return findFreePort(START_PORT, END_PORT);
  }
  if (await isPortFree(preferredPort)) {
    return preferredPort;
  }
  throw new Error('Requested offset is occupied. Please choose another offset.');
};

// On Windows, spawn() cannot launch .cmd/.bat shims (yarn.cmd, etc.) without a shell.
const spawnOptions = (env, extra = {}) => ({
  env,
  ...(process.platform === 'win32' ? { shell: true } : {}),
  ...extra,
});

const runCommand = (command, args, env) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, spawnOptions(env, { stdio: 'inherit' }));

    child.on('close', code => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Command failed: ${command} ${args.join(' ')} (exit ${code})`));
    });

    child.on('error', error => {
      reject(error);
    });
  });

const runCommandCapture = (command, args, env) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, spawnOptions(env));
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', data => {
      stdout += data.toString();
    });

    child.stderr.on('data', data => {
      stderr += data.toString();
    });

    child.on('close', code => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      reject(new Error(`${command} failed (${code}): ${stderr.trim()}`));
    });

    child.on('error', error => {
      reject(error);
    });
  });

const runCommandObserve = (command, args, env) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, spawnOptions(env, { stdio: ['inherit', 'pipe', 'pipe'] }));
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', data => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', data => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on('close', code => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`Command failed: ${command} ${args.join(' ')} (exit ${code})`));
    });

    child.on('error', error => {
      reject(error);
    });
  });

const getMongoHost = env => {
  if (env.MONGO_URI) {
    try {
      return new URL(env.MONGO_URI).hostname || '127.0.0.1';
    } catch (error) {
      return '127.0.0.1';
    }
  }
  return env.DBHOST || '127.0.0.1';
};

const databaseExists = async (dbName, env) => {
  const host = getMongoHost(env);
  const script = `JSON.stringify(db.getMongo().getDBNames().includes('${dbName}'))`;
  const output = await runCommandCapture(
    'mongosh',
    ['--quiet', '--host', host, '--eval', script],
    env
  );
  return output === 'true';
};

const getElasticsearchBaseUrl = env => {
  const firstNode = (env.ELASTICSEARCH_URL || 'http://localhost:9200').split(',')[0].trim();
  return firstNode.replace(/\/$/, '');
};

const elasticIndexExists = (indexName, env) =>
  new Promise(resolve => {
    const indexUrl = new URL(`${getElasticsearchBaseUrl(env)}/${encodeURIComponent(indexName)}`);
    const transport = indexUrl.protocol === 'https:' ? https : http;
    const headers = {};
    if (env.ELASTICSEARCH_API_KEY) {
      headers.Authorization = `ApiKey ${env.ELASTICSEARCH_API_KEY}`;
    }

    const request = transport.request(
      {
        method: 'HEAD',
        hostname: indexUrl.hostname,
        port: indexUrl.port || (indexUrl.protocol === 'https:' ? 443 : 80),
        path: indexUrl.pathname,
        headers,
        timeout: 5000,
      },
      response => {
        response.resume();
        resolve(response.statusCode === 200);
      }
    );

    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });

    request.on('error', () => {
      resolve(false);
    });

    request.end();
  });

const parseMigrationResult = output => {
  const resultLine = output
    .split(/\r?\n/)
    .find(line => line.startsWith(MIGRATION_RESULT_PREFIX));

  if (!resultLine) {
    throw new Error('Could not determine whether yarn migrate applied migrations.');
  }

  const result = JSON.parse(resultLine.slice(MIGRATION_RESULT_PREFIX.length));
  if (typeof result?.migrated !== 'boolean') {
    throw new Error('yarn migrate did not report a valid migration result.');
  }

  return result;
};

const main = async () => {
  const preferredPort = parsePreferredPort(requestedOffset);
  const port = await findMainPort(preferredPort);
  const webpackPort = await findFreePort(START_WEBPACK_PORT, END_WEBPACK_PORT);
  const inspectPort = await findFreePort(START_INSPECT_PORT, END_INSPECT_PORT);

  if (!port) {
    console.error(
      `No free ports available in range ${START_PORT}-${END_PORT}. Stop another Uwazi instance and retry.`
    );
    process.exit(1);
  }
  if (preferredPort) {
    console.log(`Preferred main port: ${preferredPort}`);
  }
  if (!webpackPort) {
    console.error(
      `No free webpack ports available in range ${START_WEBPACK_PORT}-${END_WEBPACK_PORT}.`
    );
    process.exit(1);
  }
  if (!inspectPort) {
    console.error(
      `No free inspect ports available in range ${START_INSPECT_PORT}-${END_INSPECT_PORT}.`
    );
    process.exit(1);
  }

  const tenantName = `${DB_PREFIX}_${port}`;
  const env = {
    ...process.env,
    PORT: String(port),
    WEBPACK_PORT: String(webpackPort),
    INSPECT_PORT: String(inspectPort),
    DATABASE_NAME: tenantName,
    INDEX_NAME: tenantName,
  };

  console.log(`Selected port: ${port}`);
  console.log(`WEBPACK_PORT: ${webpackPort}`);
  console.log(`INSPECT_PORT: ${inspectPort}`);
  console.log(`DATABASE_NAME: ${tenantName}`);
  console.log(`INDEX_NAME: ${tenantName}`);

  const dbAlreadyExists = await databaseExists(tenantName, env);
  if (dbAlreadyExists) {
    console.log(`Database ${tenantName} already exists. Skipping blank-state.`);
  } else {
    await runCommand('yarn', ['blank-state', '--force', tenantName], env);
    await runCommand('yarn', ['admin-user', tenantName], env);
  }

  const { stdout: migrateOutput } = await runCommandObserve('yarn', ['migrate'], env);
  const migrationResult = parseMigrationResult(migrateOutput);
  const indexAlreadyExists = await elasticIndexExists(tenantName, env);

  if (migrationResult.migrated) {
    console.log('Migrations applied. Running reindex...');
    await runCommand('yarn', ['reindex'], env);
  } else if (!indexAlreadyExists) {
    console.log(
      `Elasticsearch index ${tenantName} does not exist. Creating index and running reindex...`
    );
    await runCommand('yarn', ['reindex'], env);
  } else {
    console.log(`Elasticsearch index ${tenantName} already exists. Skipping reindex.`);
  }

  await runCommand('yarn', ['hot'], env);
};

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
