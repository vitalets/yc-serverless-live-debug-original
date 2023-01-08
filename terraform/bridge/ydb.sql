CREATE TABLE `connections` (
    `connectionId` Utf8,
    `stubId` Utf8,
    `createdAt` Timestamp,
    PRIMARY KEY (`connectionId`),
    INDEX stubIdIndex GLOBAL ON (stubId),
    INDEX createdAtIndex GLOBAL ON (createdAt)
) WITH (
  TTL = Interval("P1H") ON createdAt
);
