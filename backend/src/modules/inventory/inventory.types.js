/**
 * @typedef {Object} CreateInventoryItemPayload
 * @property {string} item - name of the item
 * @property {number} quantity - current stock quantity
 * @property {number} minimumQuantity - minimum threshold for low stock alert
 * @property {string} [supplier] - optional supplier name
 * @property {number} price - unit price of the item
 */

/**
 * @typedef {Object} UpdateInventoryItemPayload
 * @property {string} [item]
 * @property {number} [quantity]
 * @property {number} [minimumQuantity]
 * @property {string} [supplier]
 * @property {number} [price]
 */
export const Types = {};
