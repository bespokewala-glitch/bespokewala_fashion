import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { hashPassword } from '@/lib/auth';
import { checkAdminRateLimit } from '@/lib/media/rateLimit';
import { logAdminAction } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Enforce rate limiting
    const rl = await checkAdminRateLimit(req, 'adminSensitive');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      );
    }

    // Check if an admin already exists - strictly forbid once any admin is configured
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Setup endpoint disabled. Admin already exists in system.' },
        { status: 403 }
      );
    }

    // Require setup token: in production, ADMIN_SETUP_SECRET is mandatory
    const isProd = process.env.NODE_ENV === 'production';
    const setupSecret = process.env.ADMIN_SETUP_SECRET;
    const setupToken = req.nextUrl.searchParams.get('token') || req.headers.get('x-setup-token');

    if (isProd && !setupSecret) {
      return NextResponse.json(
        { error: 'Setup endpoint disabled in production.' },
        { status: 403 }
      );
    }

    if (setupSecret && setupToken !== setupSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing setup token.' },
        { status: 401 }
      );
    }

    // Create admin user with securely hashed password if none exists
    const adminExists = await User.findOne({ email: 'admin@bespoken.com' });
    let adminUser;

    if (!adminExists) {
      const hashedPassword = await hashPassword('password123');
      adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@bespoken.com',
        mobileNumber: '9999999999',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
      });
      await logAdminAction({
        actor_id: adminUser._id.toString(),
        actor_email: adminUser.email,
        action: 'system.settings_updated',
        target_type: 'system',
        meta: { event: 'initial_admin_setup_created' },
        req,
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
    console.error('Setup endpoint error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

