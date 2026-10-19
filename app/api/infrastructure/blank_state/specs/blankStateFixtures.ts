import type { Pool } from 'pg';

type BlankStateSeedIds = {
  template?: string;
  settings?: string;
  user?: string;
  translations?: string[];
};

type BlankStateSeedOptions = {
  siteName?: string;
  ids?: BlankStateSeedIds;
};

const TRANSLATION_LABELS = ['Document', 'Title'] as const;

/** Seeds the blank-state tables (template, settings, user, translations) for one tenant. */
async function seedBlankState(
  pool: Pool,
  tenantId: string,
  options: BlankStateSeedOptions = {}
): Promise<void> {
  const templateId = options.ids?.template ?? 'tpl-doc';
  const settingsId = options.ids?.settings ?? `${tenantId}-settings`;
  const userId = options.ids?.user ?? `${tenantId}-admin`;
  const translationIds = options.ids?.translations ?? [`${tenantId}-tr`];

  await pool.query(
    `INSERT INTO templates ("_id","name","properties","commonProperties","color","default","tenant_id")
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      templateId,
      'Document',
      '[{"name":"title","type":"text"}]',
      '[{"name":"title","label":"Title"}]',
      '#c03b22',
      true,
      tenantId,
    ]
  );
  await pool.query(
    `INSERT INTO settings ("tenant_id","_id","site_name","languages","private","new_name_generation")
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [tenantId, settingsId, options.siteName ?? 'Uwazi', '[{"key":"en","default":true}]', true, true]
  );
  await pool.query(
    `INSERT INTO users ("_id","tenant_id","username","password","email","role")
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [userId, tenantId, 'admin', 'secret', 'admin@uwazi.local', 'admin']
  );
  await Promise.all(
    translationIds.map(async (id, index) =>
      pool.query(
        `INSERT INTO translations ("_id","language","key","value","context_id","context_type","context_label","tenant_id")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          id,
          'en',
          TRANSLATION_LABELS[index] ?? TRANSLATION_LABELS[0],
          TRANSLATION_LABELS[index] ?? TRANSLATION_LABELS[0],
          templateId,
          'Entity',
          'Document',
          tenantId,
        ]
      )
    )
  );
}

/** Removes every row the blank-state fixtures may have inserted, across all tenants. */
async function clearBlankState(pool: Pool): Promise<void> {
  await pool.query('DELETE FROM templates');
  await pool.query('DELETE FROM settings');
  await pool.query('DELETE FROM users');
  await pool.query('DELETE FROM translations');
  await pool.query('DELETE FROM updatelogs');
}

export { clearBlankState, seedBlankState };
