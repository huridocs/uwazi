/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-lines */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable max-statements */

import { Document, ObjectId } from 'mongodb';
import { buildPipelineFromDiff } from './PipelineBuilder';

type MongoDocument = Document & { _id: ObjectId };

/**
 * The result of a document diff, containing MongoDB update operators.
 * @property {$pull} - Removes elements from an array that match a specified condition.
 * @property {$set} - Sets the value of a field in a document.
 * @property {$push} - Adds an item to an array.
 * @property {$unset} - Removes a specified field from a document.
 * @property {arrayFilters} - An array of filter documents for use with update operations on arrays.
 */
type DiffResult = {
  $pull?: Record<string, any>;
  $set?: Record<string, any>;
  $push?: Record<string, any>;
  $unset?: Record<string, any>;
  arrayFilters?: Record<string, any>[];
};

/**
 * Tracks changes to a MongoDB document and generates a minimal update document with
 * atomic operators ($set, $unset, $push, $pull) to apply those changes.
 *
 * It is designed to be used in an "optimistic concurrency" pattern where a document
 * is loaded, modified, and then saved back with a minimal update.
 *
 * @template T The document type, which must have an `_id`.
 */
class DocumentTracker<T extends MongoDocument = MongoDocument> {
  private snapshots = new Map<string, T>(); // key: _id.toHexString()

  /**
   * Begins tracking a document by taking an immutable snapshot.
   * Throws an error if the document is already being tracked.
   * @param document The document to track.
   */
  public track(document: T): void {
    const idHex = this.idToHex(document._id);
    if (this.snapshots.has(idHex)) {
      throw new Error(`The following document is already being tracked. id = ${idHex}`);
    }
    this.snapshots.set(idHex, this.clonePreserveObjectId(document));
  }

  /**
   * Compares the current document with its last committed snapshot and generates
   * a MongoDB update document to apply the changes.
   * @param document The current document with potential modifications.
   * @returns A `DiffResult` object containing MongoDB update operators.
   */
  public diff(document: T) {
    const idHex = this.idToHex(document._id);
    const snapshot = this.snapshots.get(idHex);
    if (!snapshot) {
      throw new Error(`The following document was not tracked. id = ${idHex}`);
    }

    const orig = this.clonePreserveObjectId(snapshot);
    const cur = this.clonePreserveObjectId(document);

    const $set: Record<string, any> = {};
    const $unset: Record<string, any> = {};
    const pushes: Record<string, any[]> = {};
    const pullsByPath: Record<string, any[]> = {};
    const arrayFilters: Record<string, any>[] = [];

    this.walk(orig, cur, [], { $set, $unset, pushes, pullsByPath, arrayFilters });

    // Consolidate pushes and pulls from `walk` into the final operators.
    const $pull: Record<string, any> = {};
    for (const path in pullsByPath) {
      if (pullsByPath[path].length) {
        $pull[path] = { _id: { $in: pullsByPath[path] } };
      }
    }

    const $push: Record<string, any> = {};
    for (const path in pushes) {
      if (pushes[path].length) {
        $push[path] = { $each: pushes[path] };
      }
    }

    // Build the final result object in canonical order
    const result: DiffResult = {};
    if (Object.keys($pull).length) result.$pull = $pull;
    if (Object.keys($set).length) {
      // Safety guard: never set _id
      for (const key of Object.keys($set)) {
        if (key.endsWith('._id')) {
          delete $set[key];
        }
      }
      if (Object.keys($set).length) result.$set = $set;
    }
    if (Object.keys($push).length) result.$push = $push;
    if (Object.keys($unset).length) result.$unset = $unset;
    if (arrayFilters.length) result.arrayFilters = arrayFilters;

    this.clear(document);

    return buildPipelineFromDiff(result);
  }

  /**
   * Commits the current state of a document, replacing the old snapshot with a new one.
   * This is typically called after a successful database update.
   * @param document The document to commit.
   */
  public commit(document: T): void {
    const idHex = this.idToHex(document._id);
    if (!this.snapshots.has(idHex)) {
      throw new Error(`The following document was not being tracked. id = ${idHex}`);
    }
    this.snapshots.set(idHex, this.clonePreserveObjectId(document));
  }

