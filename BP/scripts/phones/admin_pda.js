import { world, EquipmentSlot } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { clearInventory } from "../general_functions/clear_inventory.js";
import { clearInventoryConfig, setHome } from "../general_functions/settings.js";
import { clearAllRightClick } from "../general_functions/clearAllRightClick.js";
import { home } from "../general_functions/home.js";
import { fastTravelUi } from "../general_functions/fast_travel.js";
import { getPlayerInventoryContents } from "../utils/inventory.js";
import { ChestFormData } from '../extensions/forms.js';

function adminUi(player, Noah) {
  let CommandOrder = [];

  const adminUiPanel = new ActionFormData();
  adminUiPanel.title("Admin PDA");
  adminUiPanel.button("Home", "textures/tfg-icons-/t-/4-/default-/t4-default-home");
  CommandOrder.push("Home");
  adminUiPanel.button("Speed", "textures/tfg-icons-/t-/4-/default-/t4-default-speed");
  CommandOrder.push("Speed");
  adminUiPanel.button("Fast Travel", "textures/tfg-icons-/t-/4-/default-/t4-default-fasttravel");
  CommandOrder.push("FastTravel");
  adminUiPanel.button("Bank", "textures/tfg-icons-/t-/4-/default-/t4-default-bank");
  CommandOrder.push("Bank");
  //tpa

  adminUiPanel.button("Clear", "textures/tfg-icons-/t-/4-/default-/t4-default-clear");
  CommandOrder.push("Clear");
  adminUiPanel.button("Server Utility", "textures/tfg-icons-/t-/4-/default-/t4-default-server");
  CommandOrder.push("ServerUtility");
  adminUiPanel.button("Debug Panel", "textures/tfg-icons-/t-/4-/default-/t4-default-debug");
  CommandOrder.push("DebugPanel");


  adminUiPanel.show(player).then((response) => {
    let command = CommandOrder[response.selection];

    if (command == "Speed") {
      player.runCommand("effect @s speed 30 255 true");
      player.sendMessage("§7[§6!§7] §d255x speed for 30 seconds!");
    } else if (command == "ServerUtility") {
      serverUtil(player, Noah);
    } else if (command == "Bank") {
      adminBankUi(player);
    } else if (command == "Home") {
      home(player, Noah);
    } else if (command == "Clear") {
      clearInventory(player, Noah);
    } else if (command == "FastTravel") {
      fastTravelUi(player, Noah, 3)
    } else if (command == "DebugPanel") {
      debugMenu(player);
    }
    return;
  });

}


function serverUtil(player, Noah) {
  let CommandOrder = [];

  const serverUtilPanel = new ActionFormData();
  serverUtilPanel.title = "Server Utility"
  serverUtilPanel.button("Inventory Check");
  CommandOrder.push("InventoryCheck");
  serverUtilPanel.button("Clear Lag");
  CommandOrder.push("ClearLag");
  serverUtilPanel.button("Add lore");
  CommandOrder.push("AddLore");
  serverUtilPanel.button("give Phone Signiture");
  CommandOrder.push("GivePhoneSigniture")
  serverUtilPanel.button("Clear Signatures");
  CommandOrder.push("ClearSignatures");
  serverUtilPanel.button("Clear Config");
  CommandOrder.push("ClearConfig");
  serverUtilPanel.button("Set Home");
  CommandOrder.push("SetHome");
  serverUtilPanel.body("§7Running snakeOS latest-stable");

  serverUtilPanel.show(player).then((response) => {
    let command = CommandOrder[response.selection];
    if (command == "ClearLag") {
      player.runCommand("kill @e[type=item]");
      player.runCommand("kill @e[type=xp_orb]");
      player.runCommand("kill @e[type=arrow]");
      player.runCommand("kill @e[type=wind_charge_projectile]");
      player.runCommand("kill @e[type=area_effect_cloud]");
      player.runCommand("kill @e[type=thrown_trident]");
      player.sendMessage("§7[§6!§7] §aCleared entity clutter!");
    } else if (command == "AddLore") {
      addLore(player);
    } else if (command == "ClearConfig") {
      clearInventoryConfig(player, Noah);
    } else if (command == "SetHome") {
      setHome(player, Noah);
    } else if (command == "GivePhoneSigniture") {
      givePhoneSigniture(player)
    } else if (command == "ClearSignatures") {

      clearAllRightClick(player);

      player.setDynamicProperty("clearSignatures", true)
      player.sendMessage("§7[§6!§7] §aRight click a non-stackable item to wipe signatures!");
    } else if (command == "InventoryCheck") {
      viewPlayerInventory(player);
    }
  });
}


