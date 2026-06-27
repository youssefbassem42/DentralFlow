import { z } from 'zod';

export const createInventoryItemSchema = z.object({
  item: z.string().min(1, 'Item name is required'),
  quantity: z.coerce.number().int().nonnegative('Quantity cannot be negative'),
  minimumQuantity: z.coerce.number().int().nonnegative('Minimum quantity cannot be negative'),
  supplier: z.string().optional().nullable(),
  price: z.coerce.number().positive('Price must be greater than zero'),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();

export const queryInventorySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
  lowStock: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
});

export const inventoryValidators = {
  createInventoryItem: {
    body: createInventoryItemSchema,
  },
  updateInventoryItem: {
    body: updateInventoryItemSchema,
    params: z.object({
      id: z.string().uuid('Invalid inventory item ID format'),
    }),
  },
  queryInventory: {
    query: queryInventorySchema,
  },
  getInventoryItem: {
    params: z.object({
      id: z.string().uuid('Invalid inventory item ID format'),
    }),
  },
};
