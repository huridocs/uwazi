# Graceful Shutdown

## Sequence

```
SIGINT / SIGTERM
  │
  ├─ 1. Set shutting-down flag
  │     503 middleware rejects new requests on existing connections
  │     and destroys the socket after sending the response.
  │
  ├─ 2. closeIdleConnections()
  │     Immediately drops idle keep-alive connections.
  │
  ├─ 3. http.close()
  │     Stops accepting new TCP connections.
  │     Callback fires when all existing connections are drained.
  │
  ├─ 4. Cleanup (in http.close callback)
  │     closeSockets → Redis.disconnect → DB.disconnect →
  │     PostgresDB.disconnect → elasticClient.close
  │
  └─ 5. process.exit(0)

Safety net: force exit(1) after 10s if shutdown stalls.
```

## Design decisions

### Why 503 + socket.destroy instead of just http.close?

`http.close()` stops new TCP connections but does nothing about HTTP requests
on already-established keep-alive connections. A client can keep sending requests
forever on an open connection. The 503 middleware stops that: one 503 response,
then the socket is destroyed server-side.

### Why no in-flight request tracking?

We considered tracking in-flight requests per socket to destroy them the moment
they become idle during shutdown. Removed because:

- The only gap it closes is a connection that was mid-request when
  `closeIdleConnections()` ran, then goes idle, and the client never sends
  another request. Penalty without tracking: it lingers until the 10s timeout.
- A request taking >10s in a web server is either a background job masquerading
  as an HTTP request, or hung. Neither should block shutdown.
- Tracking added a Map entry and a `res.on('close')` handler to every request
  the server processes, forever, to optimize a 10-second edge case.

### Why is closeSockets part of cleanup?

Originally `closeSockets()` was called outside the `http.close()` callback,
which could trigger the callback prematurely (socket.io connections are upgraded
HTTP connections). Moving it into cleanup ensures it runs after all connections
are drained, alongside other disconnections.
