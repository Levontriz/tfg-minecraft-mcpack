import { world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { adminUi } from "./phones/admin_pda.js";
import { clearAllRightClick } from "./general_functions/clearAllRightClick.js";
import { home } from "./general_functions/home.js";
import { settingsMenu } from "./general_functions/settings.js";
import { bankUi } from "./general_functions/bank_ui.js";
import { fastTravelUi } from "./general_functions/fast_travel.js";
import { clearInventory } from "./general_functions/clear_inventory.js";
import { PAY_TO_USE_PHONES, PHONE_LEVELS, ADMINS, NOTIFY_ADMIN } from "./config.js";
import { ParticleEffectsLibrary, ParticleEffectSequenceController, ParticleEffectSequence, CircleEffect, ParticleTypes, SphereEffect } from "./extensions/particles.js";
import { rightClickEvent } from "./phones/prison_pda.js";

// Particle Effects Setup (Temporary Code for Testing)




var tempSequencesList = [
    {
        name: "rings",
        repeating: true,
        sequence: {
            0: {
                type: "sphere",
                position: { x: 5, y: -40, z: 0 },
                particleType: ParticleTypes.BASIC_FLAME,
                radius: 10,
                yOffset: 1,
                duration: 10,
                particleCount: 200,
                rotationSpeed: 0,
            },
            10: {
                type: "sphere",
                position: { x: 5, y: -40, z: 0 },
                particleType: ParticleTypes.BASIC_FLAME,
                radius: 8,
                yOffset: 1,
                duration: 10,
                particleCount: 150,
                rotationSpeed: 0,
            },
            20: {
                type: "sphere",
                position: { x: 5, y: -40, z: 0 },
                particleType: ParticleTypes.BASIC_FLAME,
                radius: 6,
                yOffset: 1,
                duration: 10,
                particleCount: 100,
                rotationSpeed: 0,
            },
        },
    },
];
var circleId = NaN;
var explodeId = NaN;
const effectsLibrary = new ParticleEffectsLibrary();
const sequenceController = new ParticleEffectSequenceController();
for (const sequenceData of tempSequencesList) {
    const sequence = new ParticleEffectSequence(sequenceData.repeating);
    for (const [time, effectData] of Object.entries(sequenceData.sequence)) {
        let effect;
        switch (effectData.type) {
            case "sphere":
                effect = new SphereEffect(effectData.position, effectData.particleType, {
                    radius: effectData.radius,
                    yOffset: effectData.yOffset,
                    duration: effectData.duration,
                    particleCount: effectData.particleCount,
                    rotationSpeed: effectData.rotationSpeed,
                });
                break;
            default:
                console.warn(`Unknown effect type: ${effectData.type}`);
                continue;
        }
        sequence.addEffect(parseInt(time), effect);
    }
    sequenceController.addSequence(sequence);
}







world.afterEvents.playerSpawn.subscribe((eventData) => {
  const { initialSpawn, player } = eventData;
  // If "Cash" doesn't exist in world dynamics add it
  if (!world.getDynamicProperty("Cash")) {
    world.setDynamicProperty("Cash", "{}");
  }
  var playerCash = world.scoreboard.getObjective("CashV2").getScore(player);
  if (playerCash || playerCash === 0) {
    var cashData = JSON.parse(world.getDynamicProperty("Cash"));
    cashData[player.name] = playerCash;
    world.setDynamicProperty("Cash", JSON.stringify(cashData));
    //remove cashv2 objective from player
    world.scoreboard.getObjective("CashV2").removeParticipant(player);
  }
  if (initialSpawn) {
    clearAllRightClick(player);
    
  }
});

world.afterEvents.itemUse.subscribe((eventData) => {
  const notifier = findNotifier();
  const { source, itemStack } = eventData;
  const selectedItem = source.getComponent("inventory")?.container?.getSlot(source.selectedSlotIndex);
  if (!selectedItem) return;

  const rightClickSignature = source.getDynamicProperty("rightClickSignature");
  const playerToSign = source.getDynamicProperty("playerToSign");
  const clearSignatures = source.getDynamicProperty("clearSignatures");
  const rightClickAddItemToWhitelist = source.getDynamicProperty("rightClickAddItemToWhitelist");
  const rightClickSetLore = source.getDynamicProperty("rightClickSetLore");
  const loreToSetRaw = source.getDynamicProperty("loreToSet");
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
    const playerWhitelist = source.getDynamicProperty("ClearWhitelist");

    if (playerWhitelist === undefined) {
      const whitelist = JSON.stringify([itemId]);
      source.setDynamicProperty("ClearWhitelist", whitelist);
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
    source.setDynamicProperty("ClearWhitelist", JSON.stringify(whitelist));
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
      selectedItem.setDynamicProperty("Owner", playerToSign);
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
    if (!selectedItem.getDynamicPropertyIds().includes("Owner")) {
      source.sendMessage("§7[§6!§7] §cThis PDA is non-functional, please give it to a server operator!");
      if (notifier) notifier.sendMessage(`§7[§u!§7] §c§o${source.name} attempted to use an unregistered pda!`);
      return;
    }

    const signature = selectedItem.getDynamicProperty("Owner");
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