import { world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { PlayerDynamicPropertiesKey } from "../../config.js";

function startPlayerDynamicPropertyRemoval(player) {
    const playerDynamicProperties = player.getDynamicPropertyIds();
    const removeForm = new ModalFormData();
    removeForm.title("Remove Player Dynamic Property");
    removeForm.dropdown("Select a property to remove", playerDynamicProperties);
    
    removeForm.show(player).then((response) => {
        if (response.canceled || !response.formValues) return;
        const selectedPropertyIndex = response.formValues[0];
        const selectedProperty = playerDynamicProperties[selectedPropertyIndex];
        
        // Confirm Removal
        const confirmForm = new ActionFormData();
        confirmForm.title("Confirm Removal");
        confirmForm.body(`Are you sure you want to remove the dynamic property "${selectedProperty}"? This action cannot be undone.`);
        confirmForm.button("Yes, Remove");
        confirmForm.button("Cancel");
        confirmForm.show(player).then((confirmResponse) => {
            if (confirmResponse.selection === 0) {
                player.setDynamicProperty(selectedProperty, undefined);
                player.sendMessage(`§7[§6!§7] §aProperty removed successfully.`);
            }
        });
    });
}

export { startPlayerDynamicPropertyRemoval };