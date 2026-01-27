# LogBuilder Usage Guide

## Overview

`LogBuilder` provides automatic timing and logging for observability without verbose try-catch-finally blocks.

## Pattern 1: Decorators - For Controllers (RECOMMENDED)

**Best for:** Controllers that extend AbstractController - cleanest approach!

### Class-level decorator (automatic naming):

```typescript
import { TimedController } from 'api/core/libs/logger/infrastructure/decorators';

// ✅ MOST RECOMMENDED - Automatically times the handle() method
@TimedController
class MyController extends AbstractController {
  protected async handle(): Promise<void> {
    // Your logic here - automatically timed!
    const data = await this.fetchData();
    this.response.json(data);
  }
}
// Metric name: "my" (derived from class name)
```

### Method-level decorator (custom identifier):

```typescript
import { TimedMethod } from 'api/core/libs/logger/infrastructure/decorators';

class MyController extends AbstractController {
  @TimedMethod('fetch_user_templates')
  protected async handle(): Promise<void> {
    // Your logic here
    // Timed as 'fetch_user_templates_ms'
    // Also adds { operation: 'fetch_user_templates' } to log
    const data = await this.fetchData();
    this.response.json(data);
  }
}
```

**Custom timing names:**

```typescript
import { TimeAsync } from 'api/core/libs/logger/infrastructure/decorators';

class MyService {
  @TimeAsync('fetch_all_users')
  async getAllUsers() {
    return await db.users.find().toArray();
  }

  @TimeAsync() // Uses MyService_processData
  async processData() {
    // ...
  }
}
```

**For any method (not just controllers):**

```typescript
import { TimedMethod } from 'api/core/libs/logger/infrastructure/decorators';

class DataProcessor {
  @TimedMethod('process_batch')
  async processBatch(items: any[]) {
    // Method is timed and adds { operation: 'process_batch' } to logs
    return items.map(process);
  }
}
```

## Pattern 2: `timeAsync()` - For Explicit Async Operations

**Best for:** Timing specific operations within methods.

```typescript
// ✅ RECOMMENDED - Automatically handles errors
const logBuilder = appContext.get('logBuilder');

const user = await logBuilder.timeAsync('fetch_user', async () => {
  const result = await db.users.findOne({ id: userId });
  return result;
});

// Even if an error is thrown, the timing is captured
await logBuilder.timeAsync('process_payment', async () => {
  validatePayment(data);
  await chargeCard(data);
  throw new Error('Payment failed'); // timeEnd() still called!
});
```

## Pattern 3: `startTimer()` - For Complex Control Flows

**Best for:** Middlewares or when you need manual control over when to end timing.

```typescript
// ✅ RECOMMENDED - Returns cleanup function
const logBuilder = appContext.get('logBuilder');
const endTimer = logBuilder.startTimer('middleware_processing');

try {
  await doSomeWork();
  next();
} catch (e) {
  next(e);
} finally {
  endTimer(); // Always called, safe to call multiple times
}
```

## Pattern 4: Manual `time()` / `timeEnd()` - Not Recommended

**Avoid unless you have a specific reason:**

```typescript
// ❌ AVOID - If error is thrown, timing is lost
logBuilder.time('operation');
await doWork(); // If this throws, timeEnd never called
logBuilder.timeEnd('operation');
```

## Other Methods

### Add Fields

```typescript
logBuilder.add({
  user_id: req.user.id,
  entity_count: entities.length,
  cache_hit: true,
});
```

### Increment Counters

```typescript
logBuilder.increment('db_queries'); // +1
logBuilder.increment('items_processed', 50); // +50
```

### Log Errors

```typescript
try {
  await operation();
} catch (error) {
  logBuilder.error(error); // Captures message and stack
  throw error;
}
```

## Real-World Examples

### Controller with Decorator (Cleanest)

```typescript
import { TimedController } from 'api/core/libs/logger/infrastructure/decorators';

@TimedController
class GetTemplatesController extends AbstractController {
  protected async handle(): Promise<void> {
    const templates = await this.fetchTemplates();
    this.response.json(templates);
  }
}
// Automatically logged as: get_templates_ms
```

### Controller with Manual Timing (If you need custom operations)

```typescript
class MyController extends AbstractController {
  protected async handle(): Promise<void> {
    const logBuilder = appContext.get('logBuilder');

    await logBuilder.timeAsync('my_controller', async () => {
      const data = await this.fetchData();
      const result = await this.processData(data);
      this.response.json(result);
    });
  }
}
```

### Middleware

```typescript
export default async (req: Request, res: Response, next: NextFunction) => {
  const logBuilder = appContext.get('logBuilder');
  const endTimer = logBuilder.startTimer('auth_check');

  try {
    const user = await validateToken(req.headers.authorization);
    req.user = user;
    logBuilder.add({ user_id: user.id });
    next();
  } catch (e) {
    next(e);
  } finally {
    endTimer();
  }
};
```

### Service with Multiple Operations

```typescript
async function processEntity(entityId: string) {
  const logBuilder = appContext.get('logBuilder');

  const entity = await logBuilder.timeAsync('fetch_entity', () =>
    db.entities.findOne({ _id: entityId })
  );

  const validated = await logBuilder.timeAsync('validate_entity', () => validator.validate(entity));

  await logBuilder.timeAsync('save_entity', () => db.entities.save(validated));

  logBuilder.increment('entities_processed');
}
```

## Output Example

```json
{
  "request_id": 4523,
  "timestamp": "2026-01-26T10:30:45.123Z",
  "method": "POST",
  "path": "/api/templates",
  "user_id": "admin123",
  "fetch_entity_ms": 12,
  "validate_entity_ms": 5,
  "save_entity_ms": 23,
  "entities_processed": 1,
  "request_duration_ms": 78
}
```
