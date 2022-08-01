import { ObjectId } from "mongodb"

export class Product {
  _id: ObjectId
  family_id: ObjectId
  size: string
  color: string
  enabled: boolean
  created_at: Date

  constructor(newProduct: ProductCreateRequest, id: ObjectId) {
    this._id = id
    this.family_id = newProduct.family_id
    this.size = newProduct.size
    this.color = newProduct.color
    this.enabled = newProduct.enabled
    this.created_at = newProduct.created_at
  }
}

export class ProductCreateRequest {
  family_id: ObjectId
  size: string
  color: string
  enabled: boolean
  created_at: Date

  constructor({ size, family_id, color }: { family_id: string, size: string, color: string }) {
    this.family_id = new ObjectId(family_id)
    this.size = size.toUpperCase()
    this.color = color.toLowerCase()
    this.enabled = true
    this.created_at = new Date()
  }
}

export class ProductUpdateRequest {
  family_id?: ObjectId
  size?: string
  color?: string
  enabled?: boolean

  constructor({ size, family_id, color, enabled }: any) {
    this.family_id = family_id ? new ObjectId(family_id) : undefined
    this.size = size ? size.toUpperCase() : undefined
    this.color = color ? color.toLowerCase() : undefined
    this.enabled = enabled
  }
}

