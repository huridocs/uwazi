# RFC: Caching Strategy for Uwazi

## Status

**Proposed** - December 4, 2025

## Summary

Introduce Redis-based caching to improve Uwazi's performance by implementing caching at the persistence layer for internal backend database calls (use cases to data sources). This will target frequently accessed, rarely-changed data. If successful, extend caching to API response layer for critical endpoints.

## Motivation

Certain internal backend database operations in Uwazi are performed repeatedly but access data that rarely changes:

- **Settings collection**: Languages, system configuration
- **Templates**: Template definitions used for entity rendering and validation
- **Thesauri**: Dictionary/taxonomy data referenced across the application

When use cases call data sources, these read-heavy operations create unnecessary database load and latency. By introducing caching at the data source level (between use cases and MongoDB), we can significantly improve internal backend performance without modifying application logic. Once proven successful at this layer, we can extend the approach to cache API responses for external clients.

## Goals

1. **Reduce database load** for frequently accessed, rarely-changed data
2. **Improve response times** for critical read operations
3. **Maintain architectural integrity** - keep caching transparent to the application layer
4. **Ensure tenant isolation** - cache must be tenant-aware in our multi-tenant architecture
5. **Establish foundation** for future API-level caching

## Non-Goals

- API response caching at HTTP layer (Phase 2 - future work)
- Caching of frequently-changing data (entities, user sessions)
- Distributed cache coordination across multiple Redis instances (start simple)
- Client-side caching strategies (browser cache, CDN)

## Proposal

### Phase 1: Internal Backend Database Caching

**Focus**: Cache internal backend calls from use cases to data sources (MongoDB)

#### Scope

Target collections with high read frequency and low write frequency:

- **Settings**: Language configurations, system settings
- **Templates**: Template definitions
- **Thesauri**: Dictionary/taxonomy data

**Key Point**: This caching happens server-side, between the application layer (use cases) and the database layer (data sources). API clients are unaware of this caching and will benefit from faster backend operations.

#### Architecture

**1. Cache Service Contract**

```typescript
// app/api/core/contracts/CacheService.ts
export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}
```

**2. Redis Implementation**

```typescript
// app/api/core/infrastructure/services/RedisCacheService.ts
export class RedisCacheService implements CacheService {
  constructor(private redis: Redis) {}

  private getTenantKey(key: string): string {
    const currentTenant = tenants.current();
    if (!currentTenant) {
      throw new Error('No tenant context available');
    }
    return `tenant:${currentTenant.name}:${key}`;
  }

  // Implementation details...
}
```

**3. Data Source Layer Integration**

Cache will be implemented at the data source layer using the **decorator pattern**:
PS: This solution is not yet defined, I'm looking for way to create decorator for methods only, so we don't need to fully implements the data source every time.

```typescript
// Example: CachedTemplatesDataSource
export class CachedTemplatesDataSource implements TemplatesDataSource {
  constructor(
    private inner: TemplatesDataSource,
    private cache: CacheService
  ) {}

  async getById(id: string): Promise<Template> {
    const key = `template:${id}`;
    const cached = await this.cache.get<Template>(key);
    if (cached) return cached;

    const template = await this.inner.getById(id);
    await this.cache.set(key, template, { ttl: 3600 }); // 1 hour
    return template;
  }

  async save(template: Template): Promise<void> {
    await this.inner.save(template);
    // Invalidate cache on write
    await this.cache.delete(`template:${template._id}`);
    await this.cache.deletePattern('templates:*');
  }
}
```

**Key Architectural Decisions:**

- ✅ **Use cases remain unchanged** - caching is transparent to application layer
- ✅ **Decorator pattern** - wrap existing data sources without modifying them
- ✅ **Cache invalidation** - handled in data source write operations
- ✅ **Tenant isolation** - automatic via `getTenantKey()` method

#### Tenant Awareness

All cache keys are automatically prefixed with tenant identifier:

```
tenant:${tenantName}:template:${id}
tenant:${tenantName}:settings:languages
tenant:${tenantName}:thesaurus:${id}
```

This ensures:

- Complete data isolation between tenants
- Ability to clear cache per tenant
- Single Redis instance serves all tenants efficiently

#### Cache Invalidation Strategy

**1. Write-through invalidation:**

```typescript
// On update/delete operations
async save(template: Template): Promise<void> {
  await this.inner.save(template);
  await this.cache.delete(`template:${template._id}`);
}
```

**2. Pattern-based invalidation:**

```typescript
// When affecting multiple cached entries
async deleteTemplate(id: string): Promise<void> {
  await this.inner.delete(id);
  await this.cache.deletePattern(`template:${id}:*`);
}
```

**3. Time-based expiration (TTL):**

- Templates: 1 hour (3600s)
- Settings: 30 minutes (1800s)
- Thesauri: 1 hour (3600s)

#### Redis Configuration

**Development:**

```typescript
{
  host: 'localhost',
  port: 6379,
  maxmemory: '256mb',
  maxmemoryPolicy: 'allkeys-lru'
}
```

**Production:**

```typescript
{
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  maxmemory: '2gb',
  maxmemoryPolicy: 'allkeys-lru',
  retryStrategy: (times) => Math.min(times * 1000, 3000)
}
```

### Phase 2: API Response Caching (Future)

**Focus**: Cache HTTP responses at the API layer for external clients

