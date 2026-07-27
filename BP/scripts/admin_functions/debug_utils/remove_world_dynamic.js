import { world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { WorldDyanmicPropertiesKey } from "../../config.js";

function startWorldDynamicPropertyRemoval(player) {
    const worldDynamicProperties = world.getDynamicPropertyIds();
    const removeForm = new ModalFormData();
    removeForm.title("Remove World Dynamic Property");
    removeForm.dropdown("Select a property to remove", worldDynamicProperties);

    removeForm.show(player).then((response) => {
        if (response.canceled || !response.formValues) return;
        const selectedPropertyIndex = response.formValues[0];
        const selectedProperty = worldDynamicProperties[selectedPropertyIndex];
        // Confirm Removal
        const confirmForm = new ActionFormData();
        confirmForm.title("Confirm Removal");
        confirmForm.body(`Are you sure you want to remove the dynamic property "${selectedProperty}"? This action cannot be undone.`);
        confirmForm.button("Yes, Remove");
        confirmForm.button("Cancel");
        confirmForm.show(player).then((confirmResponse) => {
            if (confirmResponse.selection === 0) {
                world.setDynamicProperty(selectedProperty, undefined);
                response.source.sendMessage(`§7[§6!§7] §aProperty removed successfully.`);
            }
        });
    });
}

export { startWorldDynamicPropertyRemoval };