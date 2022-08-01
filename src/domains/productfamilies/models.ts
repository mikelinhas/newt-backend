import { ObjectId } from "mongodb"

export class ProductFamily {
  _id: ObjectId
  category: string
  subcategory: string
  name: string

  constructor(productFamily: ProductFamilyCreateRequest, id: ObjectId) {
    this._id = id
    this.category = productFamily.category
    this.subcategory = productFamily.subcategory
    this.name = productFamily.name
  }
}

export class ProductFamilyCreateRequest {
  category: string
  subcategory: string
  name: string

  constructor({ category, subcategory, name }: { category: string, subcategory: string, name: string }) {
    this.category = category.toLowerCase()
    this.subcategory = subcategory.toLowerCase()
    this.name = name.toLowerCase()
  }
}

export class ProductFamilyUpdateRequest {
  category: string
  subcategory: string
  name: string

  constructor({ category, subcategory, name }: any) {
    this.category = category.toUpperCase()
    this.subcategory = subcategory.toLowerCase()
    this.name = name.toLowerCase()
  }
}
