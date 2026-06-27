export class AppointmentDto {
  constructor(appt) {
    this.id = appt.id;
    this.patientId = appt.patientId;
    this.doctorId = appt.doctorId;
    this.appointmentDate = appt.appointmentDate;
    this.appointmentTime = appt.appointmentTime;
    this.status = appt.status;
    this.reason = appt.reason;
    this.notes = appt.notes;
    this.createdBy = appt.createdBy;
    this.createdAt = appt.createdAt;
    this.updatedAt = appt.updatedAt;

    if (appt.patient) {
      this.patient = {
        id: appt.patient.id,
        fullName: appt.patient.fullName,
        phone: appt.patient.phone,
      };
    }

    if (appt.doctor && appt.doctor.user) {
      this.doctor = {
        id: appt.doctor.id,
        name: appt.doctor.user.name,
        specialization: appt.doctor.specialization,
      };
    }

    if (appt.creator) {
      this.creator = {
        id: appt.creator.id,
        name: appt.creator.name,
        role: appt.creator.role,
      };
    }
  }

  static array(appts) {
    return appts.map((appt) => new AppointmentDto(appt));
  }
}
