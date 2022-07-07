class ProductFamily {
  constructor({ category, subcategory, name }) {
    this.category = category.toLowerCase()
    this.subcategory = subcategory.toLowerCase()
    this.name = name.toLowerCase()
  }
}

class Product {
  constructor({ size, family_id, color }) {
    this.family_id = family_id
    this.size = size.toUpperCase()
    this.color = color.toLowerCase()
    this.enabled = true
    this.created_at = new Date()
  }
}

module.exports = { ProductFamily, Product }
