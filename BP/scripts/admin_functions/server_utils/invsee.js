import { ChestFormData } from '../../extensions/forms.js';
import { getPlayerInventoryContents } from "../../utils/inventory.js";
import { world, EquipmentSlot } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

function viewPlayerInventory(player) {
  const selectPlayerMenu = new ActionFormData();
  selectPlayerMenu.title("Select Player");
  const onlinePlayers = world.getAllPlayers();
  const playerNames = onlinePlayers.map(p => p.name);
  for (const name of playerNames) {
    selectPlayerMenu.button(name);
  }
  selectPlayerMenu.show(player).then((response) => {
    if (response.canceled) return;
    const targetPlayer = onlinePlayers[response.selection];
    displayInventoryContents(player, targetPlayer, null);
  });
}

function displayInventoryContents(commandPlayer, targetPlayer, moveSlot) {
  const inventory = getPlayerInventoryContents(targetPlayer);
  if (moveSlot !== null) {
    // find an empty slot in commandPlayer's inventory
    const commandPlayerInventory = commandPlayer.getComponent("inventory").container;
    const commandPlayerSize = commandPlayerInventory.size;
    let emptySlot = null;
    for (let i = 0; i < commandPlayerSize; i++) {
      if (!commandPlayerInventory.getItem(i)) {
        emptySlot = i;
        break;
      }
    }
    if (emptySlot === null) {
      commandPlayer.sendMessage("§7[§6!§7] §cCould not take item, Your inventory is full!");
      displayInventoryContents(commandPlayer, targetPlayer, null);
      return;
    }

    // Handle armor/offhand slots specially
    const equippable = targetPlayer.getComponent("equippable");
    const specialSlots = {
      45: EquipmentSlot.Head,
      46: EquipmentSlot.Chest,
      47: EquipmentSlot.Legs,
      48: EquipmentSlot.Feet,
      49: EquipmentSlot.Offhand
    };

    if (equippable && (moveSlot in specialSlots)) {
      const equipSlot = specialSlots[moveSlot];
      const equippedItem = equippable.getEquipment(equipSlot);

      if (!equippedItem) {
        commandPlayer.sendMessage("§7[§6!§7] §cArmor slot is empty!");
        displayInventoryContents(commandPlayer, targetPlayer, null);
        return;
      }

      equippable.setEquipment(equipSlot, undefined);
      commandPlayerInventory.setItem(emptySlot, equippedItem);
      displayInventoryContents(commandPlayer, targetPlayer, null);
      return;
    }

    // Handle cursor slot via player cursor inventory component
    if (moveSlot === 53) {
      const cursorComp = targetPlayer.getComponent("minecraft:cursor_inventory");

      if (!cursorComp || !cursorComp.item) {
        commandPlayer.sendMessage("§7[§6!§7] §cCursor slot is empty!");
        displayInventoryContents(commandPlayer, targetPlayer, null);
        return;
      }

      const cursorItem = cursorComp.item;
      cursorComp.clear();
      commandPlayerInventory.setItem(emptySlot, cursorItem);
      displayInventoryContents(commandPlayer, targetPlayer, null);
      return;
    }

    // move a regular inventory item
    const targetInventory = targetPlayer.getComponent("inventory").container;
    const itemStack = targetInventory.getItem(moveSlot);

    if (itemStack) {
      targetInventory.setItem(moveSlot, undefined);
      commandPlayerInventory.setItem(emptySlot, itemStack);
      displayInventoryContents(commandPlayer, targetPlayer, null);
    } else {
      commandPlayer.sendMessage("§7[§6!§7] §cInventory slot is empty!");
      displayInventoryContents(commandPlayer, targetPlayer, null);
    }
    return;
  }

  if (inventory.length === 0) {
    commandPlayer.sendMessage(`§7[§6!§7] ${targetPlayer.name}'s inventory is empty!`);
  }

  const chestForm = new ChestFormData('large');
  chestForm.title(`${targetPlayer.name} Inventory`);
  for (const item of inventory) {
    const itemName = item.typeId
      .split(":")[1]
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.substring(1))
      .join(" ");

    chestForm.button(item.slot, itemName, item.lore, item.typeId);
  }

  // Show armor and offhand items in the bottom row
  const equippable = targetPlayer.getComponent("equippable");
  if (equippable) {
    const armorSlots = [
      { uiSlot: 45, equipSlot: EquipmentSlot.Head, displayName: "Helmet Slot", icon: "tfg:head_icon" },
      { uiSlot: 46, equipSlot: EquipmentSlot.Chest, displayName: "Chestplate Slot", icon: "tfg:body_icon" },
      { uiSlot: 47, equipSlot: EquipmentSlot.Legs, displayName: "Leggings Slot", icon: "tfg:legs_icon" },
      { uiSlot: 48, equipSlot: EquipmentSlot.Feet, displayName: "Boots Slot", icon: "tfg:feet_icon" },
      { uiSlot: 49, equipSlot: EquipmentSlot.Offhand, displayName: "Offhand Slot", icon: "tfg:offhand_icon" }
    ];

    for (const { uiSlot, equipSlot, displayName, icon } of armorSlots) {
      const equippedItem = equippable.getEquipment(equipSlot);

      if (equippedItem) {
        const typeId = equippedItem.typeId;
        const itemName = typeId
          .split(":")[1]
          .split("_")
          .map(word => word.charAt(0).toUpperCase() + word.substring(1))
          .join(" ");

        chestForm.button(uiSlot, itemName, equippedItem.getLore(), typeId);
      } else {
        chestForm.button(uiSlot, displayName, "", icon);
      }
    }
  } else {
    // Fallback: show empty armor/offhand slots
    chestForm.button(45, "Helmet Slot", "", "tfg:head_icon");
    chestForm.button(46, "Chestplate Slot", "", "tfg:body_icon");
    chestForm.button(47, "Leggings Slot", "", "tfg:legs_icon");
    chestForm.button(48, "Boots Slot", "", "tfg:feet_icon");
    chestForm.button(49, "Offhand Slot", "", "tfg:offhand_icon");
  }

  // Cursor slot - show item from player cursor inventory if present
  const cursorComp = targetPlayer.getComponent("minecraft:cursor_inventory");
  if (cursorComp && cursorComp.item) {
    const cursorTypeId = cursorComp.item.typeId;
    const cursorName = cursorTypeId
      .split(":")[1]
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.substring(1))
      .join(" ");

    chestForm.button(53, cursorName, cursorComp.item.getLore(), cursorTypeId);
  } else {
    chestForm.button(53, "Cursor Slot", "", "tfg:cursor_icon");
  }

  chestForm.show(commandPlayer).then((response) => {
    if (response.canceled) return;

    // Ignore clicks on the viewer's own inventory section
    if (response.inventorySlot !== null && response.inventorySlot !== undefined) {
      commandPlayer.sendMessage("§7[§6!§7] §cCannot take items from this inventory.");
      displayInventoryContents(commandPlayer, targetPlayer, null);
      return;
    }

    const selectedSlot = response.selection;
    const allowedSpecialSlots = [45, 46, 47, 48, 49, 53];

    if (selectedSlot > 35 && !allowedSpecialSlots.includes(selectedSlot)) {
      commandPlayer.sendMessage("§7[§6!§7] §cCannot take items from this slot.");
      displayInventoryContents(commandPlayer, targetPlayer, null);
      return;
    }

    commandPlayer.sendMessage(`§7[§6!§7] §aTaken slot ${selectedSlot} from ${targetPlayer.name}'s inventory.`);
    displayInventoryContents(commandPlayer, targetPlayer, selectedSlot);
  });

}

export { viewPlayerInventory };