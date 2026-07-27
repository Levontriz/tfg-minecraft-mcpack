// general_functions/payday.js
import { system, world } from "@minecraft/server";
import { WorldDyanmicPropertiesKey } from "../config.js";

let paydayIntervalId;

export function startPaydayInterval() {
  if (paydayIntervalId !== undefined) {
    system.clearRun(paydayIntervalId);
  }

  const intervalTicks = world.getDynamicProperty(WorldDyanmicPropertiesKey.PAYDAY_INTERVAL);

  paydayIntervalId = system.runInterval(() => {
    if (!world.getDynamicProperty(WorldDyanmicPropertiesKey.PAYDAY_ENABLED)) {
      return;
    }

    const cashDataRaw = world.getDynamicProperty(WorldDyanmicPropertiesKey.CASH);
    const cashData = cashDataRaw ? JSON.parse(cashDataRaw) : {};
    const paydayAmount = world.getDynamicProperty(WorldDyanmicPropertiesKey.PAYDAY_AMOUNT);

    for (const player of world.getAllPlayers()) {
      if (player.name === "Purtzle") {
        continue; // Skip giving payday to the player named "Purtzle"
      }
      cashData[player.name] = (cashData[player.name] ?? 0) + paydayAmount;
    }
    world.sendMessage("[Server] §a§lPayday!");

    const overworld = world.getDimension("overworld");
    system.run(() => {
      try {
        overworld.runCommand("time set sunrise");
      } catch (error) {
        console.error("Failed to execute command: ", error);
      }
    });

    world.setDynamicProperty(WorldDyanmicPropertiesKey.CASH, JSON.stringify(cashData));
  }, intervalTicks);
}