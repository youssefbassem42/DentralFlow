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

    // Calculate balance
    if (patient.treatments && patient.payments) {
      const totalInvoiced = patient.treatments.reduce((sum, t) => sum + Number(t.price || 0), 0);
      const totalPaid = patient.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      this.balance = Number((totalInvoiced - totalPaid).toFixed(2));
    } else {
      this.balance = 0;
    }

    // Calculate lastVisit
    this.lastVisit = null;
    if (patient.appointments) {
      const now = new Date();
      const pastDates = [];
      
      patient.appointments.forEach(a => {
        if (new Date(a.appointmentDate) <= now) {
          pastDates.push(new Date(a.appointmentDate));
        }
      });
      
      if (patient.treatments) {
        patient.treatments.forEach(t => {
          if (new Date(t.sessionDate) <= now) {
            pastDates.push(new Date(t.sessionDate));
          }
        });
      }
      
      if (pastDates.length > 0) {
        this.lastVisit = new Date(Math.max(...pastDates.map(d => d.getTime()))).toISOString();
      }
    }

    // Calculate nextAppointment
    this.nextAppointment = null;
    if (patient.appointments) {
      const now = new Date();
      const futureAppts = patient.appointments.filter(
        a => new Date(a.appointmentDate) > now && a.status === 'Scheduled'
      );
      if (futureAppts.length > 0) {
        futureAppts.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
        this.nextAppointment = {
          date: futureAppts[0].appointmentDate,
          reason: futureAppts[0].reason || futureAppts[0].notes || 'Dental Session',
        };
      }
    }

    // Calculate status
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    let hasRecentActivity = new Date(patient.createdAt) >= sixMonthsAgo;
    
    if (!hasRecentActivity && patient.appointments) {
      hasRecentActivity = patient.appointments.some(
        a => new Date(a.appointmentDate) >= sixMonthsAgo
      );
    }
    this.status = hasRecentActivity ? 'Active' : 'Inactive';
  }

  static array(patients) {
    return patients.map((patient) => new PatientDto(patient));
  }
}
