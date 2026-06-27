/**
 * @typedef {Object} CreatePaymentPayload
 * @property {string} patientId
 * @property {number} amount
 * @property {'Cash'|'Visa'|'Insurance'|'Wallet'} paymentMethod
 * @property {string} [invoiceNumber] - optional, auto-generated if not provided
 * @property {string} [notes]
 * @property {string} [paymentDate] - ISO date string
 * @property {string} [doctorId] - optional, doctor to credit
 */
export const Types = {};
