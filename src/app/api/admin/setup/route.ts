import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Order from '@/models/Order';
import Product from '@/models/Product';

export async function GET() {
  try {
    await dbConnect();

    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@bespoken.com' });
    let adminUser;

    if (!adminExists) {
      adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@bespoken.com',
        mobileNumber: '9999999999',
        password: 'password123', // In a real app, hash this!
        role: 'admin',
      });
    } else {
      adminUser = adminExists;
    }

    // Create a regular user for dummy order
    let customer = await User.findOne({ email: 'customer@test.com' });
    if (!customer) {
      customer = await User.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        password: 'password123',
        role: 'customer',
      });
    }

    // Check if we have products to create dummy orders
    const products = await Product.find().limit(2);

    if (products.length > 0) {
      // Check if orders exist
      const ordersCount = await Order.countDocuments();
      if (ordersCount === 0) {
        await Order.create({
          user: customer._id,
          items: [
            {
              product: products[0]._id,
              name: products[0].name,
              quantity: 1,
              price: products[0].price,
            }
          ],
          totalAmount: products[0].price,
          status: 'Pending',
          shippingAddress: {
            street: '123 Fashion St',
            city: 'Mumbai',
            state: 'Maharashtra',
            zipCode: '400001',
            country: 'India',
          }
        });

        if (products.length > 1) {
          await Order.create({
            user: customer._id,
            items: [
              {
                product: products[1]._id,
                name: products[1].name,
                quantity: 2,
                price: products[1].price,
              }
            ],
            totalAmount: products[1].price * 2,
            status: 'Processing',
            shippingAddress: {
              street: '456 Style Ave',
              city: 'Delhi',
              state: 'Delhi',
              zipCode: '110001',
              country: 'India',
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user and dummy orders setup successfully.',
      adminEmail: adminUser.email
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
