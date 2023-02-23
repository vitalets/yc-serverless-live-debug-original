CREATE TABLE `connections` (
  `stubId` Utf8,
  `connectionId` Utf8,
  `wsUrl` Utf8,
  `createdAt` Timestamp,
  PRIMARY KEY (`stubId`),
  INDEX createdAtIndex GLOBAL ON (createdAt)
) WITH (
  TTL = Interval("PT1D") ON createdAt
);
