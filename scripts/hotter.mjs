import net from 'net';
import { spawn } from 'child_process';

const START_PORT = 3000;
const END_PORT = 3100;
const START_WEBPACK_PORT = 8080;
const END_WEBPACK_PORT = 8180;
const START_INSPECT_PORT = 9229;
const END_INSPECT_PORT = 9329;
const DB_PREFIX = 'uwazi_development';

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

const main = async () => {
  const port = await findFreePort(START_PORT, END_PORT);
  const webpackPort = await findFreePort(START_WEBPACK_PORT, END_WEBPACK_PORT);
  const inspectPort = await findFreePort(START_INSPECT_PORT, END_INSPECT_PORT);

  if (!port) {
    console.error(
      `No free ports available in range ${START_PORT}-${END_PORT}. Stop another Uwazi instance and retry.`
    );
    process.exit(1);
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
    console.log(`Database ${tenantName} already exists. Skipping blank-state and admin-user.`);
  } else {
    await runCommand('yarn', ['blank-state', '--force', tenantName], env);
    await runCommand('yarn', ['admin-user', tenantName], env);
  }
  await runCommand('yarn', ['hot'], env);
};

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
