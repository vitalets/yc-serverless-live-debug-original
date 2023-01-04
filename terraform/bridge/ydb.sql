CREATE TABLE `connections`
(
    `connectionId` Utf8,
    `topic` Utf8,
    `createdAt` Timestamp,
    PRIMARY KEY (`topic`, `connectionId`),
);
