/*
 * Verifies docs/migration-status.html against the actual tree.
 *
 * The dashboard's Postgres column is derived from five signals per area: a schema
 * migration, a Postgres data source, a tenant feature flag that is both defined and
 * wired into a factory, a backfill config (unless the data is ephemeral), and — as
 * advisory information only — a cross-backend consistency suite.
 *
 * Prose in the dashboard is written by hand; the `data-db` attributes are not. This
 * script owns them.
 *
 * Usage:
 *   yarn migration-status          report + exit 1 on drift
 *   yarn migration-status --json   machine-readable output
 */

// eslint-disable-next-line no-restricted-imports
import { readFileSync, readdirSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PG = 'app/api/core/infrastructure/postgresql';
const SCHEMA_DIR = `${PG}/schema_migrations`;
const CONFIGS_DIR = `${PG}/migrations/configs`;
const FACTORIES_DIR = 'app/api/core/infrastructure/factories';
const FLAGS_FILE = 'app/api/tenants/tenantsModel.ts';
const DASHBOARD = 'docs/migration-status.html';

/*
 * Areas the dashboard tracks. `tracked: false` means the area has no Postgres work
 * started or planned yet — the script only asserts the dashboard still says so.
 */
const AREAS = [
  {
    id: 'templates',
    dir: 'template',
    dataSource: 'PostgresTemplatesDataSource.ts',
    table: /create_templates_table/,
    flag: 'postgresTemplates',
    backfill: 'TemplateMigrationConfig',
  },
  {
    id: 'thesauri',
    dir: 'thesaurus',
    dataSource: 'PostgresThesauriDataSource.ts',
    table: /create_thesauri_table/,
    flag: 'postgresThesauri',
    backfill: 'ThesaurusMigrationConfig',
  },
  {
    id: 'files',
    dir: 'files',
    dataSource: 'PostgresFilesDataSource.ts',
    table: /create_files_table/,
    flag: 'postgresFiles',
    backfill: 'FilesMigrationConfig',
    consistency: /Files.*Consistency/,
  },
  {
    id: 'entities',
    dir: 'entity',
    dataSource: 'PostgresEntitiesDataSource.ts',
    table: /add-entities-table/,
    flag: 'postgresEntities',
    backfill: 'EntitiesMigrationConfig',
  },
  {
    id: 'relationship-types',
    dir: 'relationshipType',
    dataSource: 'PostgresRelationshipTypesDataSource.ts',
    table: /create_relationship_types_table/,
    flag: 'postgresRelationshipTypes',
    backfill: 'RelationshipTypesMigrationConfig',
  },
  {
    id: 'entity-permissions',
    dir: 'entityAccessPolicy',
    dataSource: 'PostgresEntityAccessPolicyDataSource.ts',
    table: /permission-rls/,
    flag: null,
    backfill: null,
  },
  {
    id: 'users',
    dir: 'user',
    dataSource: 'PostgresUsersDataSource.ts',
    table: /create-users-table/,
    flag: 'postgresUsers',
    backfill: 'UsersMigrationConfig',
    consistency: /Users.*Consistency/,
  },
  {
    id: 'user-groups',
    dir: 'user',
    dataSource: 'PostgresUserGroupsDataSource.ts',
    table: /create-usergroups-table/,
    flag: 'postgresUsergroups',
    backfill: 'UserGroupsMigrationConfig',
    consistency: /UserGroups.*Consistency/,
  },
  {
    id: 'password-recoveries',
    dir: 'passwordRecovery',
    dataSource: 'PostgresPasswordRecoveriesDataSource.ts',
    table: /create-password-recoveries-table/,
    flag: 'postgresPasswordRecoveries',
    backfill: 'PasswordRecoveryMigrationConfig',
  },
  {
    id: 'captcha',
    dir: 'captcha',
    dataSource: 'PostgresCaptchaDataSource.ts',
    table: /create-captchas-table/,
    flag: 'postgresCaptchas',
    backfill: null,
    ephemeral: true,
    consistency: /Captcha.*Consistency/,
  },
  {
    id: 'i18n',
    dir: 'translation',
    dataSource: 'PostgresTranslationsDataSource.ts',
    table: /create-translations-table/,
    flag: 'postgresTranslations',
    backfill: 'TranslationsMigrationConfig',
  },
  { id: 'languages', tracked: false, expected: 'na' },
  { id: 'settings', tracked: false },
  { id: 'pages', tracked: false },
  { id: 'relationships', tracked: false },
  { id: 'csv', tracked: false },
  { id: 'search', tracked: false },
  { id: 'dataviz-segmentation-at', tracked: false },
  { id: 'authorization-libs', tracked: false },
  { id: 'activitylog', tracked: false },
  { id: 'suggestions', tracked: false },
  { id: 'sync', tracked: false },
  { id: 'permissions-module', tracked: false },
  { id: 'px-ai-uploads', tracked: false },
  { id: 'small-v1-services', tracked: false },
  { id: 'odm-migrations', tracked: false },
];

const read = path => readFileSync(resolve(ROOT, path), 'utf8');
const list = path => (existsSync(resolve(ROOT, path)) ? readdirSync(resolve(ROOT, path)) : []);

const findFiles = (dir, predicate, found = []) => {
  const absolute = resolve(ROOT, dir);
  if (!existsSync(absolute)) return found;
  readdirSync(absolute, { withFileTypes: true }).forEach(entry => {
    const next = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') findFiles(next, predicate, found);
    } else if (predicate(entry.name)) {
      found.push(next);
    }
  });
  return found;
};

