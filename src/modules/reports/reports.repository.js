import prisma from '../../common/database/prisma.js';

export class ReportsRepository {
  async getDashboardStats() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Patients
    const [totalPatients, registeredThisMonth] = await Promise.all([
      prisma.patient.count({ where: { deletedAt: null } }),
      prisma.patient.count({
        where: {
          deletedAt: null,
          createdAt: { gte: firstDayOfMonth },
        },
      }),
    ]);

    // Doctors
    const [totalDoctors, activeDoctors] = await Promise.all([
      prisma.doctor.count({ where: { deletedAt: null } }),
      prisma.user.count({
        where: {
          role: 'DOCTOR',
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
    ]);

    // Appointments
    const [totalAppointments, todayAppointments, appointmentGroups] = await Promise.all([
      prisma.appointment.count({ where: { deletedAt: null } }),
      prisma.appointment.count({
        where: {
          deletedAt: null,
          appointmentDate: { gte: startOfToday, lte: endOfToday },
        },
      }),
      prisma.appointment.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { deletedAt: null },
      }),
    ]);

    const appointmentBreakdown = {
      Scheduled: 0,
      Completed: 0,
      Cancelled: 0,
      Missed: 0,
    };

    appointmentGroups.forEach((g) => {
      if (g.status in appointmentBreakdown) {
        appointmentBreakdown[g.status] = g._count.id;
      }
    });

    // Revenue
    const [totalRevenueAgg, monthlyRevenueAgg, paymentMethodGroups] = await Promise.all([
      prisma.payment.aggregate({
        where: { deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          deletedAt: null,
          paymentDate: { gte: firstDayOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        _sum: { amount: true },
        where: { deletedAt: null },
      }),
    ]);

    const totalRevenue = totalRevenueAgg._sum.amount ? Number(totalRevenueAgg._sum.amount) : 0;
    const monthlyRevenue = monthlyRevenueAgg._sum.amount
      ? Number(monthlyRevenueAgg._sum.amount)
      : 0;

    const paymentMethodBreakdown = {
      Cash: 0,
      Visa: 0,
      Insurance: 0,
      Wallet: 0,
    };

    paymentMethodGroups.forEach((g) => {
      if (g.paymentMethod in paymentMethodBreakdown) {
        paymentMethodBreakdown[g.paymentMethod] = g._sum.amount ? Number(g._sum.amount) : 0;
      }
    });

    // Inventory
    const [totalInventoryItems, lowStockRaw] = await Promise.all([
      prisma.inventoryItem.count({ where: { deletedAt: null } }),
      prisma.$queryRaw`
        SELECT COUNT(*)::int as count FROM "InventoryItem"
        WHERE "deletedAt" IS NULL AND quantity <= "minimumQuantity"
      `,
    ]);

    const lowStockCount = lowStockRaw[0]?.count || 0;

    return {
      patients: {
        total: totalPatients,
        registeredThisMonth,
      },
      doctors: {
        total: totalDoctors,
        active: activeDoctors,
      },
      appointments: {
        total: totalAppointments,
        todayCount: todayAppointments,
        statusBreakdown: appointmentBreakdown,
      },
      revenue: {
        total: totalRevenue,
        thisMonth: monthlyRevenue,
        paymentMethodBreakdown,
      },
      inventory: {
        totalItems: totalInventoryItems,
        lowStockCount,
      },
    };
  }

  async getRevenueReport({ startDate, endDate }) {
    const where = {
      deletedAt: null,
    };

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) {
        where.paymentDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.paymentDate.lte = new Date(endDate);
      }
    }

    const [payments, totalRevenueAgg, paymentMethodGroups] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { paymentDate: 'asc' },
      }),
      prisma.payment.aggregate({
        where,
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        _sum: { amount: true },
        where,
      }),
    ]);

    const totalRevenue = totalRevenueAgg._sum.amount ? Number(totalRevenueAgg._sum.amount) : 0;

    const paymentMethodBreakdown = {
      Cash: 0,
      Visa: 0,
      Insurance: 0,
      Wallet: 0,
    };

    paymentMethodGroups.forEach((g) => {
      if (g.paymentMethod in paymentMethodBreakdown) {
        paymentMethodBreakdown[g.paymentMethod] = g._sum.amount ? Number(g._sum.amount) : 0;
      }
    });

    return {
      totalRevenue,
      paymentMethodBreakdown,
      transactionsCount: payments.length,
      payments: payments.map((p) => ({
        id: p.id,
        invoiceNumber: p.invoiceNumber,
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        paymentDate: p.paymentDate,
      })),
    };
  }

  async getInventoryReport() {
    const [totalItems, lowStockItems, totalValueRaw, supplierGroups] = await Promise.all([
      prisma.inventoryItem.findMany({
        where: { deletedAt: null },
        include: { creator: true },
      }),
      prisma.$queryRaw`
        SELECT * FROM "InventoryItem"
        WHERE "deletedAt" IS NULL AND quantity <= "minimumQuantity"
      `,
      prisma.$queryRaw`
        SELECT COALESCE(SUM(quantity * price), 0)::numeric as value FROM "InventoryItem"
        WHERE "deletedAt" IS NULL
      `,
      prisma.inventoryItem.groupBy({
        by: ['supplier'],
        _count: { id: true },
        _sum: { quantity: true },
        where: { deletedAt: null },
      }),
    ]);

    const totalValue = totalValueRaw[0]?.value ? Number(totalValueRaw[0].value) : 0;

    const suppliers = supplierGroups.map((g) => ({
      supplier: g.supplier || 'Unknown Supplier',
      itemsCount: g._count.id,
      totalQuantity: g._sum.quantity || 0,
    }));

    return {
      totalItemsCount: totalItems.length,
      lowStockCount: lowStockItems.length,
      totalWarehouseValue: totalValue,
      suppliersBreakdown: suppliers,
      lowStockItems: lowStockItems.map((i) => ({
        id: i.id,
        item: i.item,
        quantity: i.quantity,
        minimumQuantity: i.minimumQuantity,
        supplier: i.supplier,
        price: Number(i.price),
      })),
      allCatalogItems: totalItems.map((i) => ({
        id: i.id,
        item: i.item,
        quantity: i.quantity,
        minimumQuantity: i.minimumQuantity,
        supplier: i.supplier,
        price: Number(i.price),
        isLowStock: i.quantity <= i.minimumQuantity,
      })),
    };
  }
}

export const reportsRepository = new ReportsRepository();
