import { world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

function adminBankUi(player) {
  const bankSelectionUi = new ActionFormData();
  bankSelectionUi.title(`Admin Bank`);
  bankSelectionUi.button("Adjust Player", "textures/tfg-icons-/t-/4-/unused-/t4-unused-transfer")
  bankSelectionUi.button("Admin Logs", "textures/tfg-icons-/t-/4-/unused-/t4-unused-transactions")

  bankSelectionUi.show(player).then((response) => {
    if (response.selection == 0) {
      adminBankAdjustment(player);
    } else if (response.selection == 1) {
      adminBankLogs(player);
    }
  })
}

function adminBankLogs(player) {
  let adminBankLogs = world.getDynamicProperty("adminBankLogs");

  if (adminBankLogs == null) {
    player.sendMessage("§7[§6!§7] §cNo logs found!");
    return;
  }

  let bankLogJSON = JSON.parse(adminBankLogs);

  let logOrderDetails = [];


  const logUi = new ActionFormData();
  logUi.title(`Bank Logs`);
  logUi.body("");

  for (let i = bankLogJSON.length - 1; i >= 0; i--) {
    let gainOrLose = (bankLogJSON[i].amount > 0) ? "§a+" : "§c"
    logUi.button(`§l§6${bankLogJSON[i].reciever} ${gainOrLose}${bankLogJSON[i].amount}`)
  }
  logUi.show(player);
}

function adminBankAdjustment(player) {
  const onlinePlayers = world.getAllPlayers();
  let uiPlayerListAdmin = [ /*{ name: player.name } */];
  const cashDataRaw = world.getDynamicProperty("Cash");
  const cashData = cashDataRaw ? JSON.parse(cashDataRaw) : {};
  const playerCash = cashData[player.name];

  for (let playerList of onlinePlayers) {
    let addToPlayerList = { name: playerList.name };
    uiPlayerListAdmin.push(addToPlayerList);
  }

  console.warn(JSON.stringify(uiPlayerListAdmin))

  const bankUiPanel = new ModalFormData();
  bankUiPanel.title(`Admin Bank`);
  bankUiPanel.label(`Balance: §a$${playerCash}`);
  bankUiPanel.dropdown(
    "Player",
    uiPlayerListAdmin.map((player) => player["name"])
  );
  bankUiPanel.toggle("Off: Add \nOn: Remove");
  bankUiPanel.textField("Money", "Amount to add/remove");
  bankUiPanel.show(player).then((response) => {
    const [label, targetPlayerName, onOffToggle, amountInString] = response.formValues;
    if (response.canceled || !response.formValues) return;


    const target = world
      .getAllPlayers()
      .find((player) => player.name === uiPlayerListAdmin[targetPlayerName]["name"]);
    var amountInInt = parseInt(amountInString);

    if (isNaN(amountInInt)) {
      player.sendMessage("§7[§6!§7] §cInvalid amount, please enter a whole number!");
      return;
    }

    const currentCashRaw = world.getDynamicProperty("Cash");
    const currentCash = currentCashRaw ? JSON.parse(currentCashRaw) : {};
    const targetCash = currentCash[target.name] ?? 0;

    if (!onOffToggle) {
      currentCash[target.name] = targetCash + amountInInt;
      world.setDynamicProperty("Cash", JSON.stringify(currentCash));
      player.sendMessage(`§7[§6!§7] §aIncreased §7§o${target.name}§r§a's balance by §e$${amountInInt}§a!`);
      player.playSound("note.pling");
      target.sendMessage(`§7[§6!§7] §a§lServer has adjusted your balance by §e+$${amountInInt}§a.`)
      // §6Server has adjusted your balance by §a+§f/§c-§e$100
      target.playSound("note.pling");
      // Since the toggle is off we dont change the "amountInInt" variable
    } else {
      currentCash[target.name] = targetCash - amountInInt;
      world.setDynamicProperty("Cash", JSON.stringify(currentCash));
      player.sendMessage(`§7[§6!§7] §4Decreased §7§o${target.name}§r§4's balance by §e$${amountInInt}§4!`);
      player.playSound("note.pling");
      target.sendMessage(`§7[§6!§7] §a§lServer has adjusted your balance by §e-$${amountInInt}§a.`)
      target.playSound("note.pling");
      // Since the toggle is on we change the "amountInInt" variable to a negative number for easier logging
      amountInInt = -amountInInt;
    }

    let transferTargetBankLogs = target.getDynamicProperty("BankLogs");



    const targetsLog = {
      sender: "Server",
      amount: amountInInt,
      note: "Server Adjustment"
    }



    if (transferTargetBankLogs == undefined) {
      transferTargetBankLogs = [];
      transferTargetBankLogs.push(targetsLog);
      target.setDynamicProperty("BankLogs", JSON.stringify(transferTargetBankLogs));
    } else {
      transferTargetBankLogs = JSON.parse(transferTargetBankLogs);
      transferTargetBankLogs.push(targetsLog);
      target.setDynamicProperty("BankLogs", JSON.stringify(transferTargetBankLogs));
    }

    let adminBankLogs = world.getDynamicProperty("adminBankLogs");

    const sendersLog = {
      reciever: target.name,
      amount: amountInInt,
      note: "Server Adjustment"
    }

    if (adminBankLogs == undefined) {
      adminBankLogs = [];
      adminBankLogs.push(sendersLog);
      world.setDynamicProperty("adminBankLogs", JSON.stringify(adminBankLogs));
    } else {
      adminBankLogs = JSON.parse(adminBankLogs);
      adminBankLogs.push(sendersLog);
      world.setDynamicProperty("adminBankLogs", JSON.stringify(adminBankLogs));
    }
  });
}

export { adminBankUi };