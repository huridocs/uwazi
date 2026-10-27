// pg 8.23 sends queries without waiting for earlier answers when `pipeline` is set; @types/pg
// (8.21) predates the option. Augments the config so PostgresDB.pipelinedPool can set it.
import 'pg';

declare module 'pg' {
  interface ClientConfig {
    pipeline?: boolean;
  }
}
