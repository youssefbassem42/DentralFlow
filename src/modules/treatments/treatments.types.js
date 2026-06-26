/**
 * @typedef {Object} CreateTreatmentPayload
 * @property {string} patientId
 * @property {string} treatmentPlanId
 * @property {string} treatmentName
 * @property {number} [toothNumber]
 * @property {string} [procedure]
 * @property {number} price
 * @property {string} sessionDate - ISO date string
 * @property {string} [notes]
 * @property {string} [doctorId] - optional if doctor makes the request
 */

/**
 * @typedef {Object} UpdateTreatmentPayload
 * @property {string} [treatmentName]
 * @property {number} [toothNumber]
 * @property {string} [procedure]
 * @property {number} [price]
 * @property {string} [sessionDate]
 * @property {string} [notes]
 */
export const Types = {};
