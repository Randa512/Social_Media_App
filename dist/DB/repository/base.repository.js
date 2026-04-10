"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create({ data, options }) {
        return await this.model.create(data, options);
    }
    async createOne({ data, options }) {
        const [document] = await this.create({ data: [data], options }) || [];
        return document;
    }
    async findOne({ filter, projection, options }) {
        const document = this.model.findOne(filter, projection);
        if (options?.lean) {
            document.lean(options.lean);
        }
        if (options?.populate) {
            document.populate(options.populate);
        }
        return await document.exec();
    }
    async findById({ _id, projection, options }) {
        const document = this.model.findById(_id, projection);
        if (options?.lean) {
            document.lean(options.lean);
        }
        if (options?.populate) {
            document.populate(options.populate);
        }
        return await document.exec();
    }
    async updateOne({ filter, update, options }) {
        return await this.model.updateOne(filter, update, options);
    }
    async updateMany({ filter, update, options }) {
        return await this.model.updateMany(filter, update, options);
    }
    async findOneAndUpdate({ filter, update, options = { new: true } }) {
        return await this.model.findOneAndUpdate(filter, update, options);
    }
    async findByIdAndUpdate({ _id, update, options = { new: true } }) {
        return await this.model.findByIdAndUpdate(_id, update, options);
    }
    async deleteOne({ filter }) {
        return await this.model.deleteOne(filter);
    }
    async deleteMany({ filter }) {
        return await this.model.deleteMany(filter);
    }
    async findOneAndDelete({ filter }) {
        return await this.model.findOneAndDelete(filter);
    }
    async findByIdAndDelete({ _id }) {
        return await this.model.findByIdAndDelete(_id);
    }
}
exports.DatabaseRepository = DatabaseRepository;
