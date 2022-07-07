const mongo = require('mongodb')
const database = require('../../database/utils')
const db = database.getDatabaseConnection()

const errorHandler = (error, res) => {
  console.error(error)
  res.status(500).send(error)
}

const exportProducts = async function (req, res) {
  try {
    const result = await db
      .collection('products')
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
            as: 'family_info',
          },
        },
        {
          $addFields: {
            category: { $arrayElemAt: ['$family_info.category', 0] },
            subcategory: { $arrayElemAt: ['$family_info.subcategory', 0] },
            name: { $arrayElemAt: ['$family_info.name', 0] },
          },
        },
        {
          $project: {
            family_info: 0,
            family_id: 0,
            enabled: 0,
          },
        },
      ])
      .toArray()

    res.xls('data.xlsx', result)
  } catch (error) {
    errorHandler(error, res)
  }
}

const importProducts = async function (req, res) {
  try {
    const products = req.body
    const bulk = db.collection('products').initializeUnorderedBulkOp()

    const withoutIdOrStock = []
    products.forEach((product) => {
      if (product._id && typeof product.stock === 'number') {
        bulk
          .find({ _id: new mongo.ObjectID(product._id) })
          .update({ $set: { stock: product.stock } })
      } else {
        withoutIdOrStock.push(product)
      }
    })

    const { nModified, nMatched } = await bulk.execute()

    res.status(200).send({ nMatched, nModified, withoutIdOrStock })
  } catch (error) {
    errorHandler(error, res)
  }
}

module.exports = {
  exportProducts,
  importProducts,
}
