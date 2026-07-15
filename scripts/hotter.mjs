import net from 'net';
import os from 'os';
import { spawn } from 'child_process';

const START_PORT = 3000;
const END_PORT = 3100;
const START_WEBPACK_PORT = 8080;
const END_WEBPACK_PORT = 8180;
const START_INSPECT_PORT = 9229;
const END_INSPECT_PORT = 9329;
const DB_PREFIX = 'uwazi_development';
const SHARED_DB = 'uwazi_shared_db';
const DEFAULT_TENANT_NAME = 'default';
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

const runCommand = (command, args, env) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env,
    });

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
    const child = spawn(command, args, { env });
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
    const child = spawn(command, args, {
      env,
      stdio: ['inherit', 'pipe', 'pipe'],
    });
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

const syncDefaultTenant = async (tenantName, port, env) => {
  const host = getMongoHost(env);
  const domain = `${os.hostname()}:${port}`;
  const rootPath = env.ROOT_PATH || process.cwd();
  const uploads = env.UPLOADS_FOLDER || `${rootPath}/uploaded_documents/`;
  const customUploads = env.CUSTOM_UPLOADS_FOLDER || `${rootPath}/custom_uploads/`;
  const activityLogs = env.ACTIVITY_LOGS_FOLDER || `${rootPath}/log/`;
  const payload = JSON.stringify({
    sharedDb: SHARED_DB,
    tenantName: DEFAULT_TENANT_NAME,
    set: { dbName: tenantName, indexName: tenantName, domain },
    setOnInsert: {
      name: DEFAULT_TENANT_NAME,
      uploadedDocuments: uploads,
      attachments: uploads,
      customUploads,
      activityLogs,
      featureFlags: {
        s3Storage: false,
        esReplicas: 0,
        deactivateTestJob: false,
        paragraphExtraction: true,
        fileCacheHeaders: true,
        themeCustomization: true,
        newHeader: true,
        postgresThesauri: true,
      },
    },
  });
  const script = `const p = ${payload}; db.getSiblingDB(p.sharedDb).tenants.updateOne({ name: p.tenantName }, { $set: p.set, $setOnInsert: p.setOnInsert }, { upsert: true });`;

  await runCommandCapture('mongosh', ['--quiet', '--host', host, '--eval', script], env);
  console.log(`Synced default tenant → ${tenantName} (${domain})`);
};

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

  await syncDefaultTenant(tenantName, port, env);

  const { stdout: migrateOutput } = await runCommandObserve('yarn', ['migrate'], env);
  const migrationResult = parseMigrationResult(migrateOutput);
  if (migrationResult.migrated) {
    await runCommand('yarn', ['reindex'], env);
  }

  await runCommand('yarn', ['hot'], env);
};

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
