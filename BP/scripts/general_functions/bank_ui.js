import { world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

export function bankUi(player, Noah, level) {
  const bank = new ActionFormData();

  bank.title("Bank");
  bank.button("Transfer", `textures/tfg-icons-/t-/${level}-/default-/t${level}-default-transfer`);
  bank.button("Logs", `textures/tfg-icons-/t-/${level}-/default-/t${level}-default-transactions`);

  bank.show(player).then((response) => {
    if (response.selection === 0) {
      transfer(player, Noah);
    } else if (response.selection === 1) {
      bankLogs(player);
    }
  });
}

function bankLogs(player) {
  const bankLog = player.getDynamicProperty("BankLogs");
  if (bankLog == null) {
    player.sendMessage("§7[§6!§7] §cLogs not found!");
    return;
  }

  const bankLogJSON = JSON.parse(bankLog);
  const logOrderDetails = [];

  const bankLogUi = new ActionFormData();
  bankLogUi.title("Bank Logs");
  bankLogUi.body("Transfer Logs");

  for (let i = bankLogJSON.length - 1; i >= 0; i--) {
    const gainOrLose = bankLogJSON[i].amount > 0 ? "§a" : "§c";
    if (bankLogJSON[i].reciever != null) {
      bankLogUi.button(`§l§6${bankLogJSON[i].reciever} ${gainOrLose}${bankLogJSON[i].amount}`);
      logOrderDetails.push(bankLogJSON[i]);
    } else {
      bankLogUi.button(`§l§6${bankLogJSON[i].sender} ${gainOrLose}+${bankLogJSON[i].amount}`);
      logOrderDetails.push(bankLogJSON[i]);
    }
  }

  bankLogUi.show(player).then((response) => {
    const logDetails = new ActionFormData();
    logDetails.title("Log Details");

    const note = logOrderDetails[response.selection].note;
    const cashUsed = logOrderDetails[response.selection].amount;
    if (logOrderDetails[response.selection].reciever != null) {
      const reciever = logOrderDetails[response.selection].reciever;
      if (note) {
        logDetails.body(`§7Sent: §c§l$${-cashUsed}§r\n§7To: §6${reciever}§r\n§7Note: "§8§o${note}§r§7"`);
      } else {
        logDetails.body(`§7Sent: §c§l$${-cashUsed}§r\n§7To: §6${reciever}`);
      }
    } else {
      const sender = logOrderDetails[response.selection].sender;
      if (note) {
        logDetails.body(`§7Received: §a§l$${cashUsed}§r\n§7From: §6${sender}§r\n§7Note: "§8§o${note}§r§7"`);
      } else {
        logDetails.body(`§7Received: §a§l$${cashUsed}§r\n§7From: §6${sender}`);
      }
    }
    logDetails.button("Close");
    logDetails.show(player);
  });
}

function transfer(player, Noah) {
  const onlinePlayers = world.getAllPlayers();
  const uiPlayerList = [];
  const cashDataRaw = world.getDynamicProperty("Cash");
  const cashData = cashDataRaw ? JSON.parse(cashDataRaw) : {};
  const playerCash = cashData[player.name] ?? 0;

  for (const playerList of onlinePlayers) {
    if (playerList.name === player.name) continue;
    uiPlayerList.push({ name: playerList.name });
  }

  if (uiPlayerList.length === 0) {
    player.sendMessage("§7[§6!§7] §cNo other players online!");
    return;
  }

  const transferUi = new ModalFormData();
  transferUi.title(`Transfer`);
  transferUi.label(`Balance: §a$${playerCash}`);
  transferUi.dropdown("Player", uiPlayerList.map((p) => p.name));
  transferUi.textField("Money", "Amount to transfer");
  transferUi.textField("Note", "Optional - up to 32 characters");

  transferUi.show(player).then((response) => {
    const [label, playerTransaction, amountToTransferString, playerNote] = response.formValues;
    if (response.canceled || !response.formValues) return;
    const transferTarget = world.getAllPlayers().find((p) => p.name === uiPlayerList[playerTransaction].name);
    let amountToTransferInt = parseInt(amountToTransferString);

    if (isNaN(amountToTransferInt)) {
      player.sendMessage("§7[§6!§7] §cInvalid amount, please enter a whole number!");
      return;
    }
    if (playerNote.length > 32) {
      player.sendMessage("§7[§6!§7] §cNote exceeded character limit!");
      return;
    }
    player.sendMessage(`§7[§6!§7] §7Transferring §a§l$${amountToTransferInt} §r§7to §e${uiPlayerList[playerTransaction].name}§7...`);

    const currentCashRaw = world.getDynamicProperty("Cash");
    const currentCash = currentCashRaw ? JSON.parse(currentCashRaw) : {};
    const senderCash = currentCash[player.name] ?? 0;
    const transferTargetCash = currentCash[transferTarget.name] ?? 0;

    if (senderCash < amountToTransferInt) {
      player.sendMessage("§§7[§6!§7] §cYou're broke!!!");
      return;
    }
    if (amountToTransferInt <= 0) {
      player.sendMessage("§7[§6!§7] §cInvalid amount, please enter a positive number!");
      return;
    }

    currentCash[player.name] = senderCash - amountToTransferInt;
    currentCash[transferTarget.name] = transferTargetCash + amountToTransferInt;
    world.setDynamicProperty("Cash", JSON.stringify(currentCash));

    let transferTargetBankLogs = transferTarget.getDynamicProperty("BankLogs");
    const sendersLog = {
      sender: player.name,
      amount: amountToTransferInt,
      note: playerNote ? playerNote : null
    };

    if (transferTargetBankLogs === undefined) {
      transferTargetBankLogs = [];
      transferTargetBankLogs.push(sendersLog);
      transferTarget.setDynamicProperty("BankLogs", JSON.stringify(transferTargetBankLogs));
    } else {
      transferTargetBankLogs = JSON.parse(transferTargetBankLogs);
      transferTargetBankLogs.push(sendersLog);
      transferTarget.setDynamicProperty("BankLogs", JSON.stringify(transferTargetBankLogs));
    }

    let playerBankLogs = player.getDynamicProperty("BankLogs");
    const playersLog = {
      reciever: transferTarget.name,
      amount: -amountToTransferInt,
      note: playerNote ? playerNote : null
    };

    if (playerBankLogs === undefined) {
      playerBankLogs = [];
      playerBankLogs.push(playersLog);
      player.setDynamicProperty("BankLogs", JSON.stringify(playerBankLogs));
    } else {
      playerBankLogs = JSON.parse(playerBankLogs);
      playerBankLogs.push(playersLog);
      player.setDynamicProperty("BankLogs", JSON.stringify(playerBankLogs));
    }

    player.sendMessage("§7[§6!§7] §aSuccessful transaction!");
    if (playerNote) {
      transferTarget.sendMessage(`§7[§6!§7] §e${player.name} §7sent you §l§a$${amountToTransferInt} §r§7with the note "§o§d${playerNote}§r§7"!`);
    } else {
      transferTarget.sendMessage(`§7[§6!§7] §e${player.name} §7sent you §l§a$${amountToTransferInt}§r§7!`);
    }
    transferTarget.playSound("random.levelup");
    player.playSound("note.pling");
    Noah?.sendMessage?.(`§7[§u!§7] §o${player.name} sent ${amountToTransferInt} to ${uiPlayerList[playerTransaction].name}.`);
  });
}