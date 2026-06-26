export class UserDto {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.phone = user.phone;
    this.role = user.role;
    this.status = user.status;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;

    if (user.role === 'DOCTOR' && user.doctor) {
      this.specialization = user.doctor.specialization;
      this.licenseNumber = user.doctor.licenseNumber;
    } else if (user.role === 'RECEPTIONIST' && user.receptionist) {
      this.shift = user.receptionist.shift;
    }
  }

  static array(users) {
    return users.map((user) => new UserDto(user));
  }
}
