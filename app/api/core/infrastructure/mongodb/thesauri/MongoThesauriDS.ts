import { Result, ResultType } from '#api/core/libs/Result.js';
import { ObjectId } from 'mongodb';
import { ThesaurusSchema } from '#shared/types/thesaurusType.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';

// Todo: This will eventually got removed from here to domain folder.
interface ThesauriDataSource {
  exists(id: string): Promise<boolean>;
  getById(id: string): Promise<ResultType<ThesaurusSchema, Error>>;
}

class MongoThesauriDataSource
  extends MongoDataSource<ThesaurusSchema>
  implements ThesauriDataSource
{
  protected collectionName = 'dictionaries';

  async exists(id: string): Promise<boolean> {
    const doc = await this.getCollection().findOne({ _id: ObjectId.createFromHexString(id) });
    return !!doc;
  }

  async getById(id: string): Promise<ResultType<ThesaurusSchema, Error>> {
    const doc = await this.getCollection().findOne({ _id: ObjectId.createFromHexString(id) });
    if (!doc) {
      return Result.fail(new Error(`Thesaurus value of id ${id} not found`));
    }
    return Result.ok(doc);
  }

  // v2 extension: append missing root labels in a transaction-aware way
  async appendRootLabelsIfMissing(thesaurusId: string, labels: string[]): Promise<void> {
    const dbo = await this.getCollection().findOne({
      _id: ObjectId.createFromHexString(thesaurusId),
    });
    const current = (dbo?.values || []) as Array<{ label: string }>;
    const existing = new Set(current.map(v => v.label));
    const additions = Array.from(new Set(labels))
      .map(l => (typeof l === 'string' ? l.trim() : ''))
      .filter(l => l.length > 0 && !existing.has(l))
      .map(label => ({ label }));
    if (!additions.length) return;
    await this.getCollection().updateOne(
      { _id: ObjectId.createFromHexString(thesaurusId) },
      { $set: { values: [...current, ...additions] } }
    );
  }

  /**
   * Appends nested labels (parent and optional child) if missing.
   * If child is present, parent will be created if missing.
   */
  // eslint-disable-next-line max-statements
  async appendNestedLabelsIfMissing(
    thesaurusId: string,
    entries: Array<{ parent: string; child?: string }>
  ): Promise<void> {
    if (!entries.length) return;
    const dbo = await this.getCollection().findOne({
      _id: ObjectId.createFromHexString(thesaurusId),
    });
    const current = (dbo?.values || []) as Array<{
      label: string;
      values?: Array<{ label: string }>;
    }>;

    const normalizedParentToChildren = new Map<string, { label: string; children: Set<string> }>();

    // Seed map from current thesaurus
    for (const v of current) {
      const parentLabel = v.label;
      const children = new Set((v.values || []).map(c => c.label));
      normalizedParentToChildren.set(parentLabel, { label: parentLabel, children });
    }

    // Apply additions
    for (const e of entries) {
      const parent = e.parent?.trim();
      if (!parent) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const existingParent = normalizedParentToChildren.get(parent);
      if (!existingParent) {
        normalizedParentToChildren.set(parent, { label: parent, children: new Set() });
      }
      const target = normalizedParentToChildren.get(parent)!;
      if (e.child) {
        const child = e.child.trim();
        if (child && !target.children.has(child)) {
          target.children.add(child);
        }
      }
    }

    // Build final values array
    const mergedValues = Array.from(normalizedParentToChildren.values()).map(p => ({
      label: p.label,
      ...(p.children.size ? { values: Array.from(p.children).map(c => ({ label: c })) } : {}),
    }));

    await this.getCollection().updateOne(
      { _id: ObjectId.createFromHexString(thesaurusId) },
      { $set: { values: mergedValues } }
    );
  }
}

export { MongoThesauriDataSource };

export type { ThesauriDataSource };
