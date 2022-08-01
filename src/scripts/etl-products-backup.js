const MongoClient = require('mongodb').MongoClient

const DB_URL = 'mongodb://localhost:27017'
const DB_NAME = 'etltest'
let db

class ProductFamily {
  constructor({ category, subcategory, name }) {
    this.category = category.toLowerCase()
    this.subcategory = subcategory.toLowerCase()
    this.name = name.toLowerCase()
  }
}

// class Product {
//   constructor({ size, family_id, color }) {
//     this.family_id = family_id
//     this.size = size.toUpperCase()
//     this.color = color.toLowerCase()
//     this.stock = 0
//     this.enabled = true
//     this.created_at = new Date()
//   }
// }

const newCategories = [
  {
    name: 'swimwear',
    subcategories: ['Swimwear Tops', 'Swimwear Bottoms', 'Swimsuits'],
  },
  {
    name: 'underwear',
    subcategories: ['Bras', 'Briefs', 'Bodies', 'Men'],
  },
  {
    name: 'socks',
    subcategories: ['Socks'],
  },
  {
    name: 'shoes',
    subcategories: ['Sandals'],
  },
  {
    name: 'care',
    subcategories: ['Laundry bag', 'Jabones'],
  },
]

// CONNECTION to DATABASE
const connectToDatabase = async () => {
  console.log('Connecting to MongoDB...\n')
  const client = await MongoClient.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  db = client.db(DB_NAME)
}

const getProductFamilies = async () => {
  const productFamilies = await db
    .collection('products')
    .aggregate([
      {
        $group: {
          _id: { category: '$category', name: '$name' },
          products: { $push: '$$ROOT' },
        },
      },
    ])
    .toArray()
  return productFamilies
}

async function main() {
  try {
    await connectToDatabase()
    const productFamilies = await getProductFamilies()
    await Promise.all(
      productFamilies.map(async (productFamily) => {
        // create new Family
        const oldCategory = productFamily._id.category
        const newCategory = renameCategory(oldCategory)
        const category = newCategory
        const subcategory = oldCategory
        const name = productFamily._id.name
        const newProductFamily = new ProductFamily({
          category,
          subcategory,
          name,
        })
        const result = await db
          .collection('products.families')
          .insertOne(newProductFamily)
        const family_id = String(result.insertedId)

        // append family to products
        await Promise.all(
          productFamily.products.map(async ({ _id, name, size }) => {
            const newName = name.toLowerCase()
            const newSize = String(size).toUpperCase()
            await db.collection('products').update(
              { _id },
              {
                $set: {
                  family_id,
                  name: newName,
                  size: newSize,
                  enabled: true,
                },
              }
            )
            await db.collection('products').update(
              { _id },
              {
                $unset: { category: '', name: '' },
              }
            )
          })
        )
      })
    )

    console.log('\n')

    process.exit()
  } catch (error) {
    console.log(error)
    process.exit()
  }
}

main()

const renameCategory = (oldCategory) => {
  const newCategory = newCategories.find((category) => {
    return category.subcategories.includes(oldCategory)
  })
  return newCategory.name
}
