CREATE TABLE `connections` (
    `connectionId` Utf8,
    `topic` Utf8,
    `createdAt` Timestamp,
    PRIMARY KEY (`connectionId`),
    INDEX topicIndex GLOBAL ON (topic),
    INDEX createdAtIndex GLOBAL ON (createdAt)
) WITH (
  TTL = Interval("P1D") ON createdAt
);
