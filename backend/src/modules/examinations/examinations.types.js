/**
 * @typedef {Object} CreateExaminationPayload
 * @property {string} patientId
 * @property {string} chiefComplaint
 * @property {string} diagnosis
 * @property {string} [clinicalNotes]
 * @property {string} [radiologyNotes]
 * @property {string} [prescription]
 * @property {string} [recommendations]
 * @property {string} [examDate] - ISO date string
 */

/**
 * @typedef {Object} UpdateExaminationPayload
 * @property {string} [chiefComplaint]
 * @property {string} [diagnosis]
 * @property {string} [clinicalNotes]
 * @property {string} [radiologyNotes]
 * @property {string} [prescription]
 * @property {string} [recommendations]
 * @property {string} [examDate]
 */
export const Types = {};