  public clear(document: T): void {
    const idHex = this.idToHex(document._id);
    this.snapshots.delete(idHex);
  }

  // --- PRIVATE HELPERS ---

  /**
   * Recursively walks the original and current document structures to find differences.
   * @param orig The original object or primitive from the snapshot.
   * @param cur The current object or primitive from the new document.
   * @param pathParts An array representing the current path in the document tree.
   * @param diffs A container object to hold the discovered diffs.
   */
  private walk(
    orig: any,
    cur: any,
    pathParts: (string | number)[],
    diffs: {
      $set: Record<string, any>;
      $unset: Record<string, any>;
      pushes: Record<string, any[]>;
      pullsByPath: Record<string, any[]>;
      arrayFilters: Record<string, any>[];
    }
  ): void {
    const path = this.buildPath(pathParts);

    // Case 1: Something was added or removed entirely
    if (orig === undefined && cur !== undefined) {
      diffs.$set[path] = cur;
      return;
    }
    if (cur === undefined && orig !== undefined) {
      diffs.$unset[path] = '';
      return;
    }

    // Case 2: One is an object/array, the other is not (type change)
    if (this.isTypeMismatch(orig, cur)) {
      diffs.$set[path] = cur;
      return;
    }

    // Case 3: Both are non-object/non-array primitives
    if (!this.isObject(orig) && !Array.isArray(orig)) {
      if (!this.valuesEqual(orig, cur)) {
        diffs.$set[path] = cur;
      }
      return;
    }

    // Case 4: Both are arrays
    if (Array.isArray(orig) && Array.isArray(cur)) {
      this.diffArrays(orig, cur, path, diffs);
      return;
    }

    // Case 5: Both are objects
    if (this.isObject(orig) && this.isObject(cur)) {
      this.diffObjects(orig, cur, pathParts, diffs);
    }
  }

  /**
   * Diffs two objects recursively by walking their keys.
   */
  private diffObjects(
    orig: Record<string, any>,
    cur: Record<string, any>,
    pathParts: (string | number)[],
    diffs: any
  ): void {
    const allKeys = new Set([...Object.keys(orig), ...Object.keys(cur)]);
    for (const key of allKeys) {
      if (key === '_id') continue; // Never update the _id field
      this.walk(orig[key], cur[key], [...pathParts, key], diffs);
    }
  }

  /**
   * Diffs two arrays. Handles arrays of objects with `_id` and simple arrays.
   */
  private diffArrays(origArr: any[], curArr: any[], path: string, diffs: any): void {
    const origHasId = origArr.length > 0 && this.isObject(origArr[0]) && '_id' in origArr[0];
    const curHasId = curArr.length > 0 && this.isObject(curArr[0]) && '_id' in curArr[0];

    if (origHasId || curHasId) {
      this.diffArrayOfObjectsWithId(origArr, curArr, path, diffs);
    } else {
      // For simple arrays, a simple element-by-element check is more efficient than JSON.stringify
      let changed = origArr.length !== curArr.length;
      if (!changed) {
        for (let i = 0; i < origArr.length; i++) {
          if (!this.valuesEqual(origArr[i], curArr[i])) {
            changed = true;
            break;
          }
        }
      }
      if (changed) {
        diffs.$set[path] = curArr;
      }
    }
  }

  /**
   * Diffs an array of objects based on their `_id` field.
   * This is the most complex part, identifying removed, added, and modified elements.
   */
  private diffArrayOfObjectsWithId(origArr: any[], curArr: any[], path: string, diffs: any): void {
    const origMap = new Map(
      origArr.filter(item => item && '_id' in item).map(item => [this.idToHex(item._id), item])
    );
    const curMap = new Map(
      curArr.filter(item => item && '_id' in item).map(item => [this.idToHex(item._id), item])
    );

    // Find removed items for the $pull operator
    const removedIds: ObjectId[] = [];
    for (const [hex, item] of origMap) {
      if (!curMap.has(hex)) {
        removedIds.push(item._id);
      }
    }
    if (removedIds.length) {
      diffs.pullsByPath[path] = diffs.pullsByPath[path] || [];
      diffs.pullsByPath[path].push(...removedIds);
    }

    // Find new items for the $push operator
    const newItems: any[] = [];
    for (const [hex, item] of curMap) {
      if (!origMap.has(hex)) {
        newItems.push(item);
      }
    }
    if (newItems.length) {
      diffs.pushes[path] = diffs.pushes[path] || [];
      diffs.pushes[path].push(...newItems);
    }

    // Find modified items for $set with arrayFilters
    for (const [hex, curItem] of curMap) {
      const origItem = origMap.get(hex);
      if (!origItem) continue; // This is a new item, handled by $push

      const filterName = `elem_${hex}`;
      const filterSpec: Record<string, any> = { [`${filterName}._id`]: this.hexToObjectId(hex) };
      diffs.arrayFilters.push(filterSpec);

      this.diffObjectWithArrayFilter(origItem, curItem, `${path}.$[${filterName}]`, diffs);
    }
  }

