# SnapShare - Scaling Plan

## Assumptions

- SnapShare has 10,000,000 registered users.
- 10% of registered users are active daily, giving 1,000,000 daily active users (DAU).
- Each active user uploads 1 photo and views 50 feed pages per day.
- Each original photo is approximately 2 MB.
- Each photo has a thumbnail of approximately 50 KB (0.05 MB).
- One day is approximated as 100,000 seconds for these estimates.
- Peak traffic is assumed to be 5 times the average traffic.
- Storage estimates exclude database metadata, backups, replication overhead, and any additional storage savings from compression or deduplication.

## Estimates

### 1. Uploads per second

Daily uploads:

1,000,000 active users × 1 upload = 1,000,000 uploads/day

Average upload rate:

1,000,000 ÷ 100,000 ≈ **10 uploads per second**

Peak upload rate:

10 × 5 = **50 uploads per second**

### 2. Feed views per second

Daily feed views:

1,000,000 active users × 50 views = 50,000,000 feed views/day

Average feed view rate:

50,000,000 ÷ 100,000 ≈ **500 feed views per second**

Peak feed view rate:

500 × 5 = **2,500 feed views per second**

### 3. Storage per year

Storage per photo:

2 MB + 0.05 MB = 2.05 MB

Daily storage:

1,000,000 photos × 2.05 MB = 2,050,000 MB ≈ **2.05 TB per day**

Annual storage:

2.05 TB × 365 ≈ **748 TB per year**, or approximately **750 TB per year**.

This is the estimated storage for originals and thumbnails before accounting for metadata, backups, replicas, and other overhead.

## Is SnapShare Read-Heavy or Write-Heavy?

SnapShare is a **read-heavy system** because users view far more feed pages than they upload photos.

For every 1 photo uploaded, users view approximately 50 feed pages. This means the architecture must handle frequent feed requests efficiently while ensuring that photo uploads remain reliable.

To support this workload, SnapShare uses a CDN for photo delivery, Redis for feed caching, and database read replicas for read-intensive queries.

## Where Do the Photos Go?

Photo files should be stored in **object storage**, such as Amazon S3, rather than directly in the relational database.

Storing approximately 750 TB of new image data each year in the database would increase database size, backup time, and operating costs.

Object storage is designed to store large files durably and cost-effectively. The database stores structured metadata, such as the photo ID, owner ID, caption, upload time, and URLs for the original photo and thumbnail.

## Architecture

```text
                 Mobile App / Browser
                         |
             +-----------+-----------+
             |                       |
       API requests             Photo delivery
        (HTTPS/JSON)                  |
             |                       v
             v                      CDN
       Load Balancer                  |
             |                        v
       +-----+------+            Object Storage
       |     |      |          (originals and
       v     v      v            thumbnails)
     App 1  App 2  App 3                ^
       |     |      |                  |
       +-----+------+                  |
             |                         |
       +-----+----------+--------------+
       |                |
       v                v
   Redis Cache       Queue
   (prepared feeds)    |
                       v
                Thumbnail Worker
                       |
                       v
                 Object Storage

             App Servers
                  |
                  v
           Primary Database
           (users, follows,
          photo metadata)
                  |
             Replication
                  |
                  v
             Read Replica
          (feed and read queries)
```

## Components

- **CDN:** Delivers photos and thumbnails from locations close to users, reducing image-loading times and the load on application servers.
- **Object storage:** Stores original photos and thumbnails durably and economically without filling the relational database with large binary files.
- **Load balancer:** Distributes incoming API requests across healthy application servers and stops sending traffic to failed servers.
- **Application servers:** Process API requests, authenticate users, validate uploads, and coordinate database and storage operations while remaining stateless so more servers can be added easily.
- **Redis cache:** Keeps frequently requested or prepared feeds in memory, reducing repeated database queries and improving scrolling speed.
- **Primary database:** Stores authoritative structured data, including users, follow relationships, photo metadata, and references to stored files.
- **Read replica:** Handles read-intensive database queries so feed traffic does not overwhelm the primary database.
- **Queue:** Holds background jobs reliably so thumbnail generation can happen outside the user's upload request.
- **Thumbnail worker:** Processes queued jobs, creates smaller thumbnail images, stores them in object storage, and updates the corresponding photo metadata.

## Photo Upload Flow

1. The user selects a photo and submits it through the mobile app or browser.
2. The application server authenticates the user and validates the file type, file size, and upload permissions.
3. The original photo is uploaded to object storage, using a unique file key.
4. The application server saves the photo metadata and original file URL in the primary database.
5. The server places a thumbnail-generation job on the queue.
6. After the original photo and its metadata have been saved successfully, the server responds with **201 Created** and the photo's metadata.
7. A background worker retrieves the job, generates the 50 KB thumbnail, uploads it to object storage, and updates the photo record with the thumbnail URL.
8. The system invalidates or updates affected cached feeds so followers can discover the new photo.
9. When followers scroll their feeds, the application retrieves feed data from the cache or a read replica, while the CDN delivers the image files.

If saving the original photo or its metadata fails, the application must handle the failure and avoid returning a misleading success response. Background jobs should also support retries to recover from temporary failures.

## Trade-offs

### 1. Feed Speed vs. Freshness

Caching feeds makes them faster and reduces database load, but a new photo may take a few seconds to appear for followers. This delay is acceptable for many social applications, provided the cache is refreshed or invalidated appropriately.

### 2. Fast Uploads vs. Immediate Thumbnail Availability

Generating thumbnails in the background shortens the upload request and helps the application handle traffic spikes. However, a thumbnail may not be ready immediately, so the interface should display a placeholder until processing finishes.

### 3. Cost vs. Performance

CDNs, object storage, Redis, and database replicas introduce additional costs. However, they help SnapShare serve large volumes of photos and feed requests more efficiently than relying only on application servers and a single database.

### 4. High Availability vs. Operational Complexity

Multiple application servers, database replication, durable queues, and retry mechanisms reduce the impact of individual failures. However, these components add monitoring and maintenance requirements, and replicas may briefly lag behind the primary database.

## Conclusion

SnapShare must support approximately 10 uploads per second on average, 500 feed views per second on average, and around 750 TB of additional image storage per year. Its read-heavy workload makes caching and CDN delivery especially important, while object storage keeps large image files separate from structured database records. A queue and background worker allow thumbnail generation to happen asynchronously, keeping uploads responsive as the platform grows.

