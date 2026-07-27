import { world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { WorldDyanmicPropertiesKey } from "../../config.js";
import { startPaydayInterval } from "../../general_functions/payday.js";

function openPaydayMenu(player) {
  const paydayMenu = new ModalFormData()
    .title("Payday Menu")
    // add a section to change payday amount and make the default value the current payday amount
    .textField("Payday Amount", String(world.getDynamicProperty(WorldDyanmicPropertiesKey.PAYDAY_AMOUNT)) || "10")
    // add a section to change payday interval and make the default value the current payday interval
    .textField("Payday Interval (in ticks)", String(world.getDynamicProperty(WorldDyanmicPropertiesKey.PAYDAY_INTERVAL)) || "12000")
    // toggle on off
    .toggle("Off: Disabled \nOn: Enabled", {defaultValue : Boolean(world.getDynamicProperty(WorldDyanmicPropertiesKey.PAYDAY_ENABLED))} || {defaultValue : false})
    .show(player)
    .then((response) => {
      if (response.canceled || !response.formValues) return;
        const [paydayAmount, paydayInterval, paydayEnabled] = response.formValues;

        if (paydayAmount) {
          world.setDynamicProperty(WorldDyanmicPropertiesKey.PAYDAY_AMOUNT, parseInt(paydayAmount));
        }
        if (paydayInterval) {
          world.setDynamicProperty(WorldDyanmicPropertiesKey.PAYDAY_INTERVAL, parseInt(paydayInterval));
        }
        if (typeof paydayEnabled === "boolean") {
          world.setDynamicProperty(WorldDyanmicPropertiesKey.PAYDAY_ENABLED, paydayEnabled);
        }

        startPaydayInterval();

        player.sendMessage(`§7[§6!§7] §aPayday settings updated successfully.`);
    });
}

export { openPaydayMenu };
