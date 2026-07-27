import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { PAY_TO_USE_PHONES, PHONE_LEVELS, ADMINS, NOTIFY_ADMIN } from "../config.js";

function positionsEqual(a, b) {
    return a && b && a.x === b.x && a.y === b.y && a.z === b.z;
}

function rightClickEvent(event, notifier) {
    const { source, itemStack } = event;
    
    // Stop non-admins from using prison pda
    if (!ADMINS.includes(source.name)) {
        source.sendMessage("§7[§6!§7] §cThis item is restricted to server operators.");
        if (notifier) notifier.sendMessage(`§7[§u!§7] §c§o${source.name} attempted to use a prison pda!`);
        return;
    }

    // Second click after selecting first door block: finalize door region
    if (source.getDynamicProperty("PrisonDoorBlockPos1")) {
        const pos1 = JSON.parse(source.getDynamicProperty("PrisonDoorBlockPos1"));
        const doorNameRaw = source.getDynamicProperty("PrisonDoorName");
        const doorName = doorNameRaw && String(doorNameRaw).trim().length > 0 ? String(doorNameRaw).trim() : "Door";

        const hit = source.getBlockFromViewDirection({ includeFluidBlocks: false });
        const pos2 = hit && hit.block ? hit.block.location : undefined;

        if (!pos2) {
            source.sendMessage("§7[§6!§7] §cPlease select a valid block!");
            return;
        }

        let prisonDoorDataRaw = world.getDynamicProperty("PrisonDoors");
        let prisonDoorData;
        try {
            prisonDoorData = prisonDoorDataRaw ? JSON.parse(prisonDoorDataRaw) : [];
        } catch (error) {
            prisonDoorData = [];
        }

        const exists = prisonDoorData.some((entry) => {
            if (!entry) return false;

            let e1, e2;
            // Backwards compatibility: old format was [pos1, pos2]
            if (Array.isArray(entry) && entry.length === 2) {
                [e1, e2] = entry;
            } else if (entry.pos1 && entry.pos2) {
                e1 = entry.pos1;
                e2 = entry.pos2;
            } else {
                return false;
            }

            // Treat door as unordered pair: (pos1,pos2) or (pos2,pos1)
            return (
                (positionsEqual(e1, pos1) && positionsEqual(e2, pos2)) ||
                (positionsEqual(e1, pos2) && positionsEqual(e2, pos1))
            );
        });

        if (exists) {
            source.sendMessage(`§7[§6!§7] §cAn error occured trying to create §7§o${doorName}§r§c. It may already exist!`);
        } else {
            source.sendMessage(`§7[§6!§7] §aSuccessfully created §7§o${doorName}§r§a!`);
            notifier?.sendMessage?.(`§7[§u!§7] §o'${doorName}' door created by ${source.name}.`);
        }

        if (!exists) {
            const blockType = hit.block.typeId;
            prisonDoorData.push({ name: doorName, pos1, pos2, blockType });
            world.setDynamicProperty("PrisonDoors", JSON.stringify(prisonDoorData));
        }

        // Clear pending first position and name
        source.setDynamicProperty("PrisonDoorBlockPos1");
        source.setDynamicProperty("PrisonDoorName");
        return;
    }
    

    // Quick use: if looking at a configured door, temporarily open it without showing UI
    const viewHit = source.getBlockFromViewDirection({ includeFluidBlocks: false });
    const viewLoc = viewHit && viewHit.block ? viewHit.block.location : undefined;

    if (viewLoc) {
        let prisonDoorDataRaw = world.getDynamicProperty("PrisonDoors");
        let prisonDoorData;
        try {
            prisonDoorData = prisonDoorDataRaw ? JSON.parse(prisonDoorDataRaw) : [];
        } catch (error) {
            prisonDoorData = [];
        }

        if (Array.isArray(prisonDoorData) && prisonDoorData.length > 0) {
            const doorEntry = prisonDoorData.find((entry) => {
                if (!entry) return false;

                let pos1;
                let pos2;

                if (entry.pos1 && entry.pos2) {
                    pos1 = entry.pos1;
                    pos2 = entry.pos2;
                } else if (Array.isArray(entry) && entry.length === 2) {
                    pos1 = entry[0];
                    pos2 = entry[1];
                } else {
                    return false;
                }

                const x1 = Math.floor(Math.min(pos1.x, pos2.x));
                const y1 = Math.floor(Math.min(pos1.y, pos2.y));
                const z1 = Math.floor(Math.min(pos1.z, pos2.z));
                const x2 = Math.floor(Math.max(pos1.x, pos2.x));
                const y2 = Math.floor(Math.max(pos1.y, pos2.y));
                const z2 = Math.floor(Math.max(pos1.z, pos2.z));

                return (
                    viewLoc.x >= x1 && viewLoc.x <= x2 &&
                    viewLoc.y >= y1 && viewLoc.y <= y2 &&
                    viewLoc.z >= z1 && viewLoc.z <= z2
                );
            });

            if (doorEntry) {
                temporarilyToggleDoor(source, notifier, doorEntry, true /* openThenClose */);
                return;
            }
        }
    }

    // Otherwise open Prison PDA UI
    prisonUi(source, notifier);
}

