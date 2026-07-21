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

  describe('startTimer', () => {
    it('should start a timer and return an end function', () => {
      const collector = new TelemetryCollector('main_operation');
      const endTimer = collector.startTimer('operation_1');

      currentTime += 100;
      endTimer();

      const result = collector.build();
      const timing = result.timings.find((t: any) => t.operation === 'operation_1');

      expect(timing).toBeDefined();
      expect(timing.duration_ms).toBeGreaterThanOrEqual(100);
    });

    it('should support multiple timers for the same operation', () => {
      const collector = new TelemetryCollector('main_operation');

      const endTimer1 = collector.startTimer('repeated_operation');
      currentTime += 50;
      endTimer1();

      const endTimer2 = collector.startTimer('repeated_operation');
      currentTime += 75;
      endTimer2();

      const endTimer3 = collector.startTimer('repeated_operation');
      currentTime += 100;
      endTimer3();

      const result = collector.build();
      const timings = result.timings.filter((t: any) =>
        t.operation.startsWith('repeated_operation')
      );

      expect(timings).toHaveLength(3);
      expect(timings[0].operation).toBe('repeated_operation[0]');
      expect(timings[1].operation).toBe('repeated_operation[1]');
      expect(timings[2].operation).toBe('repeated_operation[2]');
    });

    it('should not add suffix when operation is called only once', () => {
      const collector = new TelemetryCollector('main_operation');
      const endTimer = collector.startTimer('single_operation');
      endTimer();

      const result = collector.build();
      const timing = result.timings.find((t: any) => t.operation === 'single_operation');

      expect(timing).toBeDefined();
      expect(timing.operation).toBe('single_operation');
    });

    it('should calculate duration even if timer is not ended', () => {
      const collector = new TelemetryCollector('main_operation');
      collector.startTimer('unfinished_operation');

      currentTime += 200;

      const result = collector.build();
      const timing = result.timings.find((t: any) => t.operation === 'unfinished_operation');

      expect(timing.duration_ms).toBeGreaterThanOrEqual(200);
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

    it('should sort timings by start_offset_ms', () => {
      const collector = new TelemetryCollector('main_operation');

      currentTime += 10;
      const end1 = collector.startTimer('operation_3');
      currentTime += 5;
      const end2 = collector.startTimer('operation_1');
      currentTime += 5;
      const end3 = collector.startTimer('operation_2');

      end1();
      end2();
      end3();

      const result = collector.build();

      expect(result.timings[0].operation).toBe('operation_3');
      expect(result.timings[1].operation).toBe('operation_1');
      expect(result.timings[2].operation).toBe('operation_2');
    });

    it('should assign order based on chronological start time', () => {
      const collector = new TelemetryCollector('main_operation');

      collector.startTimer('first')();
      collector.startTimer('second')();
      collector.startTimer('third')();

      const result = collector.build();

      expect(result.timings[0].order).toBe(0);
      expect(result.timings[1].order).toBe(1);
      expect(result.timings[2].order).toBe(2);
    });

    it('should not include main operation in timings array', () => {
      const collector = new TelemetryCollector('main_operation');
      collector.startTimer('operation_1')();
      collector.startTimer('operation_2')();

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
