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
    player.sendMessage("§c§oNo bank logs found.");
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
        logDetails.body(`§l§aYou sent §c${-cashUsed} §ato §6${reciever} §awith the note:\n§d${note}`);
      } else {
        logDetails.body(`§l§aYou sent §c${-cashUsed} §ato §6${reciever}`);
      }
    } else {
      const sender = logOrderDetails[response.selection].sender;
      if (note) {
        logDetails.body(`§l§aYou recieved ${cashUsed} §afrom §6${sender} §awith the note:\n§d${note}`);
      } else {
        logDetails.body(`§l§aYou recieved ${cashUsed} §afrom §6${sender}`);
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

  const transferUi = new ModalFormData();
  transferUi.title(`Bank (Your cash is $${playerCash})`);
  transferUi.dropdown("Player", uiPlayerList.map((p) => p.name));
  transferUi.textField("Money", "Amount to transfer");
  transferUi.textField("Note", "Note for reciever to read");

  transferUi.show(player).then((response) => {
    const [playerTransaction, amountToTransferString, playerNote] = response.formValues;
    const transferTarget = world.getAllPlayers().find((p) => p.name === uiPlayerList[playerTransaction].name);
    let amountToTransferInt = parseInt(amountToTransferString);

    if (isNaN(amountToTransferInt)) {
      player.sendMessage("§c§oInvalid amount. Please enter a valid number.");
      return;
    }
    if (playerNote.length > 32) {
      player.sendMessage("§c§oNote must be less than 32 characters.");
      return;
    }
    player.sendMessage(`§l§aTransferring §r§e$${amountToTransferInt} §a§lto §r§7§o${uiPlayerList[playerTransaction].name}`);

    const currentCashRaw = world.getDynamicProperty("Cash");
    const currentCash = currentCashRaw ? JSON.parse(currentCashRaw) : {};
    const senderCash = currentCash[player.name] ?? 0;
    const transferTargetCash = currentCash[transferTarget.name] ?? 0;

    if (senderCash < amountToTransferInt) {
      player.sendMessage("§c§oInsufficient funds.");
      return;
    }
    if (amountToTransferInt <= 0) {
      player.sendMessage("§c§oInvalid amount. Please enter a positive number.");
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

    player.sendMessage("§a§lFinished transaction");
    if (playerNote) {
      transferTarget.sendMessage(`§l§aYou were transferred §r§e$${amountToTransferInt} §a§lfrom §r§7§o${player.name} §r§a§lwith the note §d${playerNote}!`);
    } else {
      transferTarget.sendMessage(`§l§aYou were transferred §r§e$${amountToTransferInt} §a§lfrom §r§7§o${player.name}`);
    }
    transferTarget.playSound("random.levelup");
    player.playSound("note.pling");
    Noah.sendMessage(`§7§o${player.name} transferred ${amountToTransferInt} to ${uiPlayerList[playerTransaction].name}`);
  });
}