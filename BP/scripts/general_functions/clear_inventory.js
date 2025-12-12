import { PAY_TO_USE_PHONES } from "../config.js";

export function clearInventory(player, Noah) {
  const playerInventory = player.getComponent("inventory").container;
  const inventorySize = playerInventory.size;
  const itemsToKeep = player.getDynamicProperty("ClearWhitelist");

  if (itemsToKeep === undefined) {
    player.sendMessage("§a§lWe suggest having at least 1 item to keep! Although all phones are kept during a clear, please specify your phone as an item to keep or set any item as an item to keep to ignore this notification!");
    return;
  }

  const itemsToKeepJSON = JSON.parse(itemsToKeep);

  for (let i = 0; i < inventorySize; i++) {
    const item = playerInventory.getItem(i);
    if (!item) continue;

    const itemName = item.typeId;
    const isPhone = PAY_TO_USE_PHONES.includes(itemName) || itemName === "tfg:admin_pda";

    if (!isPhone && !itemsToKeepJSON.includes(itemName)) {
      playerInventory.setItem(i, undefined);
    }
  }

  player.sendMessage("§l§aCleared inventory!");
  Noah.sendMessage(`§7§o${player.name} cleared inventory.`);
}