import { Collection, Db, ObjectId } from "mongodb";
import { Optional } from "typescript-optional";
import { DeletionResult, SaveAction, SaveResult } from "../../utils/crud";
import { PRODUCTS_COLLECTION } from "../products/service";
import { ProductFamily, ProductFamilyCreateRequest, ProductFamilyUpdateRequest } from "./models";

export const PRODUCTS_FAMILIES_COLLECTION = 'products.families'

export class ProductFamilyService {
  private collection: Collection
  private productsCollection: Collection

  constructor(db: Db) {
    this.collection = db.collection(PRODUCTS_FAMILIES_COLLECTION)
    this.productsCollection = db.collection(PRODUCTS_COLLECTION)
  }

  async create(productFamily: ProductFamilyCreateRequest): Promise<ProductFamily> {
    const result = await this.collection.insertOne(ProductFamily)
    if (result.insertedId) {
      return new ProductFamily(productFamily, result.insertedId)
    } else {
      throw new Error("The product family was not created for some reason!!")
    }
  }

  async update(id: string, updateRequest: ProductFamilyUpdateRequest): Promise<SaveResult<ProductFamily>> {
    const _id = new ObjectId(id)
    let saveAction: SaveAction;
    const result = await this.collection
      .replaceOne({ _id }, updateRequest, { upsert: false })
    if (result.modifiedCount > 0) {
      saveAction = SaveAction.Updated
    } else {
      saveAction = SaveAction.NotModified
    }
    const updatedFamily = await this.collection
      .findOne({ _id }) as ProductFamily
    return {
      action: saveAction,
      savedObject: updatedFamily
    }
  }

  async find() {
    await this.collection
      .find({})
      .sort({ category: 1 })
      .toArray()
  }

  async findById(id: string): Promise<Optional<ProductFamily>> {
    const _id = new ObjectId(id)
    let productFamily = await this.collection.findOne({ _id }) as ProductFamily
    if (productFamily) {
      return Optional.of(productFamily)
    } else {
      return Optional.empty()
    }
  }

  async deleteById(id: string): Promise<DeletionResult> {
    const _id = new ObjectId(id)
    const productsDeletionResult = await this.productsCollection.deleteMany({ family_id: _id })
    const result = await this.collection.deleteOne({ _id })
    const deletionResult = {
      collection: PRODUCTS_FAMILIES_COLLECTION,
      totalDeleted: result.deletedCount,
      relatedDocuments: [
        {
          collection: PRODUCTS_COLLECTION,
          totalDeleted: productsDeletionResult.deletedCount
        }
      ]
    }
    return deletionResult
  }


  // TODO: missing return type
  async findCategories() {
    const result = await this.collection
      .aggregate([
        { $group: { _id: '$category', name: { $first: '$category' } } },
        { $project: { _id: 0 } },
        { $sort: { name: 1 } },
      ])
      .toArray()
    return result
  }

  async findFamilyNames(query: any) {
    const result = await this.collection.aggregate([
      { $match: query },
      { $group: { _id: '$name', name: { $first: '$name' } } },
      { $project: { _id: 0 } },
      { $sort: { name: 1 } },
    ])
      .toArray()
    return result
  }

  async findFamilyColors(query: any) {
    const result = await this.productsCollection
      .aggregate([
        {
          $lookup: {
            from: PRODUCTS_FAMILIES_COLLECTION,
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
          $addFields: {
            category: { $first: '$family.category' },
            subcategory: { $first: '$family.subcategory' },
            name: { $first: '$family.name' },
          },
        },
        { $match: query },
        { $group: { _id: '$color', name: { $first: '$color' } } },
        { $project: { _id: 0 } },
        { $sort: { name: 1 } },
      ])
      .toArray()

    return result
  }

  async findFamilySizes(query: any) {
    const result = await this.productsCollection
      .aggregate([
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
          $addFields: {
            category: { $first: '$family.category' },
            subcategory: { $first: '$family.subcategory' },
            name: { $first: '$family.name' },
          },
        },
        { $match: query },
        { $group: { _id: '$size', name: { $first: '$size' } } },
        { $project: { _id: 0 } },
        { $sort: { name: 1 } },
      ])
      .toArray()
    return result
  }

  async findSubcategories(category?: string) {
    const query = category ? { category } : {}
    const result = await this.collection
      .aggregate([
        { $match: query },
        { $group: { _id: '$subcategory', name: { $first: '$subcategory' } } },
        { $project: { _id: 0 } },
        { $sort: { name: 1 } },
      ])
      .toArray()
  }

}