import { ActionFormData } from "@minecraft/server-ui";

import { clearInventoryConfig, setHome } from "../general_functions/settings.js";
import { clearAllRightClick } from "../general_functions/clearAllRightClick.js";
import { viewPlayerInventory, givePhoneSigniture, addLore, openPaydayMenu } from "./server_utils/import.js";


function serverUtil(player, Noah) {
  let CommandOrder = [];

  const serverUtilPanel = new ActionFormData();
  serverUtilPanel.title("Server Utility");
  serverUtilPanel.button("Inventory Check");
  CommandOrder.push("InventoryCheck");
  serverUtilPanel.button("Clear Lag");
  CommandOrder.push("ClearLag");
    serverUtilPanel.button("Payday Menu");
    CommandOrder.push("PaydayMenu");
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
    }else if (command == "PaydayMenu") {
      openPaydayMenu(player);
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

export { serverUtil };