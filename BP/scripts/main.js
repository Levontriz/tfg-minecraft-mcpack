import { system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { adminUi } from "./phones/admin_pda.js";
import { clearAllRightClick } from "./general_functions/clearAllRightClick.js";
import { home } from "./general_functions/home.js";
import { settingsMenu } from "./general_functions/settings.js";
import { bankUi } from "./general_functions/bank_ui.js";
import { fastTravelUi } from "./general_functions/fast_travel.js";
import { clearInventory } from "./general_functions/clear_inventory.js";
import { VERSION, PAYDAY_DEFAULTS, PAY_TO_USE_PHONES, PHONE_LEVELS, ADMINS, NOTIFY_ADMIN, WorldDyanmicPropertiesKey, PlayerDynamicPropertiesKey, ItemDynamicPropertiesKey } from "./config.js";
import { ParticleEffectsLibrary, ParticleEffectSequenceController, ParticleEffectSequence, CircleEffect, ParticleTypes, SphereEffect } from "./extensions/particles.js";
import { rightClickEvent } from "./phones/prison_pda.js";
import { tpaScreen } from "./general_functions/tpa.js";
import { startPaydayInterval } from "./general_functions/payday.js"

function ensureObjective(objectiveId) {
  if (!world.scoreboard.getObjective(objectiveId)) {
    try {
      world.scoreboard.addObjective(objectiveId, objectiveId);
    } catch (error) {
      // If another script already created it, keep going.
    }
  }
}

function getObjectiveScore(objectiveId, player) {
  const objective = world.scoreboard.getObjective(objectiveId);
  if (!objective) {
    return undefined;
  }

  try {
    return objective.getScore(player);
  } catch (error) {
    return undefined;
  }
}

world.afterEvents.worldLoad.subscribe((event) => {
    console.warn("World has successfully loaded!");
    ensureObjective("homeX");
    ensureObjective("homeY");
    ensureObjective("homeZ");

    // Check if world already has PayDayDefault and IntervalDefault set, if not set them to the default values inside config.js
    if (world.getDynamicProperty(WorldDyanmicPropertiesKey.PAYDAY_AMOUNT) === undefined) {
      world.setDynamicProperty(WorldDyanmicPropertiesKey.PAYDAY_AMOUNT, PAYDAY_DEFAULTS.amount);
    }
    if (world.getDynamicProperty(WorldDyanmicPropertiesKey.PAYDAY_INTERVAL) === undefined) {
      world.setDynamicProperty(WorldDyanmicPropertiesKey.PAYDAY_INTERVAL, PAYDAY_DEFAULTS.interval);
    }
    if (world.getDynamicProperty(WorldDyanmicPropertiesKey.PAYDAY_ENABLED) === undefined) {
      world.setDynamicProperty(WorldDyanmicPropertiesKey.PAYDAY_ENABLED, PAYDAY_DEFAULTS.enabled);
    } 

    

    console.warn("Checking pack version in world.");
    if (VERSION !== world.getDynamicProperty(WorldDyanmicPropertiesKey.PACK_VERSION)) {
        console.warn(`Pack version mismatch! Current: ${VERSION}, World: ${world.getDynamicProperty(WorldDyanmicPropertiesKey.PACK_VERSION)}`);
        world.setDynamicProperty(WorldDyanmicPropertiesKey.PACK_VERSION, VERSION);
    } else {
        console.warn(`Pack version matches! Current: ${VERSION}, World: ${world.getDynamicProperty(WorldDyanmicPropertiesKey.PACK_VERSION)}`);
    }

    startPaydayInterval();
});


world.afterEvents.playerSpawn.subscribe((eventData) => {
  const { initialSpawn, player } = eventData;
  // If "Cash" doesn't exist in world dynamics add it
  if (!world.getDynamicProperty(WorldDyanmicPropertiesKey.CASH)) {
    world.setDynamicProperty(WorldDyanmicPropertiesKey.CASH, "{}");
  }
  try {
    var playerCash = world.scoreboard.getObjective("CashV2").getScore(player);
  } catch (error) {
    console.warn("Error occurred while fetching player cash:", error);
    console.warn("Most likely intended as this just moves CashV2 over to the dynamic property 'Cash' and removes the scoreboard objective.");
  }

  var cashDataRaw = world.getDynamicProperty(WorldDyanmicPropertiesKey.CASH);
  var cashData = cashDataRaw ? JSON.parse(cashDataRaw) : {};
  if (playerCash || playerCash === 0) {
    cashData[player.name] = playerCash;
    world.setDynamicProperty(WorldDyanmicPropertiesKey.CASH, JSON.stringify(cashData));
    //remove cashv2 objective from player
    world.scoreboard.getObjective("CashV2").removeParticipant(player);
  } else {
    // If the player doesn't have a cash score, ensure they have an entry in the dynamic property
    if (!cashData[player.name]) {
      cashData[player.name] = 0;
      world.setDynamicProperty(WorldDyanmicPropertiesKey.CASH, JSON.stringify(cashData));
    }
  }
  if (initialSpawn) {
    clearAllRightClick(player);
    
    // Check if the player has the correct pack version
    if (VERSION !== world.getDynamicProperty(WorldDyanmicPropertiesKey.PACK_VERSION)) {
      if (world.getDynamicProperty(WorldDyanmicPropertiesKey.PACK_VERSION) === undefined) {
        player.sendMessage(`Be careful little one, for this world somehow has an undefined pack version. Contact Levontriz or Purtzle because something has gone HORRIBLY wrong.`);
      }
      player.sendMessage(`§7[§6!§7] §cYour pack version is outdated! Please update to version ${VERSION}.`);
      // Kick the player and give a reason using a world command
      player.dimension.runCommand(`kick "${player.name}" "Your pack version is outdated! Please update to version ${VERSION}."`);
    }
  }
});

world.afterEvents.itemUse.subscribe((eventData) => {
  const notifier = findNotifier();
  const { source, itemStack } = eventData;
  const selectedItem = source.getComponent("inventory")?.container?.getSlot(source.selectedSlotIndex);
  if (!selectedItem) return;

  const rightClickSignature = source.getDynamicProperty(PlayerDynamicPropertiesKey.RIGHT_CLICK_SIGNATURE);
  const playerToSign = source.getDynamicProperty(PlayerDynamicPropertiesKey.PLAYER_TO_SIGN);
  const clearSignatures = source.getDynamicProperty(PlayerDynamicPropertiesKey.CLEAR_SIGNATURES);
  const rightClickAddItemToWhitelist = source.getDynamicProperty(PlayerDynamicPropertiesKey.RIGHT_CLICK_ADD_ITEM_TO_WHITELIST);
  const rightClickSetLore = source.getDynamicProperty(PlayerDynamicPropertiesKey.RIGHT_CLICK_SET_LORE);
  const loreToSetRaw = source.getDynamicProperty(PlayerDynamicPropertiesKey.LORE_TO_SET);
  const loreToSet = loreToSetRaw ? JSON.parse(loreToSetRaw) : [];

  if (rightClickSetLore) {
    selectedItem.setLore(loreToSet);
    source.sendMessage("§7[§6!§7] §5§oLore set!");
    clearAllRightClick(source);
    return;
  }

  if (rightClickAddItemToWhitelist) {
    const itemId = selectedItem.typeId;
    let itemName = itemId.split(":")[1].split("_");
    for (let i = 0; i < itemName.length; i++) {
      itemName[i] = itemName[i].charAt(0).toUpperCase() + itemName[i].substring(1);
    }

    itemName = itemName.join(" ");
    const playerWhitelist = source.getDynamicProperty(PlayerDynamicPropertiesKey.CLEAR_WHITELIST);

    if (playerWhitelist === undefined) {
      const whitelist = JSON.stringify([itemId]);
      source.setDynamicProperty(PlayerDynamicPropertiesKey.CLEAR_WHITELIST, whitelist);
      if (itemId === "tfg:aphone") {
        source.sendMessage("§l§6aPhone §aadded to whitelist"); // I get it now, its bc the a is lowercase lolololol
      } else {
        source.sendMessage(`§7[§6!§7] §f§o${itemName} §r§aadded to whitelist!`);
        if (notifier) notifier.sendMessage(`§7[§u!§7] §c§o${source.name} added ${itemName} to their whitelist.`); // may as well since there's already one for removing it
      }
      clearAllRightClick(source);
      return;
    }

    const whitelist = JSON.parse(playerWhitelist);
    if (whitelist.includes(itemId)) {
      source.sendMessage("§7[§6!§7] §cItem is already in your whitelist!");
      clearAllRightClick(source);
      return;
    }

    whitelist.push(itemId);  // AND THEN A SECOND TIMEEEEEEEEEEEEEEEEEEEE
    source.setDynamicProperty(PlayerDynamicPropertiesKey.CLEAR_WHITELIST, JSON.stringify(whitelist));
    if (itemId === "tfg:aphone") {
      source.sendMessage("§l§6aPhone §aadded to whitelist");
    } else {
      source.sendMessage(`§7[§6!§7] §f§o${itemName} §r§aadded to whitelist!`);
    }
    clearAllRightClick(source);
    return;
  }

  if (clearSignatures) {
    clearAllRightClick(source);
    selectedItem.clearDynamicProperties();
    selectedItem.setLore([]);
    source.sendMessage("§7[§6!§7] §4Phone signature wiped!");
    return;
  }

  if (rightClickSignature) {
    try {
      selectedItem.setDynamicProperty(ItemDynamicPropertiesKey.OWNER, playerToSign);
      selectedItem.setLore([`Owned by ${playerToSign}`]);
      source.sendMessage(`§7[§6!§7] §aPhone registered to ${playerToSign}!`);
      clearAllRightClick(source);
      return;
    } catch (error) {
      source.sendMessage("§7[§6!§7] §cInvalid item!");
      return;
    }
  }

  if (itemStack.typeId === "tfg:ppda") {
    rightClickEvent(eventData, notifier);
    return;
  }

  if (PAY_TO_USE_PHONES.includes(itemStack.typeId)) {
    if (!selectedItem.getDynamicPropertyIds().includes(ItemDynamicPropertiesKey.OWNER)) {
      source.sendMessage("§7[§6!§7] §cThis PDA is non-functional, please give it to a server operator!");
      if (notifier) notifier.sendMessage(`§7[§u!§7] §c§o${source.name} attempted to use an unregistered pda!`);
      return;
    }

    const signature = selectedItem.getDynamicProperty(ItemDynamicPropertiesKey.OWNER);
    if (signature === source.name) {
      const phoneLevel = PHONE_LEVELS[itemStack.typeId];
      selectedItem.setLore([`Owned by ${signature}`]);
      mainUi(source, notifier, phoneLevel);
      return;
    }

    source.sendMessage("§7[§6!§7] §cThis PDA belongs to someone else, you cannot use it!");
    if (notifier) notifier.sendMessage(`§7[§u!§7] §c§o${source.name} attempted to use ${signature}'s pda!`);
    return;
  }

  if (itemStack.typeId === "tfg:pda") {
    mainUi(source, notifier, 0);
    return;
  }

  if (itemStack.typeId === "tfg:admin_pda") {
    if (ADMINS.includes(source.name)) {
      adminUi(source, notifier);
      return;
    }
    source.sendMessage("§7[§6!§7] §cYou must be a server operator to use this item!");
    if (notifier) notifier.sendMessage(`§7[§u!§7] §c§o${source.name} attempted to use an admin pda!`);
  }
});

function mainUi(player, notifier, level) {
  const commandOrder = [];
  const ui = new ActionFormData();
  ui.title("Home Screen");

  if (level >= 3) {
    ui.button("Home", `textures/tfg-icons-/t-/${level}-/default-/t${level}-default-home`);
    commandOrder.push("Home");
  }

  if (level >= 3) {
    ui.button("Speed", `textures/tfg-icons-/t-/${level}-/default-/t${level}-default-speed`);
    commandOrder.push("Speed");
  }
  if (level >= 2) {
    ui.button("TPA", `textures/tfg-icons-/t-/${level}-/default-/t${level}-default-tpa`);
    commandOrder.push("TPA");
  }

  ui.button("Fast Travel", `textures/tfg-icons-/t-/${level}-/default-/t${level}-default-fasttravel`);
  commandOrder.push("FT");

  ui.button("Bank", `textures/tfg-icons-/t-/${level}-/default-/t${level}-default-bank`);
  commandOrder.push("Bank");

  if (level >= 2) {
    ui.button("Clear", `textures/tfg-icons-/t-/${level}-/default-/t${level}-default-clear`);
    commandOrder.push("Clear");
  }

  if (level !== 0) {
    ui.button("Settings", `textures/tfg-icons-/t-/${level}-/default-/t${level}-default-settings`);
    commandOrder.push("Settings");
  }

  ui.show(player).then((response) => {
    const command = commandOrder[response.selection];
    if (command === "FT") {
      fastTravelUi(player, notifier, level);
    } else if (command === "Bank") {
      bankUi(player, notifier, level);
    } else if (command === "TPA") {
      tpaScreen(player, notifier);
    } else if (command === "Clear") {
      clearInventory(player, notifier);
    } else if (command === "Home") {
      home(player, notifier);
    } else if (command === "Settings") {
      settingsMenu(player, notifier, level);
    } else if (command === "Speed") {
      player.runCommand("effect @s speed 10 100 true");
      player.sendMessage("§7[§6!§7] §d100x speed for 10 seconds!");
      if (notifier) notifier.sendMessage(`§7[§u!§7] §o${player.name} enabled speed boost.`);
    }
  });
}

function findNotifier() {
  const targetName = NOTIFY_ADMIN || ADMINS[0];
  return world.getAllPlayers().find((player) => player.name === targetName);
}