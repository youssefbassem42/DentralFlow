import { patientsRepository } from './patients.repository.js';
import prisma from '../../common/database/prisma.js';
import { NotFoundError, ConflictError } from '../../common/errors/AppError.js';
import { PatientDto } from './patients.dto.js';

export class PatientsService {
  async getPatients(query) {
    const { page, limit, search, gender, bloodGroup } = query;

    const { patients, total } = await patientsRepository.findManyAndCount({
      page,
      limit,
      search,
      gender,
      bloodGroup,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      patients: PatientDto.array(patients),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getPatientById(id) {
    const patient = await patientsRepository.findById(id);
    if (!patient) {
      throw new NotFoundError('Patient not found.');
    }
    return new PatientDto(patient);
  }

  async getPatientProfile(id) {
    const patient = await prisma.patient.findFirst({
      where: { id, deletedAt: null },
      include: {
        creator: { select: { id: true, name: true, role: true } },
        appointments: {
          where: { deletedAt: null },
          include: {
            doctor: { include: { user: { select: { name: true } } } },
          },
          orderBy: { appointmentDate: 'desc' },
        },
        examinations: {
          where: { deletedAt: null },
          include: {
            doctor: { include: { user: { select: { name: true } } } },
          },
          orderBy: { examDate: 'desc' },
        },
        treatmentPlans: {
          where: { deletedAt: null },
          include: {
            doctor: { include: { user: { select: { name: true } } } },
            treatments: {
              where: { deletedAt: null },
              orderBy: { sessionDate: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        treatments: {
          where: { deletedAt: null },
          include: {
            doctor: { include: { user: { select: { name: true } } } },
            treatmentPlan: { select: { id: true, title: true } },
          },
          orderBy: { sessionDate: 'desc' },
        },
        payments: {
          where: { deletedAt: null },
          include: {
            doctor: { include: { user: { select: { name: true } } } },
          },
          orderBy: { paymentDate: 'desc' },
        },
        attachments: {
          where: { deletedAt: null },
          include: {
            doctor: { include: { user: { select: { name: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      throw new NotFoundError('Patient not found.');
    }

    // Calculate balance
    const totalTreatmentsCost = patient.treatments.reduce(
      (sum, t) => sum + Number(t.price),
      0
    );
    const totalPayments = patient.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const balance = totalTreatmentsCost - totalPayments;

    // Last visit
    const completedAppointments = patient.appointments
      .filter((a) => a.status === 'Completed')
      .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
    const lastVisit = completedAppointments.length > 0 ? completedAppointments[0].appointmentDate : null;

    // Next appointment
    const now = new Date();
    const futureAppointments = patient.appointments
      .filter((a) => a.status === 'Scheduled' && new Date(a.appointmentDate) >= now)
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
    const nextAppointment = futureAppointments.length > 0
      ? { date: futureAppointments[0].appointmentDate, reason: futureAppointments[0].reason }
      : null;

    // Status
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const hasRecentActivity = patient.appointments.some(
      (a) => new Date(a.appointmentDate) >= sixMonthsAgo
    ) || patient.treatments.some(
      (t) => new Date(t.sessionDate) >= sixMonthsAgo
    );
    const status = hasRecentActivity || futureAppointments.length > 0 ? 'Active' : 'Inactive';

    return {
      id: patient.id,
      fullName: patient.fullName,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,
      medicalHistory: patient.medicalHistory,
      notes: patient.notes,
      createdBy: patient.createdBy,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      creator: patient.creator,
      balance,
      lastVisit,
      nextAppointment,
      status,
      appointments: patient.appointments.map((a) => ({
        id: a.id,
        doctorId: a.doctorId,
        doctorName: a.doctor?.user?.name || 'N/A',
        appointmentDate: a.appointmentDate,
        appointmentTime: a.appointmentTime,
        status: a.status,
        reason: a.reason,
        notes: a.notes,
      })),
      examinations: patient.examinations.map((e) => ({
        id: e.id,
        doctorName: e.doctor?.user?.name || 'N/A',
        chiefComplaint: e.chiefComplaint,
        diagnosis: e.diagnosis,
        clinicalNotes: e.clinicalNotes,
        prescription: e.prescription,
        recommendations: e.recommendations,
        examDate: e.examDate,
      })),
      treatmentPlans: patient.treatmentPlans.map((tp) => ({
        id: tp.id,
        doctorName: tp.doctor?.user?.name || 'N/A',
        title: tp.title,
        description: tp.description,
        estimatedCost: Number(tp.estimatedCost),
        estimatedSessions: tp.estimatedSessions,
        completedSessions: tp.treatments.length,
        status: tp.status,
        createdAt: tp.createdAt,
      })),
      treatments: patient.treatments.map((t) => ({
        id: t.id,
        doctorName: t.doctor?.user?.name || 'N/A',
        treatmentPlan: t.treatmentPlan
          ? { id: t.treatmentPlan.id, title: t.treatmentPlan.title }
          : null,
        treatmentName: t.treatmentName,
        toothNumber: t.toothNumber,
        procedure: t.procedure,
        price: Number(t.price),
        sessionDate: t.sessionDate,
        notes: t.notes,
      })),
      payments: patient.payments.map((p) => ({
        id: p.id,
        doctorName: p.doctor?.user?.name || 'N/A',
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        invoiceNumber: p.invoiceNumber,
        notes: p.notes,
        paymentDate: p.paymentDate,
      })),
      attachments: patient.attachments.map((a) => ({
        id: a.id,
        doctorName: a.doctor?.user?.name || 'N/A',
        fileName: a.fileName,
        filePath: a.filePath,
        fileType: a.fileType,
        notes: a.notes,
        createdAt: a.createdAt,
      })),
    };
  }

  async registerPatient(payload, creatorId) {
    // Check if duplicate patient phone exists
    const existing = await patientsRepository.findByPhone(payload.phone);
    if (existing) {
      throw new ConflictError('A patient with this phone number is already registered.');
    }

    const patient = await patientsRepository.create({
      ...payload,
      createdBy: creatorId,
    });

    return new PatientDto(patient);
  }

  async updatePatient(id, payload) {
    const patient = await patientsRepository.findById(id);
    if (!patient) {
      throw new NotFoundError('Patient not found.');
    }

    if (payload.phone && payload.phone !== patient.phone) {
      const existing = await patientsRepository.findByPhone(payload.phone);
      if (existing) {
        throw new ConflictError('A patient with this phone number is already registered.');
      }
    }

    const updated = await patientsRepository.update(id, payload);
    return new PatientDto(updated);
  }

  async deletePatient(id) {
    const patient = await patientsRepository.findById(id);
    if (!patient) {
      throw new NotFoundError('Patient not found.');
    }

    await patientsRepository.softDelete(id);
    return { id, message: 'Patient profile deleted successfully.' };
  }
}

export const patientsService = new PatientsService();