const tree = () => {
  const schema = list(SCHEMA_DIR);
  const configs = list(CONFIGS_DIR).filter(name => name.endsWith('MigrationConfig.ts'));
  const flagsSource = read(FLAGS_FILE);
  const factoriesSource = list(FACTORIES_DIR)
    .filter(name => name.endsWith('.ts'))
    .map(name => read(`${FACTORIES_DIR}/${name}`))
    .join('\n');
  const dataSources = findFiles(PG, name => /^Postgres.*DataSource\.ts$/.test(name)).filter(
    path => !path.includes('/common/')
  );
  const consistencySuites = findFiles('app/api/core', name => /Consistency\.spec\.ts$/.test(name));

  return { schema, configs, flagsSource, factoriesSource, dataSources, consistencySuites };
};

const inspect = (area, t) => {
  const signals = {
    table: t.schema.some(name => area.table.test(name)),
    dataSource: existsSync(resolve(ROOT, `${PG}/${area.dir}/${area.dataSource}`)),
    flagDefined: Boolean(area.flag) && new RegExp(`\\b${area.flag}\\b`).test(t.flagsSource),
    flagWired: Boolean(area.flag) && new RegExp(`\\b${area.flag}\\b`).test(t.factoriesSource),
    backfill: area.ephemeral
      ? 'n/a'
      : Boolean(area.backfill) && t.configs.includes(`${area.backfill}.ts`),
    consistency: area.consistency
      ? t.consistencySuites.some(path => area.consistency.test(path))
      : false,
  };

  // `consistency` is advisory: several migrated areas predate the practice.
  const required = [
    signals.table,
    signals.dataSource,
    signals.flagDefined && signals.flagWired,
    signals.backfill === 'n/a' ? true : signals.backfill,
  ];

  const met = required.filter(Boolean).length;
  let status = 'partial';
  if (met === required.length) status = 'done';
  if (met === 0) status = 'todo';

  return { signals, status };
};

const parseDashboard = () => {
  const html = read(DASHBOARD);
  const rows = [...html.matchAll(/<tr\b([^>]*data-area="[^"]+"[^>]*)>/g)].map(match => {
    const attributes = match[1];
    const attribute = name => (attributes.match(new RegExp(`data-${name}="([^"]+)"`)) || [])[1];
    return { id: attribute('area'), db: attribute('db'), v2: attribute('v2') };
  });
  const stamp = (html.match(/Verified against <b>([0-9a-f]{7,40})<\/b>/) || [])[1];
  return { rows, stamp };
};

