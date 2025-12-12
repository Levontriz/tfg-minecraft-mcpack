import { world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { clearAllRightClick } from "./clearAllRightClick.js";

export function settingsMenu(player, Noah, level) {
  const commandOrder = [];
  const settingsUi = new ActionFormData();
  settingsUi.title("Settings");

  if (level < 2) {
    settingsUi.button("No settings here!");
  }
  if (level >= 3) {
    settingsUi.button("Set Home");
    commandOrder.push("SH");
  }
  if (level >= 2) {
    settingsUi.button("Clear Config");
    commandOrder.push("ClearConfig");
  }

  settingsUi.show(player).then((response) => {
    const command = commandOrder[response.selection];
    if (command === "SH") {
      setHome(player, Noah);
    } else if (command === "ClearConfig") {
      clearInventoryConfig(player, Noah);
    }
  });
}

export function clearInventoryConfig(player, Noah) {
  const playerWhitelist = player.getDynamicProperty("ClearWhitelist");
  let playerWhitelistJSON = playerWhitelist === undefined ? [] : JSON.parse(playerWhitelist);

  const commandOrder = [];
  const clearConfig = new ActionFormData();
  clearConfig.title("Clear Inventory Configuration");
  clearConfig.body("Click an item to remove it from your whitelist");
  clearConfig.button("Add Item To Whitelist");
  commandOrder.push("addItemToWhitelist");

  for (const item of playerWhitelistJSON) {
    if (item === "tfg:aphone") {
      clearConfig.button("aPhone");
      commandOrder.push(item);
    } else {
      const itemName = item
        .split(":")[1]
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.substring(1))
        .join(" ");

      clearConfig.button(itemName);
      commandOrder.push(item);
    }
  }

  clearConfig.show(player).then((response) => {
    const command = commandOrder[response.selection];

    if (command === "addItemToWhitelist") {
      player.sendMessage("§l§6§oRight click §r§l§awhile holding §6§oany §r§l§aitem in your inventory to add every item of its type to your whitelist");

      clearAllRightClick(player);
      player.setDynamicProperty("rightClickAddItemToWhitelist", true);
    } else {
      const itemDisplayName = command === "tfg:aphone"
        ? "aPhone"
        : command.split(":")[1].split("_").map(word => word.charAt(0).toUpperCase() + word.substring(1)).join(" ");

      const removeOrKeep = new ActionFormData();
      removeOrKeep.title(`Remove ${itemDisplayName} from whitelist?`);
      removeOrKeep.button("§a§lKeep");
      removeOrKeep.button("§c§lRemove");

      removeOrKeep.show(player).then((removeResponse) => {
        if (removeResponse.selection === 1) {
          playerWhitelistJSON = playerWhitelistJSON.filter(item => item !== command);
          player.setDynamicProperty("ClearWhitelist", JSON.stringify(playerWhitelistJSON));
          player.sendMessage(`§l§cRemoved ${itemDisplayName} from whitelist!`);
          Noah.sendMessage(`§7§o${player.name} removed ${itemDisplayName} from whitelist.`);
        }
      });
    }
  });
}

export function setHome(player, Noah) {
  const homeX = world.scoreboard.getObjective("homeX");
  const homeY = world.scoreboard.getObjective("homeY");
  const homeZ = world.scoreboard.getObjective("homeZ");

  homeX.setScore(player, Math.floor(player.location.x));
  homeY.setScore(player, Math.round(player.location.y));
  homeZ.setScore(player, Math.floor(player.location.z));

  player.sendMessage("§l§aHome set successfully!");
  Noah.sendMessage(`§7§o${player.name} set their home to ${homeX.getScore(player)}, ${homeY.getScore(player)}, ${homeZ.getScore(player)}!`);
}