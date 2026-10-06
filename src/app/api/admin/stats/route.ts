export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import { requireAdmin } from '@/lib/auth';

export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireAdmin(request);
    if (errorResponse) {
      return errorResponse;
    }

    await dbConnect();

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ─── Parallel aggregations ───────────────────────────────────────────────
    const [
      totalOrders,
      totalUsers,
      totalProducts,
      paidOrdersCount,
      pendingOrdersCount,
      failedOrdersCount,
      revenueAgg,
      thisMonthRevenueAgg,
      lastMonthRevenueAgg,
      thisMonthOrdersCount,
      lastMonthOrdersCount,
      ordersByStatus,
      recentOrders,
      last7DaysOrders,
      topProducts,
      newUsersThisMonth,
      newUsersLastMonth,
      lowStockProducts,
      lowStockCount,
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments(),

      // Payment status counts
      Order.countDocuments({ paymentStatus: 'completed' }),
      Order.countDocuments({ paymentStatus: 'pending' }),
      Order.countDocuments({ paymentStatus: 'failed' }),

      // Total revenue (completed payments only)
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      // This month revenue
      Order.aggregate([
        { $match: { paymentStatus: 'completed', createdAt: { $gte: startOfThisMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      // Last month revenue
      Order.aggregate([
        { $match: { paymentStatus: 'completed', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),

      // This month orders count
      Order.countDocuments({ createdAt: { $gte: startOfThisMonth } }),
      // Last month orders count
      Order.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),

      // Orders grouped by status
      Order.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      ]),

      // Recent 8 orders with user info
      Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),

      // Last 7 days daily revenue
      Order.aggregate([
        { $match: { paymentStatus: 'completed', createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top 5 products by revenue
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.name' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            unitsSold: { $sum: '$items.quantity' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),

      // New users this month
      User.countDocuments({ role: 'customer', createdAt: { $gte: startOfThisMonth } }),
      // New users last month
      User.countDocuments({ role: 'customer', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      // Low stock products (< 5 items)
      Product.find({ inventoryCount: { $lte: 5 } })
        .select('_id name slug price inventoryCount images productType category')
        .sort({ inventoryCount: 1 })
        .limit(8)
        .lean(),
      Product.countDocuments({ inventoryCount: { $lte: 5 } }),
    ]);

    // ─── Process results ─────────────────────────────────────────────────────
    const totalRevenue = revenueAgg[0]?.total ?? 0;
    const thisMonthRevenue = thisMonthRevenueAgg[0]?.total ?? 0;
    const lastMonthRevenue = lastMonthRevenueAgg[0]?.total ?? 0;

    const revenueGrowth = lastMonthRevenue === 0
      ? 100
      : Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);

    const ordersGrowth = lastMonthOrdersCount === 0
      ? 100
      : Math.round(((thisMonthOrdersCount - lastMonthOrdersCount) / lastMonthOrdersCount) * 100);

    const usersGrowth = newUsersLastMonth === 0
      ? 100
      : Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100);

    const statusMap: Record<string, number> = {};
    ordersByStatus.forEach((s: any) => { statusMap[s._id] = s.count; });

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        paidOrders: paidOrdersCount,
        pendingOrders: pendingOrdersCount,
        failedOrders: failedOrdersCount,
        totalUsers,
        totalProducts,
        lowStockCount,
        lowStockProducts,
        thisMonthRevenue,
        revenueGrowth,
        thisMonthOrders: thisMonthOrdersCount,
        ordersGrowth,
        newUsersThisMonth,
        usersGrowth,
        ordersByStatus: {
          confirmed: statusMap['confirmed'] ?? 0,
          production: statusMap['production'] ?? 0,
          qc: statusMap['qc'] ?? 0,
          dispatched: statusMap['dispatched'] ?? statusMap['shipped'] ?? 0,
          in_transit: statusMap['in_transit'] ?? 0,
          delivered: statusMap['delivered'] ?? 0,
          cancelled: statusMap['cancelled'] ?? 0,
        },
        recentOrders,
        last7DaysOrders,
        topProducts,
      },
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

