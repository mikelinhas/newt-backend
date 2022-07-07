class Producer {
  constructor(producer) {
    this._id = producer.CIF
    this.name = producer.name
    this.CIF = producer.CIF
    this.description = producer.description
    this.email = producer.email
    this.phone = producer.phone
    this.product_categories = producer.product_categories
  }
}

module.exports = { Producer }
