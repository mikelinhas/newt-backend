import { Collection, Db, ObjectId } from "mongodb";
import { DeletionResult } from "../../utils/crud";
import { createMatchObjectFromQuery } from "./helpers";
import { Product, ProductCreateRequest, ProductUpdateRequest } from "./models";

export const PRODUCTS_COLLECTION = 'products'

export class ProductService {
  private collection: Collection

  constructor(db: Db) {
    this.collection = db.collection(PRODUCTS_COLLECTION)
  }

  async create(product: ProductCreateRequest): Promise<Product> {
    const result = await this.collection.insertOne(product)
    if (result.insertedId) {
      return new Product(product, result.insertedId)
    } else {
      throw new Error("The product was not created for some reason...")
    }
  }

  async update(id: string, updateRequest: ProductUpdateRequest) {
    const _id = new ObjectId(id)
    const set: any = {}
    Object.entries(updateRequest).forEach((entry) => {
      const key = entry[0] as string
      const value = entry[1] as any
      set[key] = value
    })
    await this.collection
      .updateOne({ _id }, { $set: set })
    const product = await this.collection.findOne({ _id })
    return product
  }

  async deleteById(id: string): Promise<DeletionResult> {
    const _id = new ObjectId(id)
    const result = await this.collection.deleteOne({ _id })
    return {
      collection: PRODUCTS_COLLECTION,
      totalDeleted: result.deletedCount
    }
  }


  async find() {
    await this.collection.find().toArray()
  }

  async findAndGroupByCategories(query: any) {
    const mongoQuery = createMatchObjectFromQuery(query)
    const result = await this.collection
      .aggregate([
        { $match: { enabled: true } },
        {
          $lookup: {
            from: 'products.families',
            let: { familyId: '$family_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [{ $toObjectId: '$$familyId' }, '$_id'],
                  },
                },
              },
            ],
            as: 'family',
          },
        },
        {
          $project: {
            product_id: 1,
            category: { $first: '$family.category' },
            subcategory: { $first: '$family.subcategory' },
            name: { $first: '$family.name' },
            color: 1,
            size: 1,
            stock: 1,
          },
        },
        // filter with query
        {
          $match: mongoQuery,
        },
        {
          $lookup: {
            from: 'production',
            let: { productId: '$_id' },
            pipeline: [
              { $match: { closed: false } },
              { $unwind: '$items' },
              {
                $match: {
                  $expr: {
                    $eq: [{ $toObjectId: '$items.product_id' }, '$$productId'],
                  },
                },
              },
            ],
            as: 'orders',
          },
        },
        {
          $project: {
            ordered: { $sum: '$orders.items.ordered' },
            received: { $sum: '$orders.items.finished' },
            product_id: 1,
            category: 1,
            subcategory: 1,
            name: 1,
            color: 1,
            size: 1,
            stock: 1,
          },
        },
        {
          $group: {
            _id: '$name',
            name: { $first: '$name' },
            category: { $first: '$category' },
            subcategory: { $first: '$subcategory' },
            products: { $push: '$$ROOT' },
          },
        },
        { $sort: { name: 1 } },
        {
          $group: {
            _id: '$category',
            category: { $first: '$category' },
            subcategory: { $first: '$subcategory' },
            families: { $push: '$$ROOT' },
          },
        },
        { $sort: { category: 1 } },
      ])
      .toArray()
    return result
  }
}