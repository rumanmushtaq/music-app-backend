// Dashboard buckets are UTC; pin the process timezone so plain `timestamp` columns
// (users."createdAt") are written and read in UTC too, matching production containers.
process.env.TZ = 'UTC';
