import { patientsRepository } from './patients.repository.js';
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