const commitsSince = stamp => {
  if (!stamp) return null;
  try {
    const output = execFileSync(
      'git',
      [
        'log',
        '--oneline',
        `${stamp}..HEAD`,
        '--',
        PG,
        FACTORIES_DIR,
        FLAGS_FILE,
        'app/api/core/application',
      ],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    return output ? output.split('\n').length : 0;
  } catch (error) {
    return null;
  }
};

const main = () => {
  const t = tree();
  const dashboard = parseDashboard();
  const declared = new Map(dashboard.rows.map(row => [row.id, row.db]));
  const problems = [];
  const results = [];

  AREAS.forEach(area => {
    const expected = area.tracked === false ? area.expected || 'todo' : inspect(area, t).status;
    const found = declared.get(area.id);
    const signals = area.tracked === false ? null : inspect(area, t).signals;

    if (found === undefined) {
      problems.push(`no row with data-area="${area.id}" in ${DASHBOARD}`);
    } else if (found !== expected) {
      problems.push(`${area.id}: dashboard says data-db="${found}", tree says "${expected}"`);
    }

    results.push({ id: area.id, expected, declared: found, signals });
  });

  declared.forEach((_value, id) => {
    if (!AREAS.some(area => area.id === id)) {
      problems.push(`row data-area="${id}" is not in this script's registry`);
    }
  });

  const claimedDataSources = AREAS.filter(area => area.dataSource).map(
    area => `${PG}/${area.dir}/${area.dataSource}`
  );
  t.dataSources.forEach(path => {
    if (!claimedDataSources.includes(path)) {
      problems.push(`untracked Postgres data source: ${path} — add it to the registry and a row`);
    }
  });

  const claimedFlags = AREAS.map(area => area.flag).filter(Boolean);
  [...t.flagsSource.matchAll(/\b(postgres[A-Za-z]+)\s*:/g)].forEach(match => {
    if (!claimedFlags.includes(match[1])) {
      problems.push(`untracked feature flag: ${match[1]}`);
    }
  });

  const claimedConfigs = AREAS.map(area => area.backfill).filter(Boolean);
  t.configs.forEach(name => {
    if (!claimedConfigs.includes(name.replace('.ts', ''))) {
      problems.push(`untracked backfill config: ${name}`);
    }
  });

  const behind = commitsSince(dashboard.stamp);

  if (process.argv.includes('--json')) {
    process.stdout.write(
      `${JSON.stringify({ stamp: dashboard.stamp, behind, results, problems }, null, 2)}\n`
    );
  } else {
    const mark = value => (value === 'n/a' ? ' - ' : value ? ' ok' : ' --');
    process.stdout.write('\nPostgres track, derived from the tree\n\n');
    process.stdout.write(
      `${'area'.padEnd(22)}${'status'.padEnd(9)}table  source  flag  backfill  consistency\n`
    );
    results
      .filter(result => result.signals)
      .forEach(({ id, expected, signals }) => {
        process.stdout.write(
          `${id.padEnd(22)}${expected.padEnd(9)}` +
            `${mark(signals.table).padEnd(7)}${mark(signals.dataSource).padEnd(8)}` +
            `${mark(signals.flagDefined && signals.flagWired).padEnd(6)}` +
            `${mark(signals.backfill).padEnd(10)}${mark(signals.consistency)}\n`
        );
      });

    process.stdout.write(
      `\n${AREAS.length - results.filter(r => r.signals).length} further areas tracked as not started.\n`
    );

    if (behind) {
      process.stdout.write(
        `\nNote: ${behind} commit(s) touched migration paths since the dashboard stamp (${dashboard.stamp}).\n` +
          '      Re-verify the prose and update the stamp.\n'
      );
    }

    if (problems.length) {
      process.stdout.write(`\nDrift (${problems.length}):\n`);
      problems.forEach(problem => process.stdout.write(`  - ${problem}\n`));
      process.stdout.write(`\nFix ${DASHBOARD}, or the code, then run again.\n\n`);
    } else {
      process.stdout.write(`\n${DASHBOARD} matches the tree.\n\n`);
    }
  }

  process.exitCode = problems.length ? 1 : 0;
};

main();
