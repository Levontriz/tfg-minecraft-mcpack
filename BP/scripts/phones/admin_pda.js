import { ActionFormData } from "@minecraft/server-ui";

import { clearInventory } from "../general_functions/clear_inventory.js";
import { home } from "../general_functions/home.js";
import { fastTravelUi } from "../general_functions/fast_travel.js";
import { tpaScreen } from "../general_functions/tpa.js";

import { adminBankUi, debugMenu, serverUtil } from "../admin_functions/import.js";

function adminUi(player, Noah) {
  let CommandOrder = [];

  const adminUiPanel = new ActionFormData();
  adminUiPanel.title("Admin PDA");
  adminUiPanel.button("Home", "textures/tfg-icons-/t-/4-/default-/t4-default-home");
  CommandOrder.push("Home");
  adminUiPanel.button("Speed", "textures/tfg-icons-/t-/4-/default-/t4-default-speed");
  CommandOrder.push("Speed");
  adminUiPanel.button("TPA", "textures/tfg-icons-/t-/4-/default-/t4-default-tpa");
  CommandOrder.push("TPA");
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
    } else if (command == "TPA") {
      tpaScreen(player, Noah);
    }
    return;
  });

}

export { adminUi };