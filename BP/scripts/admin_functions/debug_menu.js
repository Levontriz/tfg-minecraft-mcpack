import { world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { startWorldDynamicPropertyRemoval, startPlayerDynamicPropertyRemoval } from "./debug_utils/import.js";

function debugMenu(player) {
    let commandOrder = [];
  const debugPanel = new ActionFormData();
  debugPanel.title("Debug Menu");
  debugPanel.body("What function to run?");
  debugPanel.button("View My Dynamics");
  commandOrder.push("ViewMyDynamics");
  debugPanel.button("Remove A Player Dynamic");
    commandOrder.push("RemovePlayerDynamic");
  debugPanel.button("Clear My Dynamics");
    commandOrder.push("ClearMyDynamics");
  debugPanel.button("view World Dynamics");
    commandOrder.push("ViewWorldDynamics");
  debugPanel.button("Remove A World Dynamic");
    commandOrder.push("RemoveWorldDynamic");
  debugPanel.button("Clear World Dynamics");
    commandOrder.push("ClearWorldDynamics");

  debugPanel.show(player).then((response) => {
    if (commandOrder[response.selection] == "ViewMyDynamics") {
      for (let id of player.getDynamicPropertyIds()) {
        player.sendMessage(id + ":");
        player.sendMessage(formatDynamicValue(player.getDynamicProperty(id)));
      }
    }
    if (commandOrder[response.selection] == "RemovePlayerDynamic") {
        startPlayerDynamicPropertyRemoval(player);
    }
    if (commandOrder[response.selection] == "ClearMyDynamics") {
      for (let id of player.getDynamicPropertyIds()) {
        player.setDynamicProperty(id, undefined);
      }
      player.sendMessage("§7[§6!§7] §4Cleared all dynamic properties.")
    }
    if (commandOrder[response.selection] == "ViewWorldDynamics") {
      for (let id of world.getDynamicPropertyIds()) {
        player.sendMessage(id + ":");
        player.sendMessage(formatDynamicValue(world.getDynamicProperty(id)));
      }
    }
    if (commandOrder[response.selection] == "RemoveWorldDynamic") {
        startWorldDynamicPropertyRemoval(player);
    }
    if (commandOrder[response.selection] == "ClearWorldDynamics") {
      for (let id of world.getDynamicPropertyIds()) {
        if (id == "Cash") continue;
        world.setDynamicProperty(id, undefined);
      }
      player.sendMessage("§7[§6!§7] §4Cleared all dynamic properties from world.")
    }
  });
}

function formatDynamicValue(value) {
  if (value === undefined || value === null) return "null";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch (_err) {
    return String(value);
  }
}

export { debugMenu };