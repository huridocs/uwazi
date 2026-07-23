/* eslint-disable max-statements */
import { TelemetryCollector } from '../TelemetryCollector.js';

describe('TelemetryCollector', () => {
  let dateNowSpy: jest.SpyInstance;
  let currentTime: number;

  beforeEach(() => {
    currentTime = 1000;
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => {
      currentTime += 1;
      return currentTime;
    });
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with main operation timer started', () => {
      const collector = new TelemetryCollector('main_operation');
      const result = collector.build();

      expect(result.summary.main_operation).toBe('main_operation');
      expect(result.summary.total_duration_ms).toBeGreaterThan(0);
    });
  });

  describe('add', () => {
    it('should add metadata to the collector', () => {
      const collector = new TelemetryCollector('main_operation');
      collector.add({ userId: '123', action: 'create' });
      collector.add({ entityId: '456' });

      const result = collector.build();

      expect(result.userId).toBe('123');
      expect(result.action).toBe('create');
      expect(result.entityId).toBe('456');
    });

    it('should merge metadata objects', () => {
      const collector = new TelemetryCollector('main_operation');
      collector.add({ a: 1, b: 2 });
      collector.add({ b: 3, c: 4 });

      const result = collector.build();

      expect(result.a).toBe(1);
      expect(result.b).toBe(3);
      expect(result.c).toBe(4);
    });
  });

  describe('runSpan', () => {
    it('should run a span and record its duration', async () => {
      const collector = new TelemetryCollector('main_operation');

      await collector.runSpan('operation_1', async () => {
        currentTime += 100;
      });

      const result = collector.build();
      const timing = result.timings.find((t: any) => t.operation === 'operation_1');

      expect(timing).toBeDefined();
      expect(timing.duration_ms).toBeGreaterThanOrEqual(100);
    });

    it('should nest a span started inside another span as its child', async () => {
      const collector = new TelemetryCollector('main_operation');

      await collector.runSpan('parent', async () => {
        currentTime += 10;
        await collector.runSpan('child', async () => {
          currentTime += 50;
        });
      });

      const result = collector.build();

      expect(result.timings).toHaveLength(1);
      expect(result.timings[0].operation).toBe('parent');
      expect(result.timings[0].children).toHaveLength(1);
      expect(result.timings[0].children[0].operation).toBe('child');
      expect(result.timings[0].children[0].duration_ms).toBeGreaterThanOrEqual(50);
    });

    it('should nest a span across an await boundary inside the parent', async () => {
      const collector = new TelemetryCollector('main_operation');

      await collector.runSpan('parent', async () => {
        await Promise.resolve();
        await collector.runSpan('child', async () => {
          currentTime += 20;
        });
      });

      const result = collector.build();

      expect(result.timings[0].operation).toBe('parent');
      expect(result.timings[0].children[0].operation).toBe('child');
    });

    it('should keep repeated calls to the same operation as separate sibling entries', async () => {
      const collector = new TelemetryCollector('main_operation');

      await collector.runSpan('repeated_operation', async () => {
        currentTime += 50;
      });
      await collector.runSpan('repeated_operation', async () => {
        currentTime += 75;
      });

      const result = collector.build();
      const timings = result.timings.filter((t: any) => t.operation === 'repeated_operation');

      expect(timings).toHaveLength(2);
    });

    it('should attribute concurrent sibling spans to the same parent, not to each other', async () => {
      const collector = new TelemetryCollector('main_operation');

      await Promise.all([
        collector.runSpan('sibling_a', async () => {
          await Promise.resolve();
        }),
        collector.runSpan('sibling_b', async () => {
          await Promise.resolve();
        }),
      ]);

      const result = collector.build();

      expect(result.timings).toHaveLength(2);
      expect(result.timings.every((t: any) => !t.children)).toBe(true);
    });

    it('should still record the span duration and propagate the error when the span throws', async () => {
      const collector = new TelemetryCollector('main_operation');

      await expect(
        collector.runSpan('failing_operation', async () => {
          currentTime += 30;
          throw new Error('boom');
        })
      ).rejects.toThrow('boom');

      const result = collector.build();
      const timing = result.timings.find((t: any) => t.operation === 'failing_operation');

      expect(timing.duration_ms).toBeGreaterThanOrEqual(30);
    });
  });

  describe('mainDurationMs', () => {
    it('should return the main operation duration without building timings', () => {
      const collector = new TelemetryCollector('main_operation');
      currentTime += 150;

      expect(collector.mainDurationMs()).toBeGreaterThanOrEqual(150);
    });

    it('should be consistent with the summary total_duration_ms from build()', async () => {
      const collector = new TelemetryCollector('main_operation');
      await collector.runSpan('operation_1', async () => {});
      currentTime += 50;

      const beforeBuild = collector.mainDurationMs();
      const result = collector.build();

      expect(result.summary.total_duration_ms).toBeGreaterThanOrEqual(beforeBuild);
    });
  });

  describe('build', () => {
    it('should include all metadata in the result', () => {
      const collector = new TelemetryCollector('main_operation');
      collector.add({ key1: 'value1', key2: 'value2' });

      const result = collector.build();

      expect(result.key1).toBe('value1');
      expect(result.key2).toBe('value2');
    });

    it('should list top-level spans in chronological start order', async () => {
      const collector = new TelemetryCollector('main_operation');

      await collector.runSpan('operation_3', async () => {});
      await collector.runSpan('operation_1', async () => {});
      await collector.runSpan('operation_2', async () => {});

      const result = collector.build();

      expect(result.timings[0].operation).toBe('operation_3');
      expect(result.timings[1].operation).toBe('operation_1');
      expect(result.timings[2].operation).toBe('operation_2');
    });

    it('should not include main operation in timings array', async () => {
      const collector = new TelemetryCollector('main_operation');
      await collector.runSpan('operation_1', async () => {});
      await collector.runSpan('operation_2', async () => {});

      const result = collector.build();

      expect(result.timings).toHaveLength(2);
      expect(result.timings.every((t: any) => t.operation !== 'main_operation')).toBe(true);
    });

    it('should include summary with main operation details', () => {
      const collector = new TelemetryCollector('test_operation');
      currentTime += 500;

      const result = collector.build();

      expect(result.summary.main_operation).toBe('test_operation');
      expect(result.summary.total_duration_ms).toBeGreaterThanOrEqual(500);
    });
  });
});
