class ProductionOrder {
  constructor({ order_number, producer_id, producer_name, items }) {
    this.order_number = order_number
    this.producer_id = producer_id
    this.producer_name = producer_name
    this.items = normalizeItems(items)
    this.date = new Date()
    this.closed = false
    this.modified_at = []
  }
}

class ProductionOrderItem {
  constructor({ category, color, name, size, new_ordered, product_id }) {
    this.category = category
    this.color = color
    this.size = size
    this.name = name
    this.ordered = new_ordered
    this.finished = 0
    this.product_id = product_id
  }
}

function normalizeItems(items) {
  const modifiedItems = items.map((item) => {
    return new ProductionOrderItem(item)
  })
  return modifiedItems
}

module.exports = { ProductionOrder, ProductionOrderItem }
