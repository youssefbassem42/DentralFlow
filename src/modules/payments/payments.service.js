import { paymentsRepository } from './payments.repository.js';
import prisma from '../../common/database/prisma.js';
import { NotFoundError, BadRequestError } from '../../common/errors/AppError.js';
import { PaymentDto } from './payments.dto.js';
import { TreatmentDto } from '../treatments/treatments.dto.js';

export class PaymentsService {
  async getPayments(query) {
    const { page, limit, patientId, doctorId, paymentMethod } = query;

    const { payments, total } = await paymentsRepository.findManyAndCount({
      page,
      limit,
      patientId,
      doctorId,
      paymentMethod,
    });

    const totalPages = Math.ceil(total / limit);
    const summary = await paymentsRepository.getRevenueSummary();

    return {
      payments: PaymentDto.array(payments),
      summary,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async createPayment(payload) {
    const { patientId, doctorId, amount, paymentMethod, notes, paymentDate } = payload;
    let { invoiceNumber } = payload;

    // Verify Patient exists
    const patientExists = await prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
    });
    if (!patientExists) {
      throw new NotFoundError('Patient not found.');
    }

    // Verify Doctor exists
    const doctorExists = await prisma.doctor.findFirst({
      where: { id: doctorId, deletedAt: null },
    });
    if (!doctorExists) {
      throw new NotFoundError('Doctor not found.');
    }

    // Validate or generate unique invoice number
    if (invoiceNumber) {
      const existing = await prisma.payment.findUnique({
        where: { invoiceNumber },
      });
      if (existing) {
        throw new BadRequestError(`Invoice number '${invoiceNumber}' is already in use.`);
      }
    } else {
      let isUnique = false;
      while (!isUnique) {
        invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const existing = await prisma.payment.findUnique({
          where: { invoiceNumber },
        });
        if (!existing) {
          isUnique = true;
        }
      }
    }

    const payment = await paymentsRepository.create({
      patientId,
      doctorId,
      amount,
      paymentMethod,
      invoiceNumber,
      notes,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    });

    return new PaymentDto(payment);
  }

  async getPatientFinancial(patientId) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
    });
    if (!patient) {
      throw new NotFoundError('Patient not found.');
    }

    const { totalInvoiced, totalPaid, balance, treatments, payments } =
      await paymentsRepository.getPatientFinancialDetails(patientId);

    return {
      patientId,
      totalInvoiced,
      totalPaid,
      balance,
      payments: PaymentDto.array(payments),
      treatments: TreatmentDto.array(treatments),
    };
  }
}

export const paymentsService = new PaymentsService();
