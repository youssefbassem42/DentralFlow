export class AttachmentDto {
  constructor(attachment) {
    this.id = attachment.id;
    this.doctorId = attachment.doctorId;
    this.patientId = attachment.patientId || null;
    this.fileName = attachment.fileName;
    this.filePath = attachment.filePath;
    this.fileType = attachment.fileType;
    this.notes = attachment.notes;
    this.createdAt = attachment.createdAt;
    this.updatedAt = attachment.updatedAt;

    if (attachment.doctor && attachment.doctor.user) {
      this.doctor = {
        id: attachment.doctor.id,
        name: attachment.doctor.user.name,
        specialization: attachment.doctor.specialization,
      };
    }

    if (attachment.patient) {
      this.patient = {
        id: attachment.patient.id,
        fullName: attachment.patient.fullName,
      };
    }
  }

  static array(attachments) {
    return attachments.map((a) => new AttachmentDto(a));
  }
}
