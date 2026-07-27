import { world } from "@minecraft/server";

export function home(player, Noah) {
  const homeX = world.scoreboard.getObjective("homeX");
  const homeY = world.scoreboard.getObjective("homeY");
  const homeZ = world.scoreboard.getObjective("homeZ");

  if (homeX.getScore(player) === 0 || homeY.getScore(player) === 0 || homeZ.getScore(player) === 0) {
    player.sendMessage("§7[§6!§7] §cSet this as your home location in the settings app!");
    Noah?.sendMessage?.(`§7[§u!§7] §o${player.name} tried to teleport home but hasn't set one.`);
    return;
  }

  player.teleport(
    { x: homeX.getScore(player) + 0.5, y: homeY.getScore(player), z: homeZ.getScore(player) + 0.5 },
    { dimension: world.getDimension("overworld") }
  );
  player.sendMessage("§7[§6!§7] §aTeleported to your home!");
  Noah?.sendMessage?.(`§7[§u!§7] §o${player.name} teleported to ${homeX.getScore(player)}, ${homeY.getScore(player)}, ${homeZ.getScore(player)}.`);
}