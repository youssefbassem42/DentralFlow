/**
 * @typedef {Object} CreateAppointmentPayload
 * @property {string} patientId
 * @property {string} doctorId
 * @property {string} appointmentDate - ISO date string
 * @property {string} appointmentTime - string format like "09:30"
 * @property {string} [reason]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} UpdateAppointmentPayload
 * @property {string} [patientId]
 * @property {string} [doctorId]
 * @property {string} [appointmentDate]
 * @property {string} [appointmentTime]
 * @property {'Scheduled'|'Completed'|'Cancelled'|'NoShow'} [status]
 * @property {string} [reason]
 * @property {string} [notes]
 */
export const Types = {};