function viewPlayerInventory(player) {
  // Implementation for viewing another player's inventory
  // You'll need a way to target the *other* player, 
  // for simplicity this example checks the sender's own inventory
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

function adminBankUi(player) {
  const bankSelectionUi = new ActionFormData();
  bankSelectionUi.title(`Admin Bank`);
  bankSelectionUi.button("Adjust Player", "textures/tfg-icons-/t-/4-/unused-/t4-unused-transfer")
  bankSelectionUi.button("Admin Logs", "textures/tfg-icons-/t-/4-/unused-/t4-unused-transactions")

  bankSelectionUi.show(player).then((response) => {
    if (response.selection == 0) {
      adminBankAdjustment(player);
    } else if (response.selection == 1) {
      adminBankLogs(player);
    }
  })
}

function adminBankLogs(player) {
  let adminBankLogs = world.getDynamicProperty("adminBankLogs");

  if (adminBankLogs == null) {
    player.sendMessage("§7[§6!§7] §cNo logs found!");
    return;
  }

  let bankLogJSON = JSON.parse(adminBankLogs);

  let logOrderDetails = [];


  const logUi = new ActionFormData();
  logUi.title(`Bank Logs`);
  logUi.body("");

  for (let i = bankLogJSON.length - 1; i >= 0; i--) {
    let gainOrLose = (bankLogJSON[i].amount > 0) ? "§a+" : "§c"
    logUi.button(`§l§6${bankLogJSON[i].reciever} ${gainOrLose}${bankLogJSON[i].amount}`)
  }
  logUi.show(player);
}

function adminBankAdjustment(player) {
  const onlinePlayers = world.getAllPlayers();
  let uiPlayerListAdmin = [ /*{ name: player.name } */];
  const cashDataRaw = world.getDynamicProperty("Cash");
  const playerCash = cashDataRaw[player.name];

  for (let playerList of onlinePlayers) {
    let addToPlayerList = { name: playerList.name };
    uiPlayerListAdmin.push(addToPlayerList);
  }

  const bankUiPanel = new ModalFormData();
  bankUiPanel.title(`Admin Bank`);
  bankUiPanel.body(`Current balance: $${playerCash}`);
  bankUiPanel.dropdown(
    "Player",
    uiPlayerListAdmin.map((player) => player.name)
  );
  bankUiPanel.toggle("Off: Add \nOn: Remove");
  bankUiPanel.textField("Money", "Amount to add/remove");
  bankUiPanel.show(player).then((response) => {
    const [targetPlayerName, onOffToggle, amountInString] = response.formValues;

    const target = world
      .getAllPlayers()
      .find((player) => player.name === uiPlayerListAdmin[targetPlayerName].name);
    var amountInInt = parseInt(amountInString);

    if (isNaN(amountInInt)) {
      player.sendMessage("§7[§6!§7] §cInvalid amount, please enter a whole number!");
      return;
    }

    const currentCashRaw = world.getDynamicProperty("Cash");
    const currentCash = currentCashRaw ? JSON.parse(currentCashRaw) : {};
    const targetCash = currentCash[target.name] ?? 0;

    if (!onOffToggle) {
      currentCash[target.name] = targetCash + amountInInt;
      world.setDynamicProperty("Cash", JSON.stringify(currentCash));
      player.sendMessage(`§7[§6!§7] §aIncreased §7§o${target.name}§r§a's balance by §e$${amountInInt}§a!`);
      player.playSound("note.pling");
      target.sendMessage(`§7[§6!§7] §a§lServer has adjusted your balance by §e+$${amountInInt}§4.`)
      // §6Server has adjusted your balance by §a+§f/§c-§e$100
      target.playSound("note.pling");
      // Since the toggle is off we dont change the "amountInInt" variable
    } else {
      currentCash[target.name] = targetCash - amountInInt;
      world.setDynamicProperty("Cash", JSON.stringify(currentCash));
      player.sendMessage(`§7[§6!§7] §4Decreased §7§o${target.name}§r§4's balance by §e$${amountInInt}§4!`);
      player.playSound("note.pling");
      target.sendMessage(`§7[§6!§7] §a§lServer has adjusted your balance by §e-$${amountInInt}§4.`)
      target.playSound("note.pling");
      // Since the toggle is on we change the "amountInInt" variable to a negative number for easier logging
      amountInInt = -amountInInt;
    }

    let transferTargetBankLogs = target.getDynamicProperty("BankLogs");



    const targetsLog = {
      sender: "Server",
      amount: amountInInt,
      note: "Server Adjustment"
    }



    if (transferTargetBankLogs == undefined) {
      transferTargetBankLogs = [];
      transferTargetBankLogs.push(targetsLog);
      target.setDynamicProperty("BankLogs", JSON.stringify(transferTargetBankLogs));
    } else {
      transferTargetBankLogs = JSON.parse(transferTargetBankLogs);
      transferTargetBankLogs.push(targetsLog);
      target.setDynamicProperty("BankLogs", JSON.stringify(transferTargetBankLogs));
    }

    let adminBankLogs = world.getDynamicProperty("adminBankLogs");

    const sendersLog = {
      reciever: target.name,
      amount: amountInInt,
      note: "Server Adjustment"
    }

    if (adminBankLogs == undefined) {
      adminBankLogs = [];
      adminBankLogs.push(sendersLog);
      world.setDynamicProperty("adminBankLogs", JSON.stringify(adminBankLogs));
    } else {
      adminBankLogs = JSON.parse(adminBankLogs);
      adminBankLogs.push(sendersLog);
      world.setDynamicProperty("adminBankLogs", JSON.stringify(adminBankLogs));
    }
  });
}

function addLore(player) {
  const loreLineCount = [];

  const preLoreAdd = new ActionFormData();
  preLoreAdd.title("Add Lore");
  preLoreAdd.body("How many lines of lore would you like to add?");
  for (let i = 0; i < 20; i++) {
    preLoreAdd.button(`Add ${i + 1} line/s of lore`);
    loreLineCount.push(i + 1);
  }

  preLoreAdd.show(player).then((response) => {
    if (response.canceled) return;
    const loreLineCountNum = loreLineCount[response.selection];
    const loreForm = new ModalFormData();
    loreForm.title("Add Lore");
    for (let i = 0; i < loreLineCountNum; i++) {
      loreForm.textField("Lore", `Lore line ${i + 1}`);
    }

    loreForm.show(player).then((loreResponse) => {
      if (loreResponse.canceled) return;
      const loreToSet = [];
      for (const line of loreResponse.formValues) {
        if (typeof line === "string" && line.trim().length > 0) {
          loreToSet.push(line);
        }
      }

      clearAllRightClick(player);
      player.setDynamicProperty("loreToSet", JSON.stringify(loreToSet));
      player.setDynamicProperty("rightClickSetLore", true);
      player.sendMessage("§7[§6!§7] §aRight click an item to add lore.");
    });
  });
}

function debugMenu(player) {
  const debugPanel = new ActionFormData();
  debugPanel.title("Debug Menu");
  debugPanel.body("What function to run?");
  debugPanel.button("View My Dynamics");
  debugPanel.button("Clear My Dynamics");
  debugPanel.button("Set Incoming to Levontriz");
  debugPanel.button("Set Outgoing to Levontriz");
  debugPanel.button("view World Dynamics");
  debugPanel.button("Clear World Dynamics");

  debugPanel.show(player).then((response) => {
    if (response.selection == 0) {
      for (let id of player.getDynamicPropertyIds()) {
        player.sendMessage(id + ":");
        player.sendMessage(formatDynamicValue(player.getDynamicProperty(id)));
      }
    }
    if (response.selection == 1) {
      for (let id of player.getDynamicPropertyIds()) {
        player.setDynamicProperty(id);
      }
      player.sendMessage("§7[§6!§7] §4Cleared all dynamic properties.")
    }
    if (response.selection == 2) {
      player.setDynamicProperty("IncomingRequest", "[\"Levontriz2197\"]");
      player.sendMessage("§7[§6!§7] §aSent Incoming request to Levontriz2197.")
    }
    if (response.selection == 3) {
      player.setDynamicProperty("OutgoingRequest", "[\"Levontriz2197\", \"Purtzle\"]");
      player.sendMessage("§7[§6!§7] §aSent outgoing request to Levontriz2197.")
    }
    if (response.selection == 4) {
      for (let id of world.getDynamicPropertyIds()) {
        player.sendMessage(id + ":");
        player.sendMessage(formatDynamicValue(world.getDynamicProperty(id)));
      }
    }
    if (response.selection == 5) {
      for (let id of world.getDynamicPropertyIds()) {
        if (id == "Cash") continue;
        world.setDynamicProperty(id);
      }
      player.sendMessage("§7[§6!§7] §4Cleared all dynamic properties from world.")
    }
  });
}

function givePhoneSigniture(player) {
  const onlinePlayers = world.getAllPlayers();
  let uiPlayerListAdmin = [ /*{ name: player.name } */];

  for (let playerList of onlinePlayers) {
    let addToPlayerList = { name: playerList.name };

    uiPlayerListAdmin.push(addToPlayerList);
  }

  const signatureUi = new ModalFormData();
  signatureUi.title(`Register Phone`);
  signatureUi.dropdown(
    "Player",
    uiPlayerListAdmin.map((player) => player.name)
  );

  signatureUi.show(player).then((response) => {
    if (response.formValues === null) return;
    const targetPlayerId = response.formValues;
    clearAllRightClick(player);
    // Give sig on right click
    player.setDynamicProperty("rightClickSignature", true);
    player.setDynamicProperty("playerToSign", uiPlayerListAdmin[targetPlayerId].name);

    player.sendMessage("§7[§6!§7] §aRight click an item to register the signature.")
  })
}

export { adminUi };

function formatDynamicValue(value) {
  if (value === undefined || value === null) return "null";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch (_err) {
    return String(value);
  }
}