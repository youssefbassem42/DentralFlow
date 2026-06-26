export class AuthResponseDto {
  constructor(user, token) {
    this.token = token;
    this.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }
}
