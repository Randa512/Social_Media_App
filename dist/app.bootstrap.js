"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = void 0;
const express_1 = __importDefault(require("express"));
const modules_1 = require("./modules");
const middleware_1 = require("./middleware");
const config_1 = require("./config/config");
const connection_db_1 = __importDefault(require("./DB/connection.db"));
const bootstrap = async () => {
    const app = (0, express_1.default)();
    await (0, connection_db_1.default)();
    app.use(express_1.default.json());
    app.get("/", (req, res, next) => {
        res.json("Landing Page 😎");
    });
    app.use('/auth', modules_1.authRouter);
    app.get('/*dummy', (req, res, next) => {
        return res.status(404).json({ message: "Invalid Application Routing" });
    });
    app.use(middleware_1.globalErrorHandler);
    app.listen(config_1.PORT, () => {
        console.log(`Server is running on port ${config_1.PORT} 🚀🚀`);
    });
};
exports.bootstrap = bootstrap;
