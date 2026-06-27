import { examinationsRepository } from './examinations.repository.js';
import prisma from '../../common/database/prisma.js';
import { NotFoundError, BadRequestError } from '../../common/errors/AppError.js';
import { ExaminationDto } from './examinations.dto.js';

export class ExaminationsService {
  async getExaminations(query) {
    const { page, limit, patientId, doctorId } = query;

    const { exams, total } = await examinationsRepository.findManyAndCount({
      page,
      limit,
      patientId,
      doctorId,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      examinations: ExaminationDto.array(exams),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getExaminationById(id) {
    const exam = await examinationsRepository.findById(id);
    if (!exam) {
      throw new NotFoundError('Medical examination record not found.');
    }
    return new ExaminationDto(exam);
  }

  async createExamination(payload, user) {
    const {
      patientId,
      chiefComplaint,
      diagnosis,
      clinicalNotes,
      radiologyNotes,
      prescription,
      recommendations,
      examDate,
    } = payload;

    let doctorId = payload.doctorId;

    // If request user is DOCTOR, force doctorId to be their own ID
    if (user.role === 'DOCTOR') {
      doctorId = user.id;
    } else if (user.role === 'ADMIN') {
      if (!doctorId) {
        // Check if admin also has a Doctor record
        const docRecord = await prisma.doctor.findUnique({ where: { id: user.id } });
        if (docRecord) {
          doctorId = user.id;
        } else {
          throw new BadRequestError(
            'Admin must specify a doctorId in the payload to record an examination.'
          );
        }
      }
    }

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

    const exam = await examinationsRepository.create({
      patientId,
      doctorId,
      chiefComplaint,
      diagnosis,
      clinicalNotes,
      radiologyNotes,
      prescription,
      recommendations,
      examDate: examDate ? new Date(examDate) : new Date(),
    });

    return new ExaminationDto(exam);
  }

  async updateExamination(id, payload) {
    const exam = await examinationsRepository.findById(id);
    if (!exam) {
      throw new NotFoundError('Medical examination record not found.');
    }

    const updated = await examinationsRepository.update(id, payload);
    return new ExaminationDto(updated);
  }
}

export const examinationsService = new ExaminationsService();
