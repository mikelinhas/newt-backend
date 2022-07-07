class Supplier {
  constructor(supplier) {
    this._id = supplier.CIF
    this.name = supplier.name
    this.CIF = supplier.CIF
    this.description = supplier.description
    this.email = supplier.email
    this.phone = supplier.phone
    this.tags = supplier.tags
  }
}

module.exports = { Supplier }
