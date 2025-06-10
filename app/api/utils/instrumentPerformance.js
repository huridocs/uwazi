const performanceData = new Map();
const activeCallStack = [];
const callHierarchy = new Map();

// Helper functions for performance tracking
const updateCallHierarchy = methodName => {
  const parent = activeCallStack.length > 1 ? activeCallStack[activeCallStack.length - 2] : null;
  if (parent) {
    if (!callHierarchy.has(parent)) {
      callHierarchy.set(parent, new Set());
    }
    callHierarchy.get(parent).add(methodName);
  }
};

let recordPerformanceStats = (methodName, duration) => {
  const stats = performanceData.get(methodName);
  stats.calls += 1;
  stats.totalTime += duration;
  stats.minTime = Math.min(stats.minTime, duration);
  stats.maxTime = Math.max(stats.maxTime, duration);
};

/**
 * Format duration in a human readable way
 */
function formatDuration(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Wraps all methods of an object with performance instrumentation
 */
export function instrumentObject(obj, prefix = '') {
  const prototype = Object.getPrototypeOf(obj);
  const props = new Set([
    ...Object.getOwnPropertyNames(obj),
    ...Object.getOwnPropertyNames(prototype),
  ]);

  props.forEach(prop => {
    const descriptor =
      Object.getOwnPropertyDescriptor(obj, prop) ||
      Object.getOwnPropertyDescriptor(prototype, prop);

    if (!descriptor || typeof descriptor.value !== 'function' || prop === 'constructor') {
      return;
    }

    const originalMethod = descriptor.value;
    const methodName = prefix ? `${prefix}.${prop}` : prop;

    if (!performanceData.has(methodName)) {
      performanceData.set(methodName, {
        calls: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
      });
    }

    Object.defineProperty(obj, prop, {
      ...descriptor,
      value: async function wrapped(...args) {
        const start = performance.now();
        activeCallStack.push(methodName);
        updateCallHierarchy(methodName);

        try {
          return await originalMethod.apply(this, args);
        } finally {
          recordPerformanceStats(methodName, performance.now() - start);
          activeCallStack.pop();
        }
      },
    });
  });

  return obj;
}

/**
 * Print performance stats for all instrumented methods that were actually called
 */
export function printPerformanceStats() {
  // Convert to array and filter out unused methods
  const stats = Array.from(performanceData.entries()).filter(
    ([, data]) => data.calls > 0 && data.totalTime > 0
  );

  // Helper function to get the nesting level of a method
  const getNestingLevel = method => {
    const findLevel = m => {
      const parent = Array.from(callHierarchy.entries()).find(([, children]) => children.has(m));
      return parent ? 1 + findLevel(parent[0]) : 0;
    };
    return findLevel(method);
  };

  // Keep track of method call order
  const callOrder = new Map();
  let orderIndex = 0;
  
  const recordCallOrder = methodName => {
    if (!callOrder.has(methodName)) {
      callOrder.set(methodName, orderIndex++);
    }
  };

  // Update recordPerformanceStats to also record call order
  const originalRecordPerformanceStats = recordPerformanceStats;
  recordPerformanceStats = (methodName, duration) => {
    recordCallOrder(methodName);
    originalRecordPerformanceStats(methodName, duration);
  };

  // Sort by call stack level first, then by original call order
  stats.sort((a, b) => {
    const levelA = getNestingLevel(a[0]);
    const levelB = getNestingLevel(b[0]);
    if (levelA !== levelB) return levelA - levelB;
    return (callOrder.get(a[0]) || 0) - (callOrder.get(b[0]) || 0);
  });

  if (stats.length === 0) {
    // eslint-disable-next-line no-console
    console.log('\nNo performance data collected.');
    return;
  }

  // Calculate padding for alignment
  const maxMethodLength = Math.max(...stats.map(([method]) => method.length));

  // Build the output string with indentation
  const output = [
    '\nPerformance Statistics:',
    '======================\n',
    ...stats.map(([method, data]) => {
      const avgTime = data.totalTime / data.calls;
      const nestingLevel = getNestingLevel(method);
      const indent = '  '.repeat(nestingLevel);
      return (
        `${indent}${method.padEnd(maxMethodLength - nestingLevel * 2)} | ` +
        `${data.calls.toString()} x ${formatDuration(avgTime).padEnd(10)} avg | ` +
        `Min: ${formatDuration(data.minTime).padStart(10)} | ` +
        `Max: ${formatDuration(data.maxTime).padStart(10)} | ` +
        `Total: ${formatDuration(data.totalTime).padStart(10)}`
      );
    }),
    '', // Empty line at the end
  ];

  // eslint-disable-next-line no-console
  console.log(output.join('\n'));
}
