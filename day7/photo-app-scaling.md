
# SnapShare: Photo-App Scaling Plan

## 1. Assumptions

SnapShare is a photo-sharing application where users upload photos and view a feed containing photos from people they follow.

The following assumptions are used:

- Registered users: 10,000,000.
- Daily active users (DAU): 10% of registered users.
- Each daily active user uploads 1 photo per day.
- Each daily active user views 50 feed pages per day.
- Each original photo is 2 MB.
- Each photo has one thumbnail of 50 KB.
- A day has 86,400 seconds, and a year has 365 days.
- Uploads and feed views are spread across the day when calculating average request rates.
- Peak feed traffic is five times the average feed-view rate.
- For storage estimates, 1 MB = 1,000 KB and 1 GB = 1,000 MB.
- The estimates cover one year of newly uploaded originals and thumbnails, before replication, backups, and any additional copies.
- Each feed page view is treated as one feed request. Actual page sizes, pagination, and client-side caching may change the request rate.
- The initial calculations assume all daily active users upload one photo each day; the architecture should allow for growth and uneven traffic.

## 2. Traffic and Storage Calculations

### Daily Active Users

Daily active users are 10% of the 10 million registered users.

DAU = 10,000,000 × 0.10

DAU = 1,000,000 users per day.

### Photo Uploads per Second

Each daily active user uploads one photo per day.

Daily uploads = 1,000,000 × 1

Daily uploads = 1,000,000 photos.

Average uploads per second = 1,000,000 ÷ 86,400

Average uploads per second ≈ 11.57 photos/second.

Therefore, SnapShare should support approximately 12 uploads per second on average, with extra capacity for bursts and peak traffic.

### Feed Views per Second

Each daily active user views 50 feed pages per day.

Daily feed views = 1,000,000 × 50

Daily feed views = 50,000,000 feed views.

Average feed views per second = 50,000,000 ÷ 86,400

Average feed views per second ≈ 578.70 requests/second.

Peak feed views per second = 578.70 × 5

Peak feed views per second ≈ 2,893.52 requests/second.

The system should therefore plan for approximately 579 feed requests per second on average and 2,894 requests per second at peak, with additional headroom for unexpected spikes.

### Photo Storage per Year

Each upload produces:
- Original photo: 2 MB.
- Thumbnail: 50 KB = 0.05 MB.

Total storage per uploaded photo = 2 + 0.05 = 2.05 MB.

Daily original-photo storage = 1,000,000 × 2 MB
= 2,000,000 MB = 2,000 GB = 2 TB per day.

Daily thumbnail storage = 1,000,000 × 0.05 MB
= 50,000 MB = 50 GB per day.

Total daily photo storage = 2 TB + 0.05 TB = 2.05 TB per day.

Annual original-photo storage = 2,000,000 MB × 365
= 730,000,000 MB = 730 TB per year.

Annual thumbnail storage = 50,000 GB × 365
= 18,250 GB = 18.25 TB per year.

Total annual photo storage = 730 TB + 18.25 TB
= 748.25 TB per year.

SnapShare therefore needs approximately 748.25 TB of additional logical storage per year for originals and thumbnails, before replication, backups, and other overhead.

## 3. Is SnapShare Read-Heavy or Write-Heavy?

SnapShare is read-heavy because users generate approximately 50 million feed views per day but only 1 million photo uploads per day. This is about 50 feed views for every upload.

The architecture should prioritize fast feed delivery by using a CDN for photo files, a cache for frequently requested feed data, and a database read replica for read queries. Uploads must still be reliable, and thumbnail generation should happen asynchronously so that image processing does not slow down the upload request.

## 4. Why Photos Should Not Be Stored Inside the Database

Photo files should be stored in object storage rather than directly inside the relational database. Photos are large binary files, and storing them in the database would increase database size, backup time, replication traffic, and query overhead. Object storage is designed to store large files cost-effectively and scale independently from the database. The database should store metadata such as the photo ID, owner ID, caption, upload time, and object-storage key or URL. A CDN can then deliver the image files efficiently to users around the world.

## 5. Architecture Diagram

```text
                         +------------------+
                         |      Users       |
                         | Uploads & Feeds  |
                         +--------+---------+
                                  |
                                  v
                         +------------------+
                         |       CDN        |
                         | Cached Photo     |
                         | Files/Thumbnails |
                         +--------+---------+
                                  |
                                  | Cache miss or API request
                                  v
                         +------------------+
                         | Load Balancer    |
                         +--------+---------+
                                  |
                    +-------------+-------------+
                    |             |             |
                    v             v             v
              +-----------+ +-----------+ +-----------+
              | App       | | App       | | App       |
              | Server 1  | | Server 2  | | Server N  |
              +-----+-----+ +-----+-----+ +-----+-----+
                    |             |             |
                    +-------------+-------------+
                                  |
                       +----------+----------+
                       |                     |
                       v                     v
                +-------------+       +-------------+
                | Feed Cache  |       | Primary DB  |
                | Redis       |       | Metadata    |
                +------+------+       +------+------+
                       |                     |
                       |              Replication
                       |                     v
                       |              +-------------+
                       +------------->| Read Replica|
                                      | Feed Reads  |
                                      +-------------+

                       Photo Upload / Thumbnail Flow

              +-------------+        +----------------+
              | App Server  |------->| Object Storage |
              +------+------+        | Original Photo |
                     |               | + Thumbnails   |
                     |               +--------+-------+
                     |                        ^
                     v                        |
              +-------------+         +--------+-------+
              | Job Queue   |-------->| Thumbnail      |
              | Pending Jobs|         | Worker         |
              +-------------+         +----------------+
```

