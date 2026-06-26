export class InventoryItemDto {
  constructor(item) {
    this.id = item.id;
    this.item = item.item;
    this.quantity = item.quantity;
    this.minimumQuantity = item.minimumQuantity;
    this.supplier = item.supplier;
    this.price = item.price ? Number(item.price) : 0;
    this.isLowStock = item.quantity <= item.minimumQuantity;
    this.lastUpdated = item.lastUpdated;
    this.createdBy = item.createdBy;
    this.createdAt = item.createdAt;
    this.updatedAt = item.updatedAt;

    if (item.creator) {
      this.creator = {
        id: item.creator.id,
        name: item.creator.name,
        email: item.creator.email,
      };
    }
  }

  static array(items) {
    return items.map((i) => new InventoryItemDto(i));
  }
}
