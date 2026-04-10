"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailEvent = void 0;
const node_events_1 = __importDefault(require("node:events"));
exports.emailEvent = new node_events_1.default({});
exports.emailEvent.on("sendEmail", async (emailFn) => {
    try {
        await emailFn();
    }
    catch (error) {
        console.log(`Fail to Sent User Email ${error}`);
    }
});
