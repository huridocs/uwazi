import type {
  DatavizAppearance,
  DatavizChartConfig,
  DatavizDataSourceKind,
  DatavizDefinition,
  DatavizManualDataPayload,
  DatavizProcessing,
  DatavizQuery,
  DatavizRefreshPolicy,
} from '#shared/types/datavizSchema.js';
import { computeQueryHash } from '#shared/dataviz/computeQueryHash.js';
import { DatavizInvalidQueryError } from './errors.js';
import { validateExecutableDatavizQuery } from './validators/validateExecutableDatavizQuery.js';
import { validateLiveRefreshAllowed } from './validators/validateLiveRefreshAllowed.js';
import { validateManualData } from './validators/validateManualData.js';

type Props = {
  id: string;
  name: string;
  description?: string;
  dataSource?: DatavizDataSourceKind;
  query: DatavizQuery;
  manualData?: DatavizManualDataPayload;
  chart: DatavizChartConfig;
  appearance: DatavizAppearance;
  refresh: DatavizRefreshPolicy;
  processing?: DatavizProcessing;
  embedPublic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  /** Skip invariant checks when rehydrating persisted documents (validation runs on save). */
  skipValidation?: boolean;
};

class Dataviz {
  readonly id: string;

  readonly name: string;

  readonly description?: string;

  readonly dataSource: DatavizDataSourceKind;

  readonly query: DatavizQuery;

  readonly manualData?: DatavizManualDataPayload;

  readonly chart: DatavizChartConfig;

  readonly appearance: DatavizAppearance;

  readonly refresh: DatavizRefreshPolicy;

  readonly processing?: DatavizProcessing;

  readonly embedPublic: boolean;

  readonly createdAt?: Date;

  readonly updatedAt?: Date;

  constructor(props: Props) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.dataSource = props.dataSource ?? 'query';
    this.query = props.query;
    this.manualData = props.manualData;
    this.chart = props.chart;
    this.appearance = props.appearance;
    this.refresh = props.refresh;
    this.processing = props.processing;
    this.embedPublic = props.embedPublic ?? false;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    if (!props.skipValidation) {
      this.validate();
    }
  }

  get queryHash(): string {
    return computeQueryHash(this.query);
  }

  get isScheduled(): boolean {
    return this.refresh.refreshMode === 'snapshot_scheduled';
  }

  get usesSnapshot(): boolean {
    return this.refresh.refreshMode !== 'live';
  }

  get isManual(): boolean {
    return this.dataSource === 'manual';
  }

  private validate(): void {
    if (!this.name.trim()) {
      throw new DatavizInvalidQueryError('Dataviz name is required');
    }

    if (this.isManual) {
      validateManualData(this.manualData);
      return;
    }

    validateExecutableDatavizQuery(this.query);
    validateLiveRefreshAllowed(this.refresh.refreshMode, this.query);
  }

  validateForPersist(): void {
    this.validate();
  }

  withProcessing(processing: DatavizProcessing): Dataviz {
    return new Dataviz({ ...this.toProps(), processing, skipValidation: true });
  }

  withRefresh(refresh: DatavizRefreshPolicy): Dataviz {
    return new Dataviz({ ...this.toProps(), refresh, skipValidation: true });
  }

  toDefinition(): DatavizDefinition {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      dataSource: this.dataSource,
      query: this.query,
      manualData: this.manualData,
      chart: this.chart,
      appearance: this.appearance,
      refresh: this.refresh,
      processing: this.processing,
      embedPublic: this.embedPublic,
      createdAt: this.createdAt?.toISOString(),
      updatedAt: this.updatedAt?.toISOString(),
    };
  }

  private toProps(): Props {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      dataSource: this.dataSource,
      query: this.query,
      manualData: this.manualData,
      chart: this.chart,
      appearance: this.appearance,
      refresh: this.refresh,
      processing: this.processing,
      embedPublic: this.embedPublic,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromPersistence(definition: DatavizDefinition): Dataviz {
    return new Dataviz({
      id: definition.id,
      name: definition.name,
      description: definition.description,
      dataSource: definition.dataSource,
      query: definition.query,
      manualData: definition.manualData,
      chart: definition.chart,
      appearance: definition.appearance,
      refresh: definition.refresh,
      processing: definition.processing,
      embedPublic: definition.embedPublic,
      createdAt: definition.createdAt ? new Date(definition.createdAt) : undefined,
      updatedAt: definition.updatedAt ? new Date(definition.updatedAt) : undefined,
      skipValidation: true,
    });
  }

  static fromDefinition(definition: DatavizDefinition): Dataviz {
    return Dataviz.fromPersistence(definition);
  }
}

export { Dataviz };