If Phase 1 proves successful in caching internal backend database calls, we can extend the strategy to cache API responses

## Success Metrics

### Performance Improvements

- **Database query reduction**: Target 60-80% reduction for cached collections
- **Response time improvement**: Target 50-70% faster for cache hits
- **Cache hit rate**: Target >80% for settings/templates/thesauri

### Monitoring

Track the following metrics:

- Cache hit/miss ratio per collection
- Average response time (cached vs uncached)
- Redis memory usage
- Cache eviction rate

## Risks and Mitigations

### Risk 1: Cache Inconsistency

**Risk:** Stale data served from cache after updates  
**Mitigation:** Strict invalidation in all write operations; conservative TTLs

### Risk 2: Memory Pressure

**Risk:** Redis runs out of memory  
**Mitigation:**

- Set `maxmemory-policy: allkeys-lru`
- Monitor memory usage
- Set appropriate TTLs
- Start with conservative memory limits

### Risk 3: Redis Unavailability

**Risk:** Redis downtime affects application availability  
**Mitigation:**

- Graceful degradation - fall back to direct database access
- Implement connection retry logic
- Monitor Redis health

### Risk 4: Multi-Tenant Key Collisions

**Risk:** Tenant data leakage through incorrect key naming  
**Mitigation:**

- Mandatory tenant prefix in all cache keys
- Automated tests for tenant isolation
- Code review focus on cache key construction

## Open Questions

1. **Cache warming strategy**: Should we pre-populate cache on application startup?
2. **Cache monitoring dashboard**: What tools should we use to visualize cache performance?
3. **Redis deployment**: Single instance, Redis Sentinel, or Redis Cluster for production?
4. **Backup strategy**: Should cached data be persisted to disk (RDB/AOF)?

## Alternatives Considered

### Alternative 1: Database Query Result Caching

MongoDB query result caching via ORM layer  
**Rejected:** Less control over invalidation; limited visibility into cache behavior

### Alternative 2: In-Memory LRU Cache (Node.js)

Using libraries like `node-cache` or `lru-cache`  
**Rejected:** Not shared across application instances; lost on restart

### Alternative 3: HTTP Caching Only

Focus on API response caching with ETags  
**Rejected:** Doesn't reduce database load; requires client cooperation

## References

- [Redis Best Practices](https://redis.io/docs/management/optimization/)
- [Multi-Tenant Cache Design Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
- Uwazi Architecture: `/home/joao/code/huridocs/uwazi/app/api/core`

## Approval

This RFC requires approval from:

- [ ] Architecture team
- [ ] Backend team lead
- [ ] DevOps/Infrastructure team
- [ ] Product owner

---

## Appendix A: Example Implementation

### CacheService Contract

```typescript
// app/api/core/contracts/CacheService.ts
export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
  clearTenant?(tenantName: string): Promise<void>;
}

export interface CacheOptions {
  ttl?: number;
}
```

### Data Source Decorator

```typescript
// app/api/core/infrastructure/mongodb/CachedTemplatesDataSource.ts
export class CachedTemplatesDataSource implements TemplatesDataSource {
  constructor(
    private inner: TemplatesDataSource,
    private cache: CacheService,
    private defaultTTL: number = 3600
  ) {}

  async getById(id: string): Promise<Template | null> {
    const key = `template:${id}`;
    const cached = await this.cache.get<Template>(key);

    if (cached) {
      logger.debug('Cache hit', { key });
      return cached;
    }

    logger.debug('Cache miss', { key });
    const template = await this.inner.getById(id);

    if (template) {
      await this.cache.set(key, template, { ttl: this.defaultTTL });
    }

    return template;
  }

  async getAll(): Promise<Template[]> {
    const key = 'templates:all';
    const cached = await this.cache.get<Template[]>(key);

    if (cached) {
      logger.debug('Cache hit', { key });
      return cached;
    }

    logger.debug('Cache miss', { key });
    const templates = await this.inner.getAll();
    await this.cache.set(key, templates, { ttl: this.defaultTTL });

    return templates;
  }

  async save(template: Template): Promise<void> {
    await this.inner.save(template);

    // Invalidate cache
    await this.cache.delete(`template:${template._id}`);
    await this.cache.delete('templates:all');

    logger.debug('Cache invalidated', { templateId: template._id });
  }

  async delete(id: string): Promise<void> {
    await this.inner.delete(id);

    // Invalidate cache
    await this.cache.delete(`template:${id}`);
    await this.cache.deletePattern(`template:${id}:*`);
    await this.cache.delete('templates:all');

    logger.debug('Cache invalidated', { templateId: id });
  }
}
```

### Factory Integration

```typescript
// app/api/core/infrastructure/factories/DataSourceFactory.ts
export class DataSourceFactory {
  static createTemplatesDataSource(cache?: CacheService): TemplatesDataSource {
    const baseDS = new MongoTemplatesDataSource(db);

    if (cache && config.cache.enabled) {
      return new CachedTemplatesDataSource(baseDS, cache);
    }

    return baseDS;
  }
}
```

## Appendix B: Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_MAX_MEMORY=2gb

# Cache TTL (seconds)
CACHE_TTL_TEMPLATES=3600
CACHE_TTL_SETTINGS=1800
CACHE_TTL_THESAURI=3600
```

### Docker Compose Addition

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  redis_data:
```

https://chatgpt.com/c/6931e17c-4030-8332-ac80-46db1c820a0e
