/**
 * Lazily loads UsersDirectoryFactory to break a circular dependency:
 * UsersDirectoryFactory statically imports getConnectionForCurrentTenant, which chains
 * through odm → entities → ... → DispatcherAdapter → job handlers → UwaziJobHandler →
 * getUserById → UsersDirectoryFactory. Deferring the load to call time breaks the cycle.
 */
export async function getUserById(userId: string) {
  // getActor: job actors need their groups (they drive permission checks inside the job)
  // and must resolve even once soft-deleted.
  const { UsersDirectoryFactory } =
    await import('#api/core/infrastructure/factories/UsersDirectoryFactory.js');
  return (await UsersDirectoryFactory.default().getActor(userId)).getData() ?? null;
}
