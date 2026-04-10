import { AnyKeys, CreateOptions, DeleteResult, FlattenMaps, HydratedDocument, Model, PopulateOptions, ProjectionType, QueryFilter, QueryOptions, ReturnsNewDoc, Types, UpdateQuery, UpdateResult, UpdateWithAggregationPipeline } from "mongoose";
import { IUser } from "../../common/interfaces";
import { UpdateOptions } from "mongodb";


export abstract class DatabaseRepository<TRawDocument> {

    constructor(protected readonly model: Model<TRawDocument>) { }

    //prototypes of create (OVERLOADING)
    async create({ data }
        // anykeys from mongoose or partial 
        : { data: AnyKeys<TRawDocument> })
        : Promise<HydratedDocument<TRawDocument>>

    async create({ data, options }
        : { data: AnyKeys<TRawDocument>[], options?: CreateOptions | undefined })
        : Promise<HydratedDocument<TRawDocument>[]>

    //implementation
    async create({ data, options }
        : { data: AnyKeys<TRawDocument> | AnyKeys<TRawDocument>[], options?: CreateOptions | undefined })
        : Promise<HydratedDocument<TRawDocument> | HydratedDocument<TRawDocument>[]> {
        return await this.model.create(data as any, options)
    }

    async createOne({ data, options }
        : { data: Partial<TRawDocument>, options?: CreateOptions | undefined })
        : Promise<HydratedDocument<TRawDocument>> {
        const [document] = await this.create({ data: [data], options }) || []
        return document as HydratedDocument<TRawDocument>
    }

    //===================================================================================
    async findOne({ filter, projection, options }: {
        filter?: QueryFilter<TRawDocument>,
        projection?: ProjectionType<TRawDocument> | null | undefined,
        options?: QueryOptions<TRawDocument> & { lean: false } | null | undefined
    }): Promise<HydratedDocument<IUser> | null>

    async findOne({ filter, projection, options }: {
        filter?: QueryFilter<TRawDocument>,
        projection?: ProjectionType<TRawDocument> | null | undefined,
        options?: QueryOptions<TRawDocument> & { lean: true } | null | undefined
    }): Promise<null | FlattenMaps<IUser>>

    async findOne({ filter, projection, options }: {
        filter?: QueryFilter<TRawDocument>,
        projection?: ProjectionType<TRawDocument> | null | undefined,
        options?: QueryOptions<TRawDocument> | null | undefined
    }): Promise<any> {
        const document = this.model.findOne(filter, projection)
        if (options?.lean) {
            document.lean(options.lean)
        }
        if (options?.populate) {
            document.populate(options.populate as PopulateOptions[])
        }
        return await document.exec();
    }

    //===================================================================================
    async findById({ _id, projection, options }: {
        _id?: Types.ObjectId,
        projection?: ProjectionType<TRawDocument> | null | undefined,
        options?: QueryOptions<TRawDocument> & { lean: false } | null | undefined
    }): Promise<HydratedDocument<IUser> | null>

    async findById({ _id, projection, options }: {
        _id?: Types.ObjectId,
        projection?: ProjectionType<TRawDocument> | null | undefined,
        options?: QueryOptions<TRawDocument> & { lean: true } | null | undefined
    }): Promise<null | FlattenMaps<IUser>>

    async findById({ _id, projection, options }: {
        _id?: Types.ObjectId,
        projection?: ProjectionType<TRawDocument> | null | undefined,
        options?: QueryOptions<TRawDocument> | null | undefined
    }): Promise<any> {
        const document = this.model.findById(_id, projection)
        if (options?.lean) {
            document.lean(options.lean)
        }
        if (options?.populate) {
            document.populate(options.populate as PopulateOptions[])
        }
        return await document.exec();
    }
    //===================================================================================
    async updateOne({
        filter, update, options
    }: {
        filter: QueryFilter<TRawDocument>,
        update: UpdateQuery<TRawDocument> | UpdateWithAggregationPipeline,
        options?: UpdateOptions | null
    }): Promise<UpdateResult> {
        return await this.model.updateOne(filter, update, options)
    }

    async updateMany({
        filter, update, options
    }: {
        filter: QueryFilter<TRawDocument>,
        update: UpdateQuery<TRawDocument> | UpdateWithAggregationPipeline,
        options?: UpdateOptions | null
    }): Promise<UpdateResult> {
        return await this.model.updateMany(filter, update, options)
    }

    async findOneAndUpdate({
        filter, update, options = { new: true }
    }: {
        filter: QueryFilter<TRawDocument>,
        update: UpdateQuery<TRawDocument>,
        options: QueryOptions<TRawDocument> & ReturnsNewDoc

    }): Promise<HydratedDocument<TRawDocument> | null> {
        return await this.model.findOneAndUpdate(filter, update, options)
    }

    async findByIdAndUpdate({
        _id, update, options = { new: true }
    }: {
        _id: Types.ObjectId,
        update?: UpdateQuery<TRawDocument>,
        options?: QueryOptions<TRawDocument> | null
    }): Promise<HydratedDocument<TRawDocument> | null> {
        return await this.model.findByIdAndUpdate(_id, update, options)
    }

    //===================================================================================
    async deleteOne({
        filter
    }: {
        filter: QueryFilter<TRawDocument>
    }): Promise<DeleteResult> {
        return await this.model.deleteOne(filter)
    }

    async deleteMany({
        filter
    }: {
        filter: QueryFilter<TRawDocument>
    }): Promise<DeleteResult> {
        return await this.model.deleteMany(filter)
    }

    async findOneAndDelete({
        filter
    }: {
        filter: QueryFilter<TRawDocument>
    }): Promise<HydratedDocument<TRawDocument> | null> {
        return await this.model.findOneAndDelete(filter)
    }

    async findByIdAndDelete({
        _id
    }: {
        _id: Types.ObjectId
    }): Promise<HydratedDocument<TRawDocument> | null> {
        return await this.model.findByIdAndDelete(_id)
    }

}
