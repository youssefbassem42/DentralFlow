export class PaymentDto {
  constructor(payment) {
    this.id = payment.id;
    this.patientId = payment.patientId;
    this.doctorId = payment.doctorId;
    this.amount = payment.amount ? Number(payment.amount) : 0;
    this.paymentMethod = payment.paymentMethod;
    this.invoiceNumber = payment.invoiceNumber;
    this.notes = payment.notes;
    this.paymentDate = payment.paymentDate;
    this.createdAt = payment.createdAt;
    this.updatedAt = payment.updatedAt;

    if (payment.patient) {
      this.patient = {
        id: payment.patient.id,
        fullName: payment.patient.fullName,
        phone: payment.patient.phone,
      };
    }

    if (payment.doctor && payment.doctor.user) {
      this.doctor = {
        id: payment.doctor.id,
        name: payment.doctor.user.name,
        specialization: payment.doctor.specialization,
      };
    }
  }

  static array(payments) {
    return payments.map((p) => new PaymentDto(p));
  }
}
