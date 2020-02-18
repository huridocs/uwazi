/** @format */ // eslint-disable-line max-lines
/* eslint-disable no-await-in-loop, no-console, camelcase */
import { TaskProvider, Task } from 'api/tasks/tasks';
import { tcServer, useThesaurusNames } from 'api/config/topicClassification';
import entities from 'api/entities';
import { MetadataObject } from 'api/entities/entitiesModel';
import { EntitySchema } from 'api/entities/entityType';
import { QueryForEach, WithId } from 'api/odm';
import templates from 'api/templates';
import thesauri from 'api/thesauri';
import { extractSequence } from 'api/topicclassification/common';
import connect, { disconnect } from 'api/utils/connect_to_mongo';
import { buildFullModelName } from 'shared/commonTopicClassification';
import JSONRequest from 'shared/JSONRequest';
import { propertyTypes } from 'shared/propertyTypes';
import { ensure, sleep } from 'shared/tsUtils';
import { PropertySchema } from 'shared/types/commonTypes';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { provenanceTypes } from 'shared/provenanceTypes';

export interface SyncArgs {
  limit?: number;
  mode: 'onlynew' | 'autoaccept';
  model?: string;
  noDryRun?: boolean;
  autoAcceptConfidence?: number;
}

type ClassificationSample = {
  seq: string;
  sharedId: string | undefined;
  training_labels: {
    topic: string;
  }[];
};

type ClassificationSampleRequest = {
  refresh_predictions: boolean;
  samples: ClassificationSample[];
};

type ClassificationSampleResponse = {
  json: { samples: { sharedId: string; predicted_labels: { topic: string; quality: number }[] }[] };
  status: any;
};

async function sendSample(
  path: string,
  request: ClassificationSampleRequest
): Promise<ClassificationSampleResponse | null> {
  let response: ClassificationSampleResponse = { json: { samples: [] }, status: 0 };
  let lastErr;
  for (let i = 0; i < 10; i += 1) {
    lastErr = undefined;
    try {
      response = await JSONRequest.put(path, request);
      if (response.status === 200) {
        break;
      }
    } catch (err) {
      lastErr = err;
    }
    console.error(`Attempt ${i} failed: ${response.status} ${lastErr}`);
    await sleep(523);
  }
  if (lastErr) {
    throw lastErr;
  }
  if (response.status !== 200) {
    console.error(response);
    return null;
  }
  return response;
}

async function handleResponse(
  args: SyncArgs,
  e: WithId<EntitySchema>,
  templateAndProp: any,
  response: ClassificationSampleResponse,
  thesaurus: ThesaurusSchema
) {
  const prop = templateAndProp[(e.template || '').toString()];
  if (!prop || !prop.name) {
    console.error(`Missing prop for ${e.sharedId}`);
    return false;
  }
  const sample = response.json.samples.find(s => s.sharedId === e.sharedId);
  if (!sample) {
    return false;
  }
  if (!sample.predicted_labels.length) {
    console.error(`No suggestions for ${e.sharedId}`);
  }
  let newPropMetadata = sample.predicted_labels
    .reduce((res: MetadataObject<string>[], pred) => {
      const thesValue = (thesaurus.values || []).find(v => v.label === pred.topic);
      if (!thesValue || !thesValue.id) {
        console.error(`Model suggestion "${pred.topic}" not found in thesaurus ${thesaurus.name}`);
        return res;
      }
      return [
        ...res,
        { value: thesValue.id, label: pred.topic, suggestion_confidence: pred.quality },
      ];
    }, [])
    .sort((v1, v2) => (v2.suggestion_confidence || 0) - (v1.suggestion_confidence || 0));
  if (prop.type === propertyTypes.select && newPropMetadata.length) {
    newPropMetadata = [newPropMetadata[0]];
  }

  if (args.mode === 'autoaccept') {
    if (((e.metadata ?? {})[prop.name] ?? []).length) {
      if (
        !overwrite ||
        !e.metadata![prop.name]!.every(v => v.provenance === provenanceTypes.bulk)
      ) {
        console.error(`Will not overwrite previous metadata for ${e.sharedId}`);
        return false;
      }
    }
    if (!newPropMetadata.length) {
      return false;
    }
    newPropMetadata = newPropMetadata
      .filter(v => (v.suggestion_confidence ?? 0) >= (args.autoAcceptConfidence ?? 2.0))
      .map(v => ({ ...v, provenance: provenanceTypes.bulk }));
    if (!e.metadata) {
      e.metadata = {};
    }
    if (JSON.stringify(newPropMetadata) !== JSON.stringify(e.metadata[prop.name])) {
      e.metadata[prop.name] = newPropMetadata;
      if (args.noDryRun) {
        await entities.save(e, { user: 'sync-topic-classification', language: e.language });
      }
      console.info(
        `${!args.noDryRun ? '[DRY-RUN] ' : ' '}Saved ${e.sharedId} (${newPropMetadata.length})`
      );
    }
    return true;
  }

  if (!e.suggestedMetadata) {
    e.suggestedMetadata = {};
  }
  // We explicitely preserve empty arrays in suggestedMetadata to not
  // recreate rejected suggestions.
  if (!e.suggestedMetadata[prop.name] || overwrite) {
    // JSON.stringify provides an easy and fast deep-equal comparison.
    if (JSON.stringify(newPropMetadata) !== JSON.stringify(e.suggestedMetadata[prop.name])) {
      e.suggestedMetadata[prop.name] = newPropMetadata;
      if (!dryRun) {
        await entities.save(e, { user: 'sync-topic-classification', language: e.language });
      }
      console.info(`${dryRun ? '[DRY-RUN] ' : ' '}Saved ${e.sharedId}`);
    }
  }
  return true;
}

class SyncTask extends Task {
  protected async run(args: SyncArgs) {
    this.status.message = `Started with ${require('util').inspect(args)}`;
  }
}

TaskProvider.registerClass('TopicClassificationSync', SyncTask);
