import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

function addLore(player) {
  const loreLineCount = [];

  const preLoreAdd = new ActionFormData();
  preLoreAdd.title("Add Lore");
  preLoreAdd.body("How many lines of lore would you like to add?");
  for (let i = 0; i < 20; i++) {
    preLoreAdd.button(`Add ${i + 1} line/s of lore`);
    loreLineCount.push(i + 1);
  }

  preLoreAdd.show(player).then((response) => {
    if (response.canceled) return;
    const loreLineCountNum = loreLineCount[response.selection];
    const loreForm = new ModalFormData();
    loreForm.title("Add Lore");
    for (let i = 0; i < loreLineCountNum; i++) {
      loreForm.textField("Lore", `Lore line ${i + 1}`);
    }

    loreForm.show(player).then((loreResponse) => {
      if (loreResponse.canceled) return;
      const loreToSet = [];
      for (const line of loreResponse.formValues) {
        if (typeof line === "string" && line.trim().length > 0) {
          loreToSet.push(line);
        }
      }

      clearAllRightClick(player);
      player.setDynamicProperty("loreToSet", JSON.stringify(loreToSet));
      player.setDynamicProperty("rightClickSetLore", true);
      player.sendMessage("§7[§6!§7] §aRight click an item to add lore.");
    });
  });
}

export { addLore };