"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const console_log_level_1 = __importDefault(require("console-log-level"));
exports.logger = (0, console_log_level_1.default)({
    level: process.env.LOG_LEVEL || 'info'
});
//# sourceMappingURL=logger.js.map