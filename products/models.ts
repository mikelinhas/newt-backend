import { ObjectId } from "mongodb"

export class ProductFamily {
  category: string
  subcategory: string
  name: string

  constructor({ category, subcategory, name }) {
    this.category = category.toLowerCase()
    this.subcategory = subcategory.toLowerCase()
    this.name = name.toLowerCase()
  }
}

export class Product {
  family_id: ObjectId
  size: string
  color: string
  enabled: boolean
  created_at: Date

  constructor({ size, family_id, color }) {
    this.family_id = family_id
    this.size = size.toUpperCase()
    this.color = color.toLowerCase()
    this.enabled = true
    this.created_at = new Date()
  }
}
