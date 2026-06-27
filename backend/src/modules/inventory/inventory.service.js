import { inventoryRepository } from './inventory.repository.js';
import { NotFoundError } from '../../common/errors/AppError.js';
import { InventoryItemDto } from './inventory.dto.js';

export class InventoryService {
  async getInventory(query) {
    const { page, limit, search, lowStock } = query;

    const { items, total } = await inventoryRepository.findManyAndCount({
      page,
      limit,
      search,
      lowStock,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      items: InventoryItemDto.array(items),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getInventoryItemById(id) {
    const item = await inventoryRepository.findById(id);
    if (!item) {
      throw new NotFoundError('Inventory item not found.');
    }
    return new InventoryItemDto(item);
  }

  async createInventoryItem(payload, creatorId) {
    const data = {
      ...payload,
      createdBy: creatorId,
    };
    const item = await inventoryRepository.create(data);
    return new InventoryItemDto(item);
  }

  async updateInventoryItem(id, payload) {
    const existing = await inventoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Inventory item not found.');
    }
    const item = await inventoryRepository.update(id, payload);
    return new InventoryItemDto(item);
  }

  async deleteInventoryItem(id) {
    const existing = await inventoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Inventory item not found.');
    }
    await inventoryRepository.delete(id);
  }
}

export const inventoryService = new InventoryService();
