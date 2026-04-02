import { cacheTag } from 'next/cache'

// Helper to generate a random fetch ID - this changes each time the function actually runs
// When you see the same fetchId, the data was served from cache
// When fetchId changes after revalidation, fresh data was fetched
function generateFetchId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Simulated product data - in production this would be a database or API call
const PRODUCTS_DB = [
  { id: '1', name: 'Wireless Headphones', price: 149.99, category: 'electronics', stock: 25 },
  { id: '2', name: 'Mechanical Keyboard', price: 189.99, category: 'electronics', stock: 15 },
  { id: '3', name: 'Running Shoes', price: 129.99, category: 'sports', stock: 42 },
  { id: '4', name: 'Coffee Maker', price: 79.99, category: 'home', stock: 8 },
  { id: '5', name: 'Yoga Mat', price: 39.99, category: 'sports', stock: 100 },
  { id: '6', name: 'Smart Watch', price: 299.99, category: 'electronics', stock: 12 },
]

export type Product = typeof PRODUCTS_DB[number]

/**
 * Cached function to fetch all products
 * The "use cache" directive makes this function's result cacheable
 * cacheTag() assigns a tag that can be used with revalidateTag() to invalidate
 */
export async function getProducts() {
  "use cache"
  cacheTag('products')
  
  // Simulate network delay (longer to show Suspense fallback on cache miss)
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const fetchId = generateFetchId()
  return { 
    products: PRODUCTS_DB, 
    fetchId,
    tag: 'products' 
  }
}

/**
 * Cached function to fetch a single product by ID
 * Tagged with both 'products' and specific 'product-{id}'
 */
export async function getProduct(id: string): Promise<Product | undefined> {
  "use cache"
  cacheTag('products', `product-${id}`)
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300))
  

  return PRODUCTS_DB.find(p => p.id === id)
}

/**
 * Cached function to fetch products by category
 * Tagged with 'products' and 'category-{category}'
 */
export async function getProductsByCategory(category: string) {
  "use cache"
  cacheTag('products', `category-${category}`)
  
  // Simulate network delay (longer to show Suspense fallback on cache miss)
  await new Promise(resolve => setTimeout(resolve, 1200))
  
  const fetchId = generateFetchId()
  return { 
    products: PRODUCTS_DB.filter(p => p.category === category),
    fetchId,
    tag: `category-${category}`
  }
}

/**
 * Cached function to get product statistics
 * Tagged with 'products-stats'
 */
export async function getProductStats() {
  "use cache"
  cacheTag('products-stats')
  
  // Simulate expensive computation (longer to show Suspense fallback on cache miss)
  await new Promise(resolve => setTimeout(resolve, 2000))
  

  
  const totalProducts = PRODUCTS_DB.length
  const totalStock = PRODUCTS_DB.reduce((sum, p) => sum + p.stock, 0)
  const avgPrice = PRODUCTS_DB.reduce((sum, p) => sum + p.price, 0) / totalProducts
  const categories = [...new Set(PRODUCTS_DB.map(p => p.category))]
  
  const fetchId = generateFetchId()
  return {
    totalProducts,
    totalStock,
    avgPrice: avgPrice.toFixed(2),
    categories,
    fetchId,
    tag: 'products-stats'
  }
}
