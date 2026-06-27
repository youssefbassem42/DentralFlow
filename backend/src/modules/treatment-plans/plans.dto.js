export class TreatmentPlanDto {
  constructor(plan) {
    this.id = plan.id;
    this.patientId = plan.patientId;
    this.doctorId = plan.doctorId;
    this.title = plan.title;
    this.description = plan.description;
    this.estimatedCost = plan.estimatedCost ? Number(plan.estimatedCost) : 0;
    this.estimatedSessions = plan.estimatedSessions;
    this.status = plan.status;
    this.createdAt = plan.createdAt;
    this.updatedAt = plan.updatedAt;

    if (plan.patient) {
      this.patient = {
        id: plan.patient.id,
        fullName: plan.patient.fullName,
        phone: plan.patient.phone,
      };
    }

    if (plan.doctor && plan.doctor.user) {
      this.doctor = {
        id: plan.doctor.id,
        name: plan.doctor.user.name,
        specialization: plan.doctor.specialization,
      };
    }
  }

  static array(plans) {
    return plans.map((plan) => new TreatmentPlanDto(plan));
  }
}
