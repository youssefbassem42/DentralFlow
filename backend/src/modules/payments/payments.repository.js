import prisma from '../../common/database/prisma.js';

export class PaymentsRepository {
  async findManyAndCount({ page, limit, patientId, doctorId, paymentMethod }) {
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
    };

    if (patientId) {
      where.patientId = patientId;
    }

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: true,
          doctor: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          paymentDate: 'desc',
        },
      }),
      prisma.payment.count({
        where,
      }),
    ]);

    return { payments, total };
  }

  async findById(id) {
    return prisma.payment.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async create(data) {
    return prisma.payment.create({
      data,
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async getRevenueSummary() {
    const totalAgg = await prisma.payment.aggregate({
      where: { deletedAt: null },
      _sum: { amount: true },
    });

    const groups = await prisma.payment.groupBy({
      where: { deletedAt: null },
      by: ['paymentMethod'],
      _sum: { amount: true },
    });

    const totalRevenue = totalAgg._sum.amount ? Number(totalAgg._sum.amount) : 0;

    const breakdown = {
      Cash: 0,
      Visa: 0,
      Insurance: 0,
      Wallet: 0,
    };

    groups.forEach((g) => {
      if (g.paymentMethod in breakdown) {
        breakdown[g.paymentMethod] = g._sum.amount ? Number(g._sum.amount) : 0;
      }
    });

    return {
      totalRevenue,
      breakdown,
    };
  }

  async getPatientFinancialDetails(patientId) {
    const [treatments, payments] = await Promise.all([
      prisma.treatment.findMany({
        where: { patientId, deletedAt: null },
      }),
      prisma.payment.findMany({
        where: { patientId, deletedAt: null },
      }),
    ]);

    const totalInvoiced = treatments.reduce((sum, t) => sum + Number(t.price || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const balance = totalInvoiced - totalPaid;

    return {
      totalInvoiced,
      totalPaid,
      balance,
      treatments,
      payments,
    };
  }
}

export const paymentsRepository = new PaymentsRepository();
