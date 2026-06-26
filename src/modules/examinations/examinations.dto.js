export class ExaminationDto {
  constructor(exam) {
    this.id = exam.id;
    this.patientId = exam.patientId;
    this.doctorId = exam.doctorId;
    this.chiefComplaint = exam.chiefComplaint;
    this.diagnosis = exam.diagnosis;
    this.clinicalNotes = exam.clinicalNotes;
    this.radiologyNotes = exam.radiologyNotes;
    this.prescription = exam.prescription;
    this.recommendations = exam.recommendations;
    this.examDate = exam.examDate;
    this.createdAt = exam.createdAt;
    this.updatedAt = exam.updatedAt;

    if (exam.patient) {
      this.patient = {
        id: exam.patient.id,
        fullName: exam.patient.fullName,
        phone: exam.patient.phone,
      };
    }

    if (exam.doctor && exam.doctor.user) {
      this.doctor = {
        id: exam.doctor.id,
        name: exam.doctor.user.name,
        specialization: exam.doctor.specialization,
      };
    }
  }

  static array(exams) {
    return exams.map((exam) => new ExaminationDto(exam));
  }
}
