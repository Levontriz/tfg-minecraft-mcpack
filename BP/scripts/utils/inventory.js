import { EntityInventoryComponent, ItemStack, ItemComponentTypes } from "@minecraft/server";

/**
 * Gets all items currently in a player's main inventory and hotbar.
 * @param {import("@minecraft/server").Player} player The player to check.
 * @returns {Array<{typeId: string, amount: number, slot: number}>} A list of items.
 */
export function getPlayerInventoryContents(player) {
  const inventoryComponent = player.getComponent(EntityInventoryComponent.componentId);
  if (!inventoryComponent || !inventoryComponent.container) {
    return [];
  }

  const container = inventoryComponent.container;
  const itemsInInventory = [];
  const inventorySize = container.size;

  for (let i = 0; i < inventorySize; i++) {
    const itemStack = container.getItem(i);
    if (itemStack instanceof ItemStack) {
      itemsInInventory.push({
        typeId: itemStack.typeId,
        amount: itemStack.amount,
        lore: itemStack.getLore(),
        name: itemStack.getComponents(),
        slot: i
      });
    }
  }
  return itemsInInventory;
}
