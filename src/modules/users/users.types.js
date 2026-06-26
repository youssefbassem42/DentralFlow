/**
 * @typedef {Object} CreateUserPayload
 * @property {string} name
 * @property {string} email
 * @property {string} password
 * @property {string} [phone]
 * @property {'ADMIN'|'DOCTOR'|'RECEPTIONIST'} role
 * @property {string} [specialization] - For Doctor
 * @property {string} [licenseNumber] - For Doctor
 * @property {string} [shift] - For Receptionist
 */

/**
 * @typedef {Object} UpdateUserPayload
 * @property {string} [name]
 * @property {string} [email]
 * @property {string} [password]
 * @property {string} [phone]
 * @property {'ACTIVE'|'INACTIVE'} [status]
 * @property {string} [specialization] - For Doctor
 * @property {string} [licenseNumber] - For Doctor
 * @property {string} [shift] - For Receptionist
 */
export const Types = {};
