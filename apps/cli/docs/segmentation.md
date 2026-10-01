# segmentation

Segmentation sends a tenant's PDF documents to the segmentation service, which finds their
paragraphs and layout; information extraction and paragraph features build on the result. Shared
options, output and exit codes are in the [README](../README.md).

| Command                   | Tenancy    | Does                                           |
| ------------------------- | ---------- | ---------------------------------------------- |
| `segmentation queue-idle` | `--tenant` | Requests every idle segmentation of the tenant |

## How segmentations move

Every PDF document gets one segmentation when it is uploaded, starting **idle**. It moves:

| Status       | Meaning                                                  |
| ------------ | -------------------------------------------------------- |
| `idle`       | Registered, not requested yet                            |
| `queued`     | A request job is queued for the worker                   |
| `processing` | Sent to the segmentation service, waiting for the result |
| `ready`      | Result stored                                            |
| `failed`     | The service could not segment it                         |

When the tenant has segmentation on (`features.segmentation` in its
[settings](settings.md)), a new document's segmentation is requested straight away. When it is
off, segmentations stay idle until it is switched on. The upgrade migrations also leave the
documents that existed before as idle segmentations.

## segmentation queue-idle

```sh
yarn uwazi segmentation queue-idle --tenant acme
```

No request. Requests every idle segmentation of the tenant:

1. If the tenant does not have segmentation on, does nothing and says so.
2. Otherwise takes the idle segmentations in batches of 200. Each batch is one transaction: its
   segmentations are marked queued and their request jobs dispatched together.
3. A batch that fails stops the command and leaves the rest idle; running it again picks up from
   what is still idle.

Only idle segmentations move, so running it twice, or while the queue worker is already sending
some, requests each one once. Segmentations in any other status are left alone; to retry a
failed one is not this command's job.

The command only queues. The queue worker sends the requests to the segmentation service,
holding back while the service's backlog is full or the service is down, so the work finishes
after the command returns.

When to run it: after an upgrade that registered idle segmentations, or to retry what is still
idle after a failed run. Switching segmentation on through the settings already does the same,
in a job.

Output:

```json
{ "segmentationEnabled": true, "requested": 1342 }
```

`requested` is the number of segmentations queued by this run; `0` with `segmentationEnabled:
false` means the tenant has segmentation off.
