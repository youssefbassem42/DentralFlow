export class PatientDto {
  constructor(patient) {
    this.id = patient.id;
    this.fullName = patient.fullName;
    this.gender = patient.gender;
    this.dateOfBirth = patient.dateOfBirth;
    this.phone = patient.phone;
    this.email = patient.email;
    this.address = patient.address;
    this.bloodGroup = patient.bloodGroup;
    this.allergies = patient.allergies;
    this.medicalHistory = patient.medicalHistory;
    this.notes = patient.notes;
    this.createdBy = patient.createdBy;
    this.createdAt = patient.createdAt;
    this.updatedAt = patient.updatedAt;

    if (patient.creator) {
      this.creator = {
        id: patient.creator.id,
        name: patient.creator.name,
        role: patient.creator.role,
      };
    }
  }

  static array(patients) {
    return patients.map((patient) => new PatientDto(patient));
  }
}
