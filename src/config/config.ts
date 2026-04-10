import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(`./.env.${process.env.NODE_ENV}`) })

export const PORT = process.env.PORT

export const DB_URI = process.env.DB_URI as string

export const APPLICATION_NAME = process.env.APPLICATION_NAME as string
export const APP_EMAIL = process.env.APP_EMAIL as string
export const APP_EMAIL_PASSWORD = process.env.APP_EMAIL_PASSWORD as string

export const SALT_ROUND = Number(process.env.SALT_ROUND) || 10

export const ENC_KEY = process.env.ENC_KEY as string
export const ENC_IV_LENGTH = Number(process.env.ENC_IV_LENGTH) || 16

export const LINKED_IN = process.env.LINKED_IN as string
export const INSTAGRAM = process.env.INSTAGRAM as string
export const GITHUB = process.env.GITHUB as string



