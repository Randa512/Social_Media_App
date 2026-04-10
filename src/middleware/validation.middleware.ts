import type { NextFunction, Request, Response } from "express"
import { BadRequestException } from "../common/exceptions"
import { ZodError, ZodType } from "zod"

type KeyReqType = keyof Request;

type SchemaType = Partial<Record<KeyReqType, ZodType>>;

type IssuesType = Array<{
    key: KeyReqType,
    issues: Array<{
        message: string,
        path: Array<string | number | undefined | symbol>
    }>
}>;

export const validation = (schema: SchemaType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const validationErrors: IssuesType = []
        for (const key of Object.keys(schema) as KeyReqType[]) {
            if (!schema[key]) {
                continue;
            }
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const error = validationResult.error as ZodError
                validationErrors.push({ key, issues: error.issues.map(issue => { return { path: issue.path, message: issue.message } }) })
            }
        }
        if (validationErrors.length) {
            throw new BadRequestException("Validation Error", { validationErrors })
        }
        next();
    }
}