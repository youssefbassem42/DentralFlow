/**
 * @typedef {Object} CreateTreatmentPlanPayload
 * @property {string} patientId
 * @property {string} title
 * @property {string} [description]
 * @property {number} estimatedCost
 * @property {number} estimatedSessions
 * @property {string} [doctorId] - optional if doctor makes the request
 */

/**
 * @typedef {Object} UpdateTreatmentPlanPayload
 * @property {string} [title]
 * @property {string} [description]
 * @property {number} [estimatedCost]
 * @property {number} [estimatedSessions]
 * @property {'Pending'|'InProgress'|'Completed'|'Cancelled'} [status]
 */
export const Types = {};
