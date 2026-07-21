import dbConnect from './mongoose';
import Product from '../models/Product';
import HeroCampaign from '../models/HeroCampaign';
import User from '../models/User';
import mongoose from 'mongoose';
import { hashPassword } from './auth';

const dummyProducts = [
  {
    name: "Embroidered Ivory Bridal Lehenga",
    slug: "embroidered-ivory-bridal-lehenga",
    description: "A stunning ivory lehenga with intricate silver and gold embroidery, perfect for the modern bride. Includes a matching blouse and dupatta.",
    price: 450000,
    category: "couture",
    subcategory: "bridal",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=2883&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=2787&auto=format&fit=crop"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Ivory"],
    inventoryCount: 5,
    isFeatured: true,
  },
  {
    name: "Midnight Blue Velvet Sherwani",
    slug: "midnight-blue-velvet-sherwani",
    description: "Luxurious midnight blue velvet sherwani featuring zardosi handwork on the collar and buttons.",
    price: 180000,
    category: "couture",
    subcategory: "menswear",
    images: [
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=2825&auto=format&fit=crop",
    ],
    sizes: ["38", "40", "42", "44"],
    colors: ["Midnight Blue"],
    inventoryCount: 3,
    isFeatured: true,
  },
  {
    name: "Emerald Cut Diamond Necklace",
    slug: "emerald-cut-diamond-necklace",
    description: "A breathtaking emerald cut diamond necklace set in 18k white gold. A statement piece for any occasion.",
    price: 1250000,
    category: "jewellery",
    subcategory: "necklace",
    images: [
      "https://images.unsplash.com/photo-1599643478524-fb66f70d00f0?q=80&w=2728&auto=format&fit=crop",
    ],
    inventoryCount: 1,
    isFeatured: true,
  },
  {
    name: "Classic Red Matte Lipstick",
    slug: "classic-red-matte-lipstick",
    description: "Highly pigmented, long-lasting matte lipstick in a classic red shade.",
    price: 2500,
    category: "beauty",
    subcategory: "makeup",
    images: [
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=2715&auto=format&fit=crop",
    ],
    inventoryCount: 100,
    isFeatured: false,
  },
  {
    name: "Floral Print Chiffon Saree",
    slug: "floral-print-chiffon-saree",
    description: "Lightweight chiffon saree with a delicate floral print and embellished border.",
    price: 65000,
    category: "pret",
    subcategory: "saree",
    images: [
      "https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?q=80&w=2940&auto=format&fit=crop",
    ],
    inventoryCount: 12,
    isFeatured: true,
  }
];

const dummyCampaigns = [
  { title: 'The Couture Edit', subtitle: 'New Arrivals', videoUrl: '/clothures_video.mp4', linkUrl: '/products?category=couture', order: 0 },
  { title: 'High Jewellery', subtitle: 'Signature Collection', videoUrl: '/jwellay_video.mp4', linkUrl: '/products?category=jewellery', order: 1 },
  { title: 'Accessories', subtitle: 'Essentials', videoUrl: '/accessary_video.mp4', linkUrl: '/products?category=beauty', order: 2 }
];

export async function seedDatabase() {
  try {
    await dbConnect();
    console.log("Connected to MongoDB.");
    
    // Clear existing products and campaigns
    await Product.deleteMany({});
    await HeroCampaign.deleteMany({});
    await User.deleteMany({});
    console.log("Cleared existing data.");

    // Insert dummy data
    await Product.insertMany(dummyProducts);
    await HeroCampaign.insertMany(dummyCampaigns);
    
    // Insert dummy users
    const adminPassword = await hashPassword('admin123');
    const userPassword = await hashPassword('user123');
    await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@bespoken.com',
        password: adminPassword,
        role: 'admin'
      },
      {
        name: 'Test Customer',
        email: 'customer@bespoken.com',
        password: userPassword,
        role: 'customer'
      }
    ]);

    console.log("Successfully seeded database with products, campaigns, and users!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    // If running as a standalone script
    if (require.main === module) {
      mongoose.connection.close();
    }
  }
}

// Execute if run directly
if (require.main === module) {
  seedDatabase();
}
