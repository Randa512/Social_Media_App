import { EmailEnum } from './../enums/email.enum';
import { createClient, RedisClientType } from "redis";
import { REDIS_URI } from "../../config/config";
import { Types } from 'mongoose';

type RedisKeyType = { email: string, subject?: EmailEnum }

export class RedisService {
    private readonly client: RedisClientType
    constructor() {
        this.client = createClient({ url: REDIS_URI }); //redis url 
        this.handleEvents()
    }

    private handleEvents() {
        this.client.on('error', (error) => {
            console.log(`FAIL TO CONNECT TO REDIS ==> ${error}`)
        })

        this.client.on('ready', () => {
            console.log(`REDIS READY 👍`)
        })
    }

    public async connect() {
        await this.client.connect();
        console.log(`REDIS connected 🚀`)
    }

    otpKey = ({ email, subject = EmailEnum.CONFIRM_EMAIL }: RedisKeyType): string => {
        return `OTP USER ${email} , ${subject}`
    }

    maxAttemptOtpKey = ({ email, subject = EmailEnum.CONFIRM_EMAIL }: RedisKeyType): string => {
        return `${this.otpKey({ email, subject })}`
    }

    blockOtpKey = ({ email, subject = EmailEnum.CONFIRM_EMAIL }: RedisKeyType): string => {
        return `${this.otpKey({ email, subject })}`
    }

    baseRevokeTokenKey = (userId: Types.ObjectId | string): string => {
        return `RevokeToken ${userId.toString()}`
    }

    revokeTokenKey = ({ userId, jti }: { userId: Types.ObjectId | string, jti: string }): string => {
        return `${this.baseRevokeTokenKey(userId)} , ${jti}`
    }

    public set = async ({ key, value, ttl }:
        { key: string, value: any, ttl?: number | undefined })
        : Promise<string | null> => {
        try {
            const data = typeof value === 'string' ? value : JSON.stringify(value)
            let result: string | null;
            if (ttl) {
                result = (await this.client.set(key, data, { EX: ttl }));
            } else {
                result = (await this.client.set(key, data));
            }
            return result;
        } catch (error) {
            console.log(`fail in redis set operation ==> ${error}`)
            return null;
        }
    }

    public update = async ({ key, value, ttl }:
        { key: string, value: string | object, ttl?: number | undefined })
        : Promise<string | number | null> => {
        try {
            if (!await this.client.exists(key)) {
                return 0;
            }
            return await this.set({ key, value, ttl })
        } catch (error) {
            console.log(`fail in redis update operation ==> ${error}`)
            return null;
        }
    }

    public get = async (key: string): Promise<string | null> => {
        try {
            try {
                return JSON.parse(await this.client.get(key) as string)
            } catch (error) {
                return await this.client.get(key);
            }
        } catch (error) {
            console.log(`fail in redis get operation ==> ${error}`)
            return null;
        }
    }

    public ttl = async (key: string): Promise<number> => {
        try {
            return await this.client.ttl(key)
        } catch (error) {
            console.log(`fail in redis ttl operation ==> ${error}`)
            return -2;
        }
    }

    public exists = async (key: string): Promise<number> => {
        try {
            return await this.client.exists(key)
        } catch (error) {
            console.log(`fail in redis exists operation ==> ${error}`)
            return -2;
        }
    }

    public increment = async (key: string): Promise<number> => {
        try {
            return await this.client.incr(key)
        } catch (error) {
            console.log(`fail in redis increment operation ==> ${error}`)
            return -2;
        }
    }

    public expire = async ({ key, ttl }
        : { key: string, ttl: number })
        : Promise<number> => {
        try {
            return await this.client.expire(key, ttl)
        } catch (error) {
            console.log(`fail in redis expire operation ==> ${error}`)
            return -2;
        }
    }

    public mGet = async (keys: string[]): Promise<(string | null)[]> => {
        try {
            if (!keys.length) {
                return []
            }

            return await this.client.mGet(keys);
        } catch (error) {
            console.log(`Fail in redis mGet operation ==> ${error}`)
            return []
        }
    }

    public keys = async (prefix: string): Promise<string[]> => {
        try {
            return await this.client.keys(`${prefix}`)
        } catch (error) {
            console.log(`Fail in redis keys operation ==> ${error}`)
            return []
        }
    }

    public deleteKey = async (key: string | string[]): Promise<number> => {
        try {
            if (!key.length) {
                return 0;
            }
            return await this.client.del(key)
        } catch (error) {
            console.log(`Fail in redis delete Key operation ==> ${error}`)
            return 0;
        }
    }
}

export const redisService = new RedisService()
//esta5demna singleton 3ashan howa connection wa7ed nemshy beeh 3ala mostawa el app kolo (IMPORTANT)