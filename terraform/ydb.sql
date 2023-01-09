CREATE TABLE `connections` (
  `stubId` Utf8,
  `connectionId` Utf8,
  `wsUrl` Utf8,
  `createdAt` Timestamp,
  PRIMARY KEY (`stubId`)
);