function prisonUi(player, notifier) {
    const commandOrder = [];
    const ui = new ActionFormData();
    ui.title("Home Screen");
    ui.body("");

    ui.button("Doors");
    commandOrder.push("doors");

    ui.show(player).then((response) => {
        const command = commandOrder[response.selection];
        if (command === "doors") {
            prisonDoorUi(player, notifier);
        }
    });
}

function prisonDoorUi(player, notifier) {
    const commandOrder = [];
    const ui = new ActionFormData();
    ui.title("Door Control");
    ui.body("");
    ui.button("Add door block");
    commandOrder.push("add");
    ui.button("Remove door block");
    commandOrder.push("remove");
    ui.button("Open / Close door");
    commandOrder.push("toggle");
    ui.show(player).then((response) => {
        const command = commandOrder[response.selection];
        if (command === "add") {
            // add the block the player is looking at to the prison door list in world dynamics
            var block = player.getBlockFromViewDirection({
                includeFluidBlocks: false
            }).block;
            if (block) { 
                var x = block.x, y = block.y, z = block.z; 
            } else { 
                var x = "None", y = "None", z = "None"; 
            }
            player.setDynamicProperty("PrisonDoorBlockPos1", JSON.stringify({x, y, z}));

            // Ask for a door name now, then on the next right-click we'll finish the door
            const nameForm = new ModalFormData();
            nameForm.title("Door Name");
            nameForm.textField("Enter a door name:", "Main Gate / Cell A1", "");

            nameForm.show(player).then((nameResponse) => {
                if (nameResponse.canceled) {
                    // Cancel selection if they back out
                    player.setDynamicProperty("PrisonDoorBlockPos1");
                    player.setDynamicProperty("PrisonDoorName");
                    return;
                }

                const nameValue = nameResponse.formValues[0];
                const trimmed = nameValue && String(nameValue).trim();
                if (trimmed && trimmed.length > 0) {
                    player.setDynamicProperty("PrisonDoorName", trimmed);
                } else {
                    player.setDynamicProperty("PrisonDoorName", "Door");
                }

                player.sendMessage("§7[§6!§7] §aSelect the second corner to create door.");
            });
            // Add block position to world dynamics prison door list (completed on second click)
        } else if (command === "remove") {
            // Show a list of existing doors (by name) and remove the selected one
            let prisonDoorDataRaw = world.getDynamicProperty("PrisonDoors");
            let prisonDoorData;
            try {
                prisonDoorData = prisonDoorDataRaw ? JSON.parse(prisonDoorDataRaw) : [];
            } catch (error) {
                prisonDoorData = [];
            }

            if (!Array.isArray(prisonDoorData) || prisonDoorData.length === 0) {
                player.sendMessage("§7[§6!§7] §cDoors not found!");
                return;
            }

            const removeForm = new ActionFormData();
            removeForm.title("Remove Door");
            removeForm.body("Select a door to remove:");

            const doorIndices = [];

            prisonDoorData.forEach((entry, index) => {
                let name = "Door";
                let pos1;

                if (entry && entry.name && entry.pos1 && entry.pos2) {
                    name = String(entry.name);
                    pos1 = entry.pos1;
                } else if (Array.isArray(entry) && entry.length === 2) {
                    // Legacy format: [pos1, pos2]
                    pos1 = entry[0];
                }

                if (!pos1) {
                    name = `Unknown Door #${index + 1}`;
                } else {
                    name = name || "Door";
                }

                removeForm.button(name);
                doorIndices.push(index);
            });

            removeForm.show(player).then((removeResponse) => {
                if (removeResponse.canceled) return;

                const sel = removeResponse.selection;
                if (sel === undefined || sel === null) return;

                const doorIndex = doorIndices[sel];
                const removed = prisonDoorData.splice(doorIndex, 1)[0];
                world.setDynamicProperty("PrisonDoors", JSON.stringify(prisonDoorData));

                let removedName = "Door";
                if (removed && removed.name) {
                    removedName = String(removed.name);
                }

                player.sendMessage(`§7[§6!§7] §4Removed door: ${removedName}`);
                notifier?.sendMessage?.(`§7[§u!§7] §oDoor '${removedName}' removed by ${player.name}.`);
            });
        } else if (command === "toggle") {
            // Open/Close door page: select door by name, then choose open or close
            let prisonDoorDataRaw = world.getDynamicProperty("PrisonDoors");
            let prisonDoorData;
            try {
                prisonDoorData = prisonDoorDataRaw ? JSON.parse(prisonDoorDataRaw) : [];
            } catch (error) {
                prisonDoorData = [];
            }

            if (!Array.isArray(prisonDoorData) || prisonDoorData.length === 0) {
                player.sendMessage("§7[§6!§7] §cDoors not found!");
                return;
            }

            const selectForm = new ActionFormData();
            selectForm.title("Door Control");
            selectForm.body("Select a door to open or close:");

            const doorIndices = [];
            const dim = player.dimension;

            prisonDoorData.forEach((entry, index) => {
                let name = "Door";
                let pos1;
                let pos2;
                let blockType;

                if (entry && entry.name && entry.pos1 && entry.pos2) {
                    name = String(entry.name);
                    pos1 = entry.pos1;
                    pos2 = entry.pos2;
                    blockType = entry.blockType;
                } else if (Array.isArray(entry) && entry.length === 2) {
                    // Legacy format: [pos1, pos2]
                    pos1 = entry[0];
                    pos2 = entry[1];
                }

                if (!pos1 || !pos2) {
                    name = `Unknown Door #${index + 1}`;
                } else {
                    name = name || "Door";
                }

                // Determine current door state (open/closed) based on blocks in region
                let statusText = "§aClosed"; // green for closed
                if (pos1 && pos2) {
                    if (!blockType) {
                        const block = dim.getBlock(pos1);
                        blockType = block?.typeId ?? "minecraft:iron_bars";
                    }

                    const x1 = Math.floor(Math.min(pos1.x, pos2.x));
                    const y1 = Math.floor(Math.min(pos1.y, pos2.y));
                    const z1 = Math.floor(Math.min(pos1.z, pos2.z));
                    const x2 = Math.floor(Math.max(pos1.x, pos2.x));
                    const y2 = Math.floor(Math.max(pos1.y, pos2.y));
                    const z2 = Math.floor(Math.max(pos1.z, pos2.z));

                    let isOpen = true;
                    outer: for (let x = x1; x <= x2; x++) {
                        for (let y = y1; y <= y2; y++) {
                            for (let z = z1; z <= z2; z++) {
                                const b = dim.getBlock({ x, y, z });
                                if (b && b.typeId === blockType) {
                                    isOpen = false;
                                    break outer;
                                }
                            }
                        }
                    }

                    statusText = isOpen ? "§cOpen" : "§aClosed"; // red for open, green for closed
                }

                selectForm.button(`${name} ${statusText}`);
                doorIndices.push(index);
            });

            selectForm.show(player).then((selectResponse) => {
                if (selectResponse.canceled) return;

                const sel = selectResponse.selection;
                if (sel === undefined || sel === null) return;

                const doorIndex = doorIndices[sel];
                const doorEntry = prisonDoorData[doorIndex];
                if (!doorEntry) return;

                // Normalize door data
                let pos1;
                let pos2;
                let blockType;
                let doorName = "Door";

                if (doorEntry && doorEntry.pos1 && doorEntry.pos2) {
                    pos1 = doorEntry.pos1;
                    pos2 = doorEntry.pos2;
                    blockType = doorEntry.blockType;
                    if (doorEntry.name) doorName = String(doorEntry.name);
                } else if (Array.isArray(doorEntry) && doorEntry.length === 2) {
                    pos1 = doorEntry[0];
                    pos2 = doorEntry[1];
                }

                if (!pos1 || !pos2) {
                    player.sendMessage("§7[§6!§7] §cInvalid door entry!");
                    return;
                }

                // If blockType not stored (legacy), try to infer from current world state
                if (!blockType) {
                    const dim = player.dimension;
                    const block = dim.getBlock(pos1);
                    blockType = block?.typeId ?? "minecraft:iron_bars";
                }

                const x1 = Math.floor(Math.min(pos1.x, pos2.x));
                const y1 = Math.floor(Math.min(pos1.y, pos2.y));
                const z1 = Math.floor(Math.min(pos1.z, pos2.z));
                const x2 = Math.floor(Math.max(pos1.x, pos2.x));
                const y2 = Math.floor(Math.max(pos1.y, pos2.y));
                const z2 = Math.floor(Math.max(pos1.z, pos2.z));

                const actionForm = new ActionFormData();
                actionForm.title(doorName);
                actionForm.body("Choose an action for this door:");
                actionForm.button("Open door");
                actionForm.button("Close door");

                actionForm.show(player).then((actionResponse) => {
                    if (actionResponse.canceled) return;

                    const actionSel = actionResponse.selection;
                    if (actionSel === 0) {
                        // Open: replace closed blocks with air
                        player.dimension.runCommand(
                            `fill ${x1} ${y1} ${z1} ${x2} ${y2} ${z2} air 0 replace ${blockType} 0`
                        );
                        player.sendMessage(`§7[§6!§7] §a${doorName} door opened.`);
                        notifier?.sendMessage?.(`§7[§u!§7] §o${player.name} opened the ${doorName} door.`);
                    } else if (actionSel === 1) {
                        // Close: replace air with the stored block type
                        player.dimension.runCommand(
                            `fill ${x1} ${y1} ${z1} ${x2} ${y2} ${z2} ${blockType} 0 replace air 0`
                        );
                        player.sendMessage(`§7[§6!§7] §a${doorName} door closed.`);
                        notifier?.sendMessage?.(`§7[§u!§7] §o${player.name} closed the ${doorName} door.`);
                    }
                });
            });
        }
    });
}
function temporarilyToggleDoor(player, notifier, doorEntry, autoClose = false) {
    let pos1;
    let pos2;
    let blockType;
    let doorName = "Door";

    if (doorEntry && doorEntry.pos1 && doorEntry.pos2) {
        pos1 = doorEntry.pos1;
        pos2 = doorEntry.pos2;
        blockType = doorEntry.blockType;
        if (doorEntry.name) doorName = String(doorEntry.name);
    } else if (Array.isArray(doorEntry) && doorEntry.length === 2) {
        pos1 = doorEntry[0];
        pos2 = doorEntry[1];
    }

    if (!pos1 || !pos2) {
        player.sendMessage("§7[§6!§7] §cInvalid door entry!");
        return;
    }

    // If blockType not stored (legacy), try to infer from current world state
    if (!blockType) {
        const dim = player.dimension;
        const block = dim.getBlock(pos1);
        blockType = block?.typeId ?? "minecraft:iron_bars";
    }

    const x1 = Math.floor(Math.min(pos1.x, pos2.x));
    const y1 = Math.floor(Math.min(pos1.y, pos2.y));
    const z1 = Math.floor(Math.min(pos1.z, pos2.z));
    const x2 = Math.floor(Math.max(pos1.x, pos2.x));
    const y2 = Math.floor(Math.max(pos1.y, pos2.y));
    const z2 = Math.floor(Math.max(pos1.z, pos2.z));

    // Open immediately
    player.dimension.runCommand(
        `fill ${x1} ${y1} ${z1} ${x2} ${y2} ${z2} air 0 replace ${blockType} 0`
    );
    player.sendMessage(`§7[§6!§7] §a${doorName} door temporarily opened.`);
    notifier?.sendMessage?.(`§7[§u!§7] §o${player.name} temporarily opened the ${doorName} door.`);

    if (autoClose) {
        // Close again after 5 seconds (100 ticks)
        system.runTimeout(() => {
            try {
                player.dimension.runCommand(
                    `fill ${x1} ${y1} ${z1} ${x2} ${y2} ${z2} ${blockType} 0 replace air 0`
                );
            } catch (e) {
                // Dimension/player may no longer be valid; ignore
            }
        }, 100);
    }
}

export { rightClickEvent };