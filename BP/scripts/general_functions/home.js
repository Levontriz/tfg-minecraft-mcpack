import { world } from "@minecraft/server";
import { PlayerDynamicPropertiesKey } from "../config.js";

export function home(player, Noah) {
  const homeCoordinates = player.getDynamicProperty(PlayerDynamicPropertiesKey.HOME);

  if (homeCoordinates === undefined || homeCoordinates === null) {
    player.sendMessage("§7[§6!§7] §cYou do not have a home set! Set one using the settings menu.");
    Noah?.sendMessage?.(`§7[§u!§7] §o${player.name} tried to teleport home but hasn't set one.`);
    return;
  }

  const coordinates = JSON.parse(homeCoordinates);
  const [homeXCoord, homeYCoord, homeZCoord] = coordinates;

  player.teleport(
    { x: homeXCoord + 0.5, y: homeYCoord, z: homeZCoord + 0.5 },
    { dimension: world.getDimension("overworld") }
  );
  player.sendMessage("§7[§6!§7] §aTeleported to your home!");
  Noah?.sendMessage?.(`§7[§u!§7] §o${player.name} teleported to ${homeXCoord}, ${homeYCoord}, ${homeZCoord}.`);
}