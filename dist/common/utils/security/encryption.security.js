"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDecryption = exports.generateEncryption = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const config_1 = require("../../../config/config");
const exceptions_1 = require("../../exceptions");
const generateEncryption = async ({ plainText }) => {
    const iv = node_crypto_1.default.randomBytes(config_1.ENC_IV_LENGTH);
    const cipherIvVector = node_crypto_1.default.createCipheriv('aes-256-cbc', config_1.ENC_KEY, iv);
    let cipherText = cipherIvVector.update(plainText, 'utf-8', 'hex');
    cipherText += cipherIvVector.final('hex');
    return `${iv.toString('hex')}:${cipherText}`;
};
exports.generateEncryption = generateEncryption;
const generateDecryption = async ({ cipherText }) => {
    const [iv, encryption] = cipherText.split(":") || [];
    if (!iv || !encryption) {
        throw new exceptions_1.BadRequestException('invalid encryption parts');
    }
    const ivLikeBinary = Buffer.from(iv, "hex");
    const deCipherIvVector = node_crypto_1.default.createDecipheriv("aes-256-cbc", config_1.ENC_KEY, ivLikeBinary);
    let plainText = deCipherIvVector.update(encryption, 'hex', 'utf-8');
    plainText += deCipherIvVector.final('utf-8');
    return plainText;
};
exports.generateDecryption = generateDecryption;
