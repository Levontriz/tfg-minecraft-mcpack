import { world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { TPA_REQUEST_TIMEOUT } from "../config.js";

export function tpaScreen(player, Noah) {
    // Create the screen that lets you select either send a tpa, view received requests, view sent requests
    const tpaScreenUI = new ActionFormData()
    tpaScreenUI.title("Teleport to a player")
    tpaScreenUI.button("Send a teleport request")
    tpaScreenUI.button("Incoming Requests")
    tpaScreenUI.button("Outgoing Requests")
    tpaScreenUI.show(player).then((response) => {
        if (response.canceled) return;
        if (response.selection == 0) {
            openSendTpaForm(player, Noah)
        } else if (response.selection == 1) {
            // View received TPA requests
            viewReceivedTpas(player, Noah)
        } else if (response.selection == 2) {
            // View sent TPA requests
            viewSentTpas(player, Noah)
        }
    })

}

// ###########################################
// # ╔═══ ╔══╗ ╔╗ ╖ ╔══╕     ══╦══ ╔══╗ ╔══╗ #
// # ╚══╗ ╠══╝ ║╚╗║ ║  ║       ║   ╠══╝ ╠══╣ #
// # ═══╝ ╚═══ ╙ ╚╝ ╚══╛       ╙   ╙    ╙  ╜ #
// ###########################################

function openSendTpaForm(player, Noah) {
    // Get all players in the world (currently includes yourself, for testing)
    const uiPlayerList = world.getAllPlayers()
        .filter(p => p.name != player.name)
        .map(p => p.name)

    if (uiPlayerList.length === 0) {
        player.sendMessage("§7[§6!§7] §cNo other players online!");
        return;
    }

    const tpaUI = new ModalFormData();
    tpaUI.title("Send a TPA")
    tpaUI.dropdown("Player", uiPlayerList)

    tpaUI.show(player).then((response) => {
        if (response.canceled) return;

        const [targetPlayerIndex] = response.formValues
        const targetPlayerName = uiPlayerList[targetPlayerIndex]

        // validateTPARequests handles expiry cleanup, notifications and persistence,
        // and hands back the current list of still-valid requests
        const validTpas = validateTPARequests("OutgoingTPARequests")

        const alreadyRequested = validTpas.some(request =>
            request.sender == player.name && request.reciever == targetPlayerName
        )

        if (alreadyRequested) {
            player.sendMessage("§7[§6!§7] §cYou have already made a request to this player!");
            return
        }

        const tpaRequest = {
            sender: player.name,
            reciever: targetPlayerName,
            sendTime: Date.now(),
            expired: false
        }

        validTpas.push(tpaRequest);
        world.setDynamicProperty("OutgoingTPARequests", JSON.stringify({ tpas: validTpas }))

        const currentPlayers = world.getAllPlayers();
        const targetPlayer = currentPlayers.find(p => p.name == tpaRequest.reciever);
        if (targetPlayer) {
            targetPlayer.sendMessage(`§7[§6!§7] §eIncoming teleport request from ${tpaRequest.sender}!`);
        }
        player.sendMessage(`§7[§6!§7] §aSent teleport request to ${tpaRequest.reciever}...`)
        Noah?.sendMessage?.(`§7[§u!§7] §o${player.name} sent a teleport request to ${tpaRequest.reciever}.`);
    })
}

// ##################################################################
// # ╗  ╔ ═╦═ ╔══╗ ╓ ╓ ╓     ╔══╗ ╔══╗ ╔═══ ═╦═ ╔══╗ ╗  ╔ ╔══╗ ╔══╕ #
// # ╚╗╔╝  ║  ╠══╝ ║ ║ ║     ╠═╦╝ ╠══╝ ║     ║  ╠══╝ ╚╗╔╝ ╠══╝ ║  ║ #
// #  ╚╝  ═╩═ ╚═══ ╚═╩═╝     ╙ ╚  ╚═══ ╚═══ ═╩═ ╚═══  ╚╝  ╚═══ ╚══╛ #
// ##################################################################

function viewReceivedTpas(player, Noah) {
    const validTpas = validateTPARequests("OutgoingTPARequests")
    const receivedTPAs = validTpas.filter(tp => tp.reciever == player.name)

    if (receivedTPAs.length === 0) {
        player.sendMessage("§7[§6!§7] §cYou have no incoming requests.");
        return;
    }

    const recievedTPAUI = new ActionFormData()
    recievedTPAUI.title("Received TPA Requests")
    for (const tpa of receivedTPAs) {
        recievedTPAUI.button(`From: ${tpa.sender}`)
    }
    recievedTPAUI.show(player).then((response) => {
        if (response.canceled) return;
        // Run a function that will ask if they want to accept or deny the tpa request
        acceptOrDenyTpaRequest(player, receivedTPAs[response.selection], Noah)
    })
}

function acceptOrDenyTpaRequest(player, tpa, Noah) {
    const acceptOrDenyUI = new ActionFormData()
    acceptOrDenyUI.title(`TPA Request from ${tpa.sender}`)
    acceptOrDenyUI.button("Accept")
    acceptOrDenyUI.button("Deny")
    acceptOrDenyUI.show(player).then((response) => {
        if (response.canceled) return;

        // Re-fetch and re-validate the current list rather than relying on stale data
        const validTpas = validateTPARequests("OutgoingTPARequests")
        const currentPlayers = world.getAllPlayers();
        const sender = currentPlayers.find(p => p.name == tpa.sender);

        let shouldRemove = false;

        if (response.selection == 0) {
            // Accept the tpa request
            if (sender) {
                sender.sendMessage(`§7[§6!§7] §eTeleported to ${tpa.reciever}!`);
                Noah?.sendMessage?.(`§7[§u!§7] §o${tpa.sender} accepted ${tpa.reciever}'s teleport request.`);
                player.sendMessage(`§7[§6!§7] §eTeleported to ${tpa.reciever}!`);
                sender.teleport(player.location);
                shouldRemove = true;
            } else {
                player.sendMessage(`§7[§6!§7] §4TPA failed, ${tpa.sender} disconnected!`);
            }
        } else if (response.selection == 1) {
            // Deny the tpa request
            if (sender) {
                sender.sendMessage(`§7[§6!§7] §c${tpa.reciever} denied your teleport request.`);
                Noah?.sendMessage?.(`§7[§u!§7] §o${tpa.sender} denied ${tpa.reciever}'s teleport request.`);
                player.sendMessage(`§7[§6!§7] §cDenied ${tpa.sender}'s teleport request.`);
            }
            shouldRemove = true;
        }

        if (shouldRemove) {
            const remainingTpas = validTpas.filter(tp => tp !== tpa && !(tp.sender == tpa.sender && tp.reciever == tpa.reciever && tp.sendTime == tpa.sendTime))
            world.setDynamicProperty("OutgoingTPARequests", JSON.stringify({ tpas: remainingTpas }))
        }
    })
}

// ################################################
// # ╗  ╔ ═╦═ ╔══╗ ╓ ╓ ╓     ╔═══ ╔══╗ ╔╗ ╖ ══╦══ #
// # ╚╗╔╝  ║  ╠══╝ ║ ║ ║     ╚══╗ ╠══╝ ║╚╗║   ║   #
// #  ╚╝  ═╩═ ╚═══ ╚═╩═╝     ═══╝ ╚═══ ╙ ╚╝   ╙   #
// ################################################

function viewSentTpas(player, Noah) {
    const validTpas = validateTPARequests("OutgoingTPARequests")
    const sentTPAs = validTpas.filter(tp => tp.sender == player.name)

    if (sentTPAs.length === 0) {
        player.sendMessage("§7[§6!§7] §cYou have no outgoing TPA requests.");
        return;
    }

    const sentTPAUI = new ActionFormData()
    sentTPAUI.title("Sent TPA Requests")
    for (const tpa of sentTPAs) {
        sentTPAUI.button(`To: ${tpa.reciever}`)
    }
    sentTPAUI.show(player).then((response) => {
        if (response.canceled) return;
        cancelSentTpaRequest(player, sentTPAs[response.selection], Noah)
    })
}

function cancelSentTpaRequest(player, tpa, Noah) {
    const cancelUI = new ActionFormData()
    cancelUI.title(`TPA Request to ${tpa.reciever}`)
    cancelUI.button("Cancel request")
    cancelUI.button("Back")
    cancelUI.show(player).then((response) => {
        if (response.canceled) return;

        if (response.selection == 0) {
            // Re-fetch and re-validate so we're not working off a stale list
            const validTpas = validateTPARequests("OutgoingTPARequests")
            const remainingTpas = validTpas.filter(tp => !(tp.sender == tpa.sender && tp.reciever == tpa.reciever && tp.sendTime == tpa.sendTime))

            world.setDynamicProperty("OutgoingTPARequests", JSON.stringify({ tpas: remainingTpas }))

            const currentPlayers = world.getAllPlayers();
            const receiver = currentPlayers.find(p => p.name == tpa.reciever);
            if (receiver) {
                receiver.sendMessage(`§7[§6!§7] §c${tpa.sender}'s teleport request was cancelled.`);
            }
            Noah?.sendMessage?.(`§7[§u!§7] §o${player.name} cancelled their teleport request to ${tpa.reciever}.`);
            player.sendMessage(`§7[§6!§7] §cCancelled your teleport request to ${tpa.reciever}.`);
        }
        // selection == 1 (Back) just closes without changes
    })
}

// Loads the dynamic property, expires any stale requests (notifying their senders
// and removing them), persists the cleaned-up list, and returns the still-valid tpas.
function validateTPARequests(propertyID) {
    const dynamicData = formatDynamicValueOfJSON(propertyID)
    const currentPlayers = world.getAllPlayers();
    const now = Date.now();
    let changed = false;

    const validTpas = dynamicData.tpas.filter(request => {
        const isExpired = request.expired || (request.sendTime + TPA_REQUEST_TIMEOUT < now);

        if (isExpired) {
            changed = true;
            const sender = currentPlayers.find(p => p.name == request.sender);
            if (sender) {
                sender.sendMessage(`§7[§6!§7] §cYour teleport request to ${request.reciever} has expired.`);
            }
            Noah?.sendMessage?.(`§7[§u!§7] §o${request.sender}'s teleport request to ${request.reciever} has expired.`);
            return false;
        }

        return true;
    })

    if (changed) {
        world.setDynamicProperty(propertyID, JSON.stringify({ tpas: validTpas }))
    }

    return validTpas;
}

function formatDynamicValueOfJSON(propertyID) {
    let dynamicProperty = world.getDynamicProperty(propertyID)
    if (dynamicProperty === undefined || dynamicProperty === null) return {
        tpas: []
    }; // If null return "null"
    return JSON.parse(dynamicProperty);
}