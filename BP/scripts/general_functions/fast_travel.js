import { world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

export function fastTravelUi(player, Noah, level) {
  const locations = {
    "Spawn": { level: 0, x: 0, y: 4, z: 0, texture: "textures/tfg-icons-/t-/ft-/t-ft-1spawn" },
    "Launchpad": { level: 1, x: -212, y: 5, z: -327, texture: "textures/tfg-icons-/t-/ft-/t-ft-2launchpad" },
    "Parliament": { level: 1, x: -62, y: 4, z: 242, texture: "textures/tfg-icons-/t-/ft-/t-ft-3parliament" },
    "The Bean": { level: 1, x: 400, y: 4, z: -91, texture: "textures/tfg-icons-/t-/ft-/t-ft-4bean" },
    "Tennis Court": { level: 2, x: 515, y: 4, z: 496, texture: "textures/tfg-icons-/t-/ft-/t-ft-5tennis" },
    "Mars": { level: 2, x: -37, y: 20, z: -570, texture: "textures/tfg-icons-/t-/ft-/t-ft-6mars" },
    "Coal Pile": { level: 3, x: 492, y: 7, z: -608, texture: "textures/tfg-icons-/t-/ft-/t-ft-7coal" }
  };

  const order = [];
  const fastTravelForm = new ActionFormData();
  fastTravelForm.title("Fast Travel");
  fastTravelForm.body("Where would you like to go?");

  for (const data in locations) {
    if (level >= locations[data].level) {
      fastTravelForm.button(data, locations[data].texture);
      order.push(data);
    }
  }

  fastTravelForm.show(player).then((response) => {
    for (let i = 0; i < order.length; ++i) {
      if (response.selection === i) {
        const { x, y, z } = locations[order[i]];
        player.teleport({ x, y, z }, { dimension: world.getDimension("overworld") });
        player.sendMessage(`§l§aTeleported to ${order[i]}!`);
        Noah.sendMessage(`§7§o${player.name} teleported to ${order[i]}.`);
      }
    }
    return;
  });
}
