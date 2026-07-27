import { PAY_TO_USE_PHONES } from "../config.js";

export function clearInventory(player, Noah) {
  const playerInventory = player.getComponent("inventory").container;
  const inventorySize = playerInventory.size;
  const itemsToKeep = player.getDynamicProperty("ClearWhitelist");

  if (itemsToKeep === undefined) {
    player.sendMessage("§7[§6!§7] §cClearing without a whitelist is not recommended! Please configure one in the settings app. Phones are never cleared but you can add it anyway to disable this message.");
    return;
  }

  const itemsToKeepJSON = JSON.parse(itemsToKeep);

  for (let i = 0; i < inventorySize; i++) {
    const item = playerInventory.getItem(i);
    if (!item) continue;

    const itemName = item.typeId;
    const isPhone = PAY_TO_USE_PHONES.includes(itemName) || itemName === "tfg:admin_pda" || itemName === "tfg:ppda";

    if (!isPhone && !itemsToKeepJSON.includes(itemName)) {
      playerInventory.setItem(i, undefined);
    }
  }

  player.sendMessage("§7[§6!§7] §aCleared inventory!");
  Noah?.sendMessage?.(`§7[§u!§7] §o${player.name} cleared inventory.`);
}