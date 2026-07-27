import { world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { clearAllRightClick } from "../../general_functions/clearAllRightClick.js";

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

export { givePhoneSigniture };