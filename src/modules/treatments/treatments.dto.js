export class TreatmentDto {
  constructor(treatment) {
    this.id = treatment.id;
    this.patientId = treatment.patientId;
    this.doctorId = treatment.doctorId;
    this.treatmentPlanId = treatment.treatmentPlanId;
    this.treatmentName = treatment.treatmentName;
    this.toothNumber = treatment.toothNumber;
    this.procedure = treatment.procedure;
    this.price = treatment.price ? Number(treatment.price) : 0;
    this.sessionDate = treatment.sessionDate;
    this.notes = treatment.notes;
    this.createdAt = treatment.createdAt;
    this.updatedAt = treatment.updatedAt;

    if (treatment.patient) {
      this.patient = {
        id: treatment.patient.id,
        fullName: treatment.patient.fullName,
        phone: treatment.patient.phone,
      };
    }

    if (treatment.doctor && treatment.doctor.user) {
      this.doctor = {
        id: treatment.doctor.id,
        name: treatment.doctor.user.name,
        specialization: treatment.doctor.specialization,
      };
    }

    if (treatment.treatmentPlan) {
      this.treatmentPlan = {
        id: treatment.treatmentPlan.id,
        title: treatment.treatmentPlan.title,
      };
    }
  }

  static array(treatments) {
    return treatments.map((t) => new TreatmentDto(t));
  }
}
