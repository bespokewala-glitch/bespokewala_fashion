import { Tool, SchemaType } from '@google/generative-ai';

/**
 * Gemini function-calling tool schemas.
 * These tell the AI WHAT tools it can call and with what parameters.
 * The actual implementations are in the API route handler.
 */
export const CHATBOT_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'searchProducts',
        description: 'Search the Bespokewala product catalogue. Use this to find products matching the customer\'s request. Always use this tool instead of guessing product availability.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            productType: {
              type: SchemaType.STRING,
              description: 'The product department: "couture", "jewellery", or "footwear"',
            },
            category: {
              type: SchemaType.STRING,
              description: 'The product category, e.g. "lehenga", "saree", "necklace", "heels"',
            },
            occasion: {
              type: SchemaType.STRING,
              description: 'The occasion, e.g. "wedding", "party", "festive", "casual"',
            },
            colors: {
              type: SchemaType.STRING,
              description: 'Colour filter, e.g. "red", "gold", "blue"',
            },
            minPrice: {
              type: SchemaType.NUMBER,
              description: 'Minimum price in INR',
            },
            maxPrice: {
              type: SchemaType.NUMBER,
              description: 'Maximum price in INR',
            },
            q: {
              type: SchemaType.STRING,
              description: 'Free-text search query for product name, category, or collection',
            },
            limit: {
              type: SchemaType.NUMBER,
              description: 'Maximum number of results to return (default: 4, max: 8)',
            },
          },
          required: [],
        },
      },
      {
        name: 'getProductDetails',
        description: 'Fetch complete details for a single product by its slug. Use this to answer specific questions about a product\'s fabric, sizes, colours, price, or availability.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            slug: {
              type: SchemaType.STRING,
              description: 'The product slug (URL identifier), e.g. "royal-blue-embroidered-lehenga"',
            },
          },
          required: ['slug'],
        },
      },
      {
        name: 'getSimilarProducts',
        description: 'Find products similar to a given product based on category, price range, and style.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            slug: {
              type: SchemaType.STRING,
              description: 'The slug of the reference product',
            },
            limit: {
              type: SchemaType.NUMBER,
              description: 'Maximum number of similar products to return (default: 4)',
            },
          },
          required: ['slug'],
        },
      },
      {
        name: 'getOrderStatus',
        description: 'Retrieve order information for the currently authenticated user. Only call this if the user asks about their orders. Returns null if the user is not logged in.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            orderId: {
              type: SchemaType.STRING,
              description: 'Specific order ID if the user mentions it. Leave empty to fetch the most recent order.',
            },
          },
          required: [],
        },
      },
      {
        name: 'getFAQAnswer',
        description: 'Look up answers from the Bespokewala FAQ and policy knowledge base. Use this for questions about shipping, returns, payments, sizing, custom orders, and care instructions.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: {
              type: SchemaType.STRING,
              description: 'The customer\'s question to look up in the FAQ',
            },
          },
          required: ['query'],
        },
      },
    ],
  },
];