The diagram is a logical view; in production, the CDN, API traffic, image delivery, and upload paths would be configured separately. The CDN serves cached images, while requests that require application logic go through the load balancer.

## 6. Components and the Problems They Solve

- **CDN:** Caches and delivers photos and thumbnails close to users, reducing latency, bandwidth costs, and load on object storage.
- **Load balancer:** Distributes incoming API requests across healthy application servers to prevent one server from becoming a bottleneck.
- **Application servers:** Handle authentication, upload authorization, following relationships, feed generation, metadata updates, and other business logic.
- **Feed cache (Redis):** Stores frequently requested feed data and metadata to reduce repeated database queries and improve response times.
- **Primary database:** Stores durable, structured data such as users, follows, photo metadata, and feed-related records, and handles writes.
- **Read replica:** Serves eligible read queries to reduce load on the primary database, although replication lag may mean it does not immediately contain the latest updates.
- **Object storage:** Stores original photos and generated thumbnails separately from the database, allowing photo storage to grow independently.
- **Job queue:** Holds thumbnail-generation jobs until a worker can process them, absorbing bursts and allowing retries when processing fails.
- **Thumbnail worker:** Processes queued jobs to resize or compress originals into smaller thumbnails without making users wait for image processing to finish.

## 7. Photo Upload Flow

1. The user selects a photo and submits it through the SnapShare application.
2. The application server authenticates the user, checks upload permissions, and validates the file type and size.
3. The application creates an upload record or obtains a unique object-storage key for the photo.
4. The original photo is uploaded to object storage. For large files or high upload volume, the application may authorize a direct upload from the client using a short-lived signed URL.
5. Once the upload succeeds, the application records or updates the photo metadata in the primary database, including the owner, object key, upload time, and processing status.
6. The application places a thumbnail-generation job on the queue with the photo ID and object-storage key.
7. The application confirms that the upload succeeded without waiting for the thumbnail to be generated.
8. A thumbnail worker retrieves the job, reads the original photo from object storage, resizes or compresses it, and writes the thumbnail back to object storage.
9. The worker updates the photo's processing status or thumbnail key in the primary database and acknowledges the job.
10. When a user views a feed, the application retrieves feed metadata from the cache or an appropriate database replica and returns image URLs or keys.
11. The user's browser or app loads the photo files through the CDN, which serves cached images when available and retrieves uncached objects from object storage.
12. If thumbnail processing fails, the job can be retried; repeated failures should be sent to a dead-letter queue for investigation.

## 8. Trade-Offs

### Trade-Off 1: Database Read Replicas

**Benefit:** A read replica allows feed-related database queries to be distributed away from the primary database, improving read capacity.

**Cost:** Replication is often asynchronous, so recently uploaded photos or updated metadata may not immediately appear in replica-based queries. The application may need to read recent changes from the primary database or tolerate brief delays.

### Trade-Off 2: Caching

**Benefit:** Caching popular feeds and photo metadata reduces database traffic and improves response time.

**Cost:** Cached data can become stale when a user uploads a photo, changes a follow relationship, or deletes content. Cache invalidation and expiration policies add complexity.

### Trade-Off 3: Asynchronous Thumbnail Processing

**Benefit:** A queue and background worker let the upload finish without waiting for thumbnail generation, making the user experience faster and allowing processing capacity to scale independently.

**Cost:** Thumbnails are not immediately available, and queues may accumulate during high traffic or worker failures. The application needs retries, monitoring, and a fallback while a thumbnail is pending.

### Trade-Off 4: Object Storage and CDN

**Benefit:** Object storage scales independently from the database, while the CDN reduces repeated downloads from the origin and speeds up image delivery.

**Cost:** This introduces additional services, configuration, storage and delivery charges, cache invalidation concerns, and access-control requirements for private photos.

## 9. Conclusion

SnapShare has 1 million daily active users, approximately 11.57 uploads per second on average, 578.70 feed views per second on average, and 2,893.52 feed views per second at the estimated peak. It needs approximately 748.25 TB of new logical photo storage per year under the stated assumptions. Because feed views greatly outnumber uploads, the design prioritizes reads using a CDN, a feed cache, and a database read replica, while object storage and asynchronous thumbnail processing support reliable, scalable photo uploads.