  /**
   * Diffs two objects and builds update paths with array filter syntax.
   */
  private diffObjectWithArrayFilter(orig: any, cur: any, path: string, diffs: any): void {
    const allKeys = new Set([...Object.keys(orig || {}), ...Object.keys(cur || {})]);
    for (const key of allKeys) {
      if (key === '_id') continue;
      const subPath = `${path}.${key}`;
      const origVal = orig?.[key];
      const curVal = cur?.[key];

      if (this.isTypeMismatch(origVal, curVal)) {
        if (curVal !== undefined) {
          diffs.$set[subPath] = curVal;
        } else {
          diffs.$unset[subPath] = '';
        }
        continue;
      }

      if (this.isObject(origVal) && this.isObject(curVal)) {
        this.diffObjectWithArrayFilter(origVal, curVal, subPath, diffs);
      } else if (Array.isArray(origVal) && Array.isArray(curVal)) {
        this.diffArrays(origVal, curVal, subPath, diffs);
      } else if (!this.valuesEqual(origVal, curVal)) {
        if (curVal !== undefined) {
          diffs.$set[subPath] = curVal;
        } else {
          diffs.$unset[subPath] = '';
        }
      }
    }
  }

  // --- Utility Functions ---

  /**
   * Checks if two values are of different fundamental types (object/array vs primitive).
   */
  private isTypeMismatch(a: any, b: any): boolean {
    const typeA = this.getComplexType(a);
    const typeB = this.getComplexType(b);
    return typeA !== typeB && typeA !== undefined && typeB !== undefined;
  }

  private getComplexType(v: any): string | undefined {
    if (Array.isArray(v)) return 'array';
    if (this.isObject(v)) return 'object';
    if (v === null || v === undefined) return undefined;
    return 'primitive';
  }

  /**
   * Converts a MongoDB ObjectId or any other ID to its hex string representation.
   */
  private idToHex(id: any): string {
    if (id instanceof ObjectId) {
      return id.toHexString();
    }
    return String(id);
  }

  /**
   * Converts a hex string back to an ObjectId instance.
   */
  private hexToObjectId(hex: string): ObjectId {
    return new ObjectId(hex);
  }

  /**
   * Builds a dot-separated path string from an array of parts.
   */
  private buildPath(parts: (string | number)[]): string {
    return parts.map(String).join('.');
  }

  /**
   * Performs a deep clone of an object, but preserves existing `ObjectId` instances.
   * @param input The object or primitive to clone.
   */
  private clonePreserveObjectId<V>(input: V): V {
    if (input instanceof ObjectId) {
      return input as unknown as V;
    }
    if (Array.isArray(input)) {
      return input.map(item => this.clonePreserveObjectId(item)) as unknown as V;
    }
    if (this.isObject(input)) {
      const out: Record<string, any> = {};
      for (const key of Object.keys(input as any)) {
        out[key] = this.clonePreserveObjectId((input as any)[key]);
      }
      return out as unknown as V;
    }
    return input;
  }

  /**
   * Checks if a value is a plain object, excluding null, arrays, and ObjectId.
   */
  private isObject(v: any): v is Record<string, any> {
    return v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof ObjectId);
  }

  /**
   * Compares two values for equality, handling ObjectId instances specifically.
   */
  private valuesEqual(a: any, b: any): boolean {
    if (a instanceof ObjectId && b instanceof ObjectId) {
      return a.toHexString() === b.toHexString();
    }
    return a === b;
  }
}

export { DocumentTracker };
export type { MongoDocument, DiffResult };
