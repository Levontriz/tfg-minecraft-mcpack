import {
  world,
  system,
  ItemStack,
  WeatherType,
  Dimension,
  Player,
  Scoreboard,
  GameMode
} from "@minecraft/server";




function clearAllRightClick(player) {
  // used in givePhoneSigniture()
  player.setDynamicProperty("rightClickSignature", false)
  player.setDynamicProperty("playerToSign")
  // used in serverUtil() under the clear option
  player.setDynamicProperty("clearSignatures", false)
  // used in clearInventoryConfig()
  player.setDynamicProperty("rightClickAddItemToWhitelist", false)
  // used in addLore()
  player.setDynamicProperty("rightClickSetLore", false)
  player.setDynamicProperty("loreToSet", "[]")
}


const payToUsePhones = [
  "tfg:cobblestphone",
  "tfg:aphone",
  "tfg:nebula_pro"
]

const phoneLevels = {
  "tfg:pda": 0,
  "tfg:cobblestphone": 1,
  "tfg:aphone": 2,
  "tfg:nebula_pro": 3
}



import { ActionFormData, ModalFormData } from '@minecraft/server-ui';

world.afterEvents.playerSpawn.subscribe((eventData) => {
  var { initialSpawn, player } = eventData;


  if (initialSpawn) {
    clearAllRightClick(player);
  }
})

world.afterEvents.itemUse.subscribe((eventData) => {
  
  const DevMode = false;

  var Noah;

  if (DevMode) {
    Noah = world.getAllPlayers().find((player) => player.name === "Levontriz2197");
  } else {
    Noah = world.getAllPlayers().find((player) => player.name === "Purtzle");
  }

  const { source, itemStack } = eventData;
  var selectedItem = source.getComponent("inventory").container.getSlot(source.selectedSlotIndex)

  const rightClickSignature = source.getDynamicProperty("rightClickSignature");
  const playerToSign = source.getDynamicProperty("playerToSign");

  const clearSignatures = source.getDynamicProperty("clearSignatures");

  const rightClickAddItemToWhitelist = source.getDynamicProperty("rightClickAddItemToWhitelist");

  const rightClickSetLore = source.getDynamicProperty("rightClickSetLore");
  const loreToSet = source.getDynamicProperty("loreToSet");

  if (rightClickSetLore) {
    selectedItem.setLore(loreToSet);
    source.sendMessage(`§l§aLore set!`);
    clearAllRightClick(source);
    return;
  }

  if (rightClickAddItemToWhitelist) {
    let itemId = selectedItem.typeId;
    let itemName = itemId.split(":")[1].split("_");
    for (var i = 0; i < itemName.length; i++) {
      // You do not need to check if i is larger than itemName length, as your for does that for you
      // Assign it back to the array
      itemName[i] = itemName[i].charAt(0).toUpperCase() + itemName[i].substring(1);     
  }

    itemName = itemName.join(" ");

    let playerWhitelist = source.getDynamicProperty("ClearWhitelist");

    if (playerWhitelist == undefined) {
      let whitelist = `["${itemId}"]`
      source.setDynamicProperty("ClearWhitelist", whitelist);
      if (itemId == "tfg:aphone") {
        source.sendMessage(`§l§6aPhone §aadded to whitelist`);
      } else {
        source.sendMessage(`§l§6${itemName} §aadded to whitelist`);
      }
      clearAllRightClick(source);

      return;
    } else {
      let whitelist = JSON.parse(playerWhitelist);
      if (whitelist.includes(itemId)) {
        source.sendMessage("§l§aItem is already in your whitelist!");
        clearAllRightClick(source);

        return;
      }
      whitelist.push(itemId);
      source.setDynamicProperty("ClearWhitelist", JSON.stringify(whitelist));
      if (itemId == "tfg:aphone") {
        source.sendMessage(`§l§6aPhone §aadded to whitelist`);
      } else {
        source.sendMessage(`§l§6${itemName} §aadded to whitelist`);
      }
      clearAllRightClick(source);

      return;
    }
  }

  if (clearSignatures) {
    clearAllRightClick(source);

    selectedItem.clearDynamicProperties();
    selectedItem.setLore([]);
    source.sendMessage("§l§aSuccessfully cleared all data")
    return;
  }

  if (rightClickSignature) {
    try {
      selectedItem.setDynamicProperty("Owner", playerToSign);
      selectedItem.setLore([`Owned by ${playerToSign}`]);
      source.sendMessage("§l§aPlayer successfully added to dynamic property");
      clearAllRightClick(source);

      return;
    } catch (error) {
      console.log(error);
      source.sendMessage("§c§lPlease use a non-stackable item and try again!");
      return;
    }

  }

  if (payToUsePhones.includes(itemStack.typeId)) {
    if (!selectedItem.getDynamicPropertyIds().includes("Owner")) {
      source.sendMessage("§c§lThis PDA has not been signed yet, stop trying to cheat items in!");
      Noah.sendMessage(`§7§o${source.name} just tried to use an unsigned phone!`)
      return;
    }
    let signature = selectedItem.getDynamicProperty("Owner")
    if (signature === source.name) {
      let phoneLevel = phoneLevels[itemStack.typeId]
      selectedItem.setLore([`Owned by ${signature}`]);
      mainUi(source, Noah, phoneLevel)
      return;
    } else {
      source.sendMessage("§c§lThis PDA belongs to another player. You have been reported to Noah!")
      Noah.sendMessage(`§7§o${source.name} tried to use a phone assigned to ${signature}!`)
      return;
    }
  } else if (itemStack.typeId === "tfg:pda") {
    mainUi(source, Noah, 0)
    return;
  } else if (itemStack.typeId === "tfg:admin_pda") {
    if (source.name === "Purtzle" || source.name === "Levontriz2197") {
      adminUi(source, Noah)
      return;
    } else {
      source.sendMessage("§c§oYou must be an admin to use this item!")
      Noah.sendMessage(`§7§oAyo gang ${source.name} just used a fucken admin phone. Idk how :) - From Mr. Pookie himself (Levon)`)
      return;
    };
  }


});

function setHome(player, Noah) {
  let homeX = world.scoreboard.getObjective("homeX");
  let homeY = world.scoreboard.getObjective("homeY");
  let homeZ = world.scoreboard.getObjective("homeZ");

  homeX.setScore(player, (Math.floor(player.location.x)));
  homeY.setScore(player, Math.round(player.location.y));
  homeZ.setScore(player, (Math.floor(player.location.z)));

  player.sendMessage("§l§aHome set successfully!");
  Noah.sendMessage(`§7§o${player.name} set their home to ${homeX.getScore(player)}, ${homeY.getScore(player)}, ${homeZ.getScore(player)}!`);
}

function home(player, Noah) {
  let homeX = world.scoreboard.getObjective("homeX");
  let homeY = world.scoreboard.getObjective("homeY");
  let homeZ = world.scoreboard.getObjective("homeZ");

  if (homeX.getScore(player) === 0 || homeY.getScore(player) === 0 || homeZ.getScore(player) === 0) {
    player.sendMessage("§c§oYou haven't set a home yet. Use sethome to set one!");
    Noah.sendMessage(`§7§o${player.name} tried to teleport home but doesnt have one`);
    return;
  }

  player.teleport(
    { x: homeX.getScore(player) + 0.5, y: homeY.getScore(player), z: homeZ.getScore(player) + 0.5 },
    { dimension: world.getDimension("overworld") }
  );
  player.sendMessage("§l§aTeleported to your home!");
  Noah.sendMessage(`§7§o${player.name} teleported to ${homeX.getScore(player)}, ${homeY.getScore(player)}, ${homeZ.getScore(player)}! (Their home)`);
}

function adminBankUi(player) {
  const onlinePlayers = world.getAllPlayers();
  let uiPlayerListAdmin = [ /*{ name: player.name } */];
  let CashV2 = world.scoreboard.getObjective("CashV2");
  let playerCash = CashV2.getScore(player)

  for (let playerList of onlinePlayers) {
    let addToPlayerList = { name: playerList.name };

    uiPlayerListAdmin.push(addToPlayerList);
  }

  const bankUiPanel = new ModalFormData();
  bankUiPanel.title(`Admin Bank (You currently have $${playerCash})`);
  bankUiPanel.dropdown(
    "Player",
    uiPlayerListAdmin.map((player) => player.name)
  );
  bankUiPanel.toggle("Off: Add \nOn: Remove");
  bankUiPanel.textField("Money", "Amount to add/remove");
  bankUiPanel.show(player).then((response) => {
    const [targetPlayerName, onOffToggle, amountInString] = response.formValues;

    const target = world
      .getAllPlayers()
      .find((player) => player.name === uiPlayerListAdmin[targetPlayerName].name);
    let amountInInt = parseInt(amountInString);

    if (isNaN(amountInInt)) {
      player.sendMessage("§c§oInvalid amount. Please enter a valid number.");
      return;
    }

    const CashV2 = world.scoreboard.getObjective("CashV2");
    const targetCashV2 = CashV2.getScore(target);

    if (!onOffToggle) {
      CashV2.setScore(target, targetCashV2 + amountInInt)
      player.sendMessage(`§l§aYou added §r§e$${amountInInt} §a§lto §r§7§o${target.name}`);
      player.playSound("random.levelup");
      target.sendMessage(`§l§aYou have had §r§e$${amountInInt} §a§ladded to your bank account!`)
      target.playSound("random.levelup");
    } else {
      CashV2.setScore(target, targetCashV2 - amountInInt)
      player.sendMessage(`§l§aYou removed §r§e$${amountInInt} §a§lfrom §r§7§o${target.name}`);
      player.playSound("random.levelup");
      target.sendMessage(`§l§aYou have had §r§e$${amountInInt} §a§lremoved to your bank account!`)
      target.playSound("random.levelup");
    }
  });
}

function serverUtil(player, Noah) {
  let CommandOrder = [];

  const serverUtilPanel = new ActionFormData();
  serverUtilPanel.title = "Server Utility"
  serverUtilPanel.body = "What function to run?"
  serverUtilPanel.button("Clear Lag");
  CommandOrder.push("ClearLag");
  serverUtilPanel.button("Money");
  CommandOrder.push("Money");
  serverUtilPanel.button("Add lore");
  CommandOrder.push("AddLore");
  serverUtilPanel.button("give Phone Signiture");
  CommandOrder.push("GivePhoneSigniture")
  serverUtilPanel.button("Clear Signatures");
  CommandOrder.push("ClearSignatures");
  serverUtilPanel.button("Clear Config");
  CommandOrder.push("ClearConfig");
  serverUtilPanel.button("Set Home");
  CommandOrder.push("SetHome");

  serverUtilPanel.show(player).then((response) => {
    let command = CommandOrder[response.selection];
    if (command == "ClearLag") {
      player.runCommand("kill @e[type=item]");
      player.runCommand("kill @e[type=xp_orb]");
      player.runCommand("kill @e[type=arrow]");
      player.runCommand("kill @e[type=wind_charge_projectile]");
      player.runCommand("kill @e[type=area_effect_cloud]");
      player.runCommand("kill @e[type=thrown_trident]");
      player.sendMessage("§l§aRemoved all lag causing entities");
    } else if (command == "AddLore") {
      addLore(player);
    } else if (command == "ClearConfig") {
      clearInventoryConfig(player, Noah);
    } else if (command == "SetHome") {
      setHome(player, Noah);
    } else if (command == "Money") {
      adminBankUi(player);
    } else if (command == "GivePhoneSigniture") {
      givePhoneSigniture(player)
    } else if (command == "ClearSignatures") {

      clearAllRightClick(player);
      
      player.setDynamicProperty("clearSignatures", true)
      player.sendMessage("§l§aRight click a non-stackable item in your inventory to remove all signatures.")
    }
  });
}

function addLore(player) {
  var loreLineCount = [];

  const preLoreAdd = new ActionFormData();
  preLoreAdd.title("Add Lore");
  preLoreAdd.body("How many lines of lore would you like to add?")
  for (let i = 0; i < 20; i++) {
    preLoreAdd.button(`Add ${i+1} line/s of lore`)
    loreLineCount.push(i);
  }

  preLoreAdd.show(player).then((response) => {
    var loreLineCountNum = loreLineCount[response.selection];
    const loreForm = new ModalFormData();
    loreForm.title("Add Lore");
    console.log(loreLineCountNum)
    for (let i = 0; i < loreLineCountNum+1; i++) {
      loreForm.textField(`Lore`, `Lore line ${i+1}`)
    }
    loreForm.show(player).then((response) => {
      for (let i of response.formValues) {
        loreToSet.push(i);
      }
      clearAllRightClick(player);

      player.setDynamicProperty("rightClickSetLore", true);
      player.sendMessage(`Right click an item to add the lore`);
    });
  });
}
function debugMenu(player) {
  const debugPanel = new ActionFormData();
  debugPanel.title("Debug Menu");
  debugPanel.body("What function to run?");
  debugPanel.button("View My Dynamic");
  debugPanel.button("Clear My Dynamic");
  debugPanel.button("Set Incoming to Levontriz");
  debugPanel.button("Set Outgoing to Levontriz");

  debugPanel.show(player).then((response) => {
    if (response.selection == 0) {
      for (let id of player.getDynamicPropertyIds()) {
        player.sendMessage(id + ":")
        player.sendMessage(player.getDynamicProperty(id));
      }
    }
    if (response.selection == 1) {
      for (let id of player.getDynamicPropertyIds()) {
        player.setDynamicProperty(id);
      }
      player.sendMessage("§l§aCleared all dynamic properties.")
    }
    if (response.selection == 2) {
      player.setDynamicProperty("IncomingRequest", "[\"Levontriz2197\"]");
      player.sendMessage("§l§aSet Incoming request to Levontriz2197.")
    }
    if (response.selection == 3) {
      player.setDynamicProperty("OutgoingRequest", "[\"Levontriz2197\", \"Purtzle\"]");
      player.sendMessage("§l§aSet Outgoing request to Levontriz2197.")
    }
  });
}

function adminUi(player, Noah) {
  let CommandOrder = [];

  const adminUiPanel = new ActionFormData();
  adminUiPanel.title("Admin");
  adminUiPanel.body("What function to run?");
  adminUiPanel.button("Home");
  CommandOrder.push("Home");
  adminUiPanel.button("Clear");
  CommandOrder.push("Clear");
  adminUiPanel.button("Fast Travel");
  CommandOrder.push("FastTravel");
  adminUiPanel.button("Speed");
  CommandOrder.push("Speed");
  adminUiPanel.button("Server Utility");
  CommandOrder.push("ServerUtility");
  adminUiPanel.button("Debug Panel");
  CommandOrder.push("DebugPanel");


  adminUiPanel.show(player).then((response) => {
    let command = CommandOrder[response.selection];

    if (command == "Speed") {
      player.runCommand("effect @s speed 30 255 true");
      player.sendMessage("§l§aSpeed boost");
    } else if (command == "ServerUtility") {
      serverUtil(player, Noah);
    } else if (command == "Home") {
      home(player, Noah);
    } else if (command == "Clear") {
      clearInventory(player, Noah);
    } else if (command == "FastTravel") {
      fastTravelUi(player, Noah, 3)
    } else if (command == "DebugPanel") {
      debugMenu(player);
    }
    return;
  });

}

function givePhoneSigniture(player) {
  const onlinePlayers = world.getAllPlayers();
  let uiPlayerListAdmin = [ /*{ name: player.name } */];
  let CashV2 = world.scoreboard.getObjective("CashV2");
  let playerCash = CashV2.getScore(player)

  for (let playerList of onlinePlayers) {
    let addToPlayerList = { name: playerList.name };

    uiPlayerListAdmin.push(addToPlayerList);
  }

  const signatureUi = new ModalFormData();
  signatureUi.title(`Register Phone`);
  signatureUi.dropdown(
    "Player",
    uiPlayerListAdmin.map((player) => player.name)
  );

  signatureUi.show(player).then((response) => {
    if (response.formValues === null) return;
    const targetPlayerId = response.formValues;
    clearAllRightClick(player);
    // Give sig on right click
    player.setDynamicProperty("rightClickSignature", true);
    player.setDynamicProperty("playerToSign", uiPlayerListAdmin[targetPlayerId].name);

    player.sendMessage("§l§aRight click a non-stackable item in your inventory to give it a player use signature.")
  })
}

function tpaRequest(player, Noah) {
  const onlinePlayers = world.getAllPlayers();
  let uiPlayerList = [ /*{ name: player.name } */];

  for (let playerList of onlinePlayers) {
    if (playerList.name === player.name) continue;
    let addToPlayerList = { name: playerList.name };

    uiPlayerList.push(addToPlayerList);
  }

  let tpa = new ModalFormData();
  tpa.title(`Send a Teleport Request`)
  tpa.dropdown(
    "Player",
    uiPlayerList.map((player) => player.name)
  );

  tpa.show(player).then((response) => {
    const targetPlayerThing = response.formValues;

    const targetPlayer = world
      .getAllPlayers()
      .find((player) => player.name === uiPlayerList[targetPlayerThing].name);

    var playerOutgoingRequest = player.getDynamicProperty("OutGoingRequest");

    if (playerOutgoingRequest == null) {
      player.setDynamicProperty("OutgoingRequest", `[\"${targetPlayer.name}\"]`);
    } else {
      let OutputRequest = JSON.parse(playerOutgoingRequest);

      OutputRequest.push(targetPlayer.name);

      player.setDynamicProperty("OutgoingRequest", JSON.stringify(OutputRequest));
    }

    var TargetPlayerIncomingRequest = targetPlayer.getDynamicProperty("IncomingRequest")


    if (TargetPlayerIncomingRequest == null) {
      targetPlayer.setDynamicProperty("IncomingRequest", `[\"${player.name}\"]`);
    } else {
      let IncomingRequest = JSON.parse(TargetPlayerIncomingRequest);
      IncomingRequest.push(player.name);

      targetPlayer.setDynamicProperty("IncomingRequest", JSON.stringify(IncomingRequest));
    }



    targetPlayer.sendMessage(`§a§lYou have recieved a teleport request from §e${player.name}!`);
    player.sendMessage(`§a§lSent a teleport request to §e${targetPlayer.name}`);
  });
}

function bankUi(player, Noah , level) {
  let bank = new ActionFormData();
  let CashV2 = world.scoreboard.getObjective("CashV2");
  let playerCash = CashV2.getScore(player)

  bank.title(`Bank`);

  bank.button("Transfer", `textures/tfg-icons-/t-/${level}-/default-/t${level}-default-transfer`);
  bank.button("Logs", `textures/tfg-icons-/t-/${level}-/default-/t${level}-default-transactions`);

  bank.show(player).then((response) => {
    if (response.selection == 0) {
      transfer(player, Noah);
    } else if (response.selection == 1) {
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

  let bankLogJSON = JSON.parse(bankLog);

  let logOrderDetails = [];

  let bankLogUi = new ActionFormData();
  bankLogUi.title("Bank_Logs");
  bankLogUi.body("Transfer Logs");

  for( let i = bankLogJSON.length - 1; i >= 0; i-- ) {
    let gainOrLose = (bankLogJSON[i].amount > 0) ? "§a": "§c"
    if (bankLogJSON[i].reciever != null) {
      bankLogUi.button(`§l§6${bankLogJSON[i].reciever} ${gainOrLose}${bankLogJSON[i].amount}`)
      logOrderDetails.push(bankLogJSON[i]);
    } else {
      bankLogUi.button(`§l§6${bankLogJSON[i].sender} ${gainOrLose}+${bankLogJSON[i].amount}`)
      logOrderDetails.push(bankLogJSON[i]);
    }
  }

  bankLogUi.show(player).then((response) => {
    let logDetails = new ActionFormData();
    logDetails.title("Log Details");
    
    let note = logOrderDetails[response.selection].note;
    let cashUsed = logOrderDetails[response.selection].amount; 
    if (logOrderDetails[response.selection].reciever != null) {
      // Case: you sent the money
      let reciever = logOrderDetails[response.selection].reciever;
      logDetails.body(`§l§aYou sent §c${-cashUsed} §ato §6${reciever} §awith the note:\n§d${note}`);
    } else {
      // Case: you received the money
      let sender = logOrderDetails[response.selection].sender
      logDetails.body(`§l§aYou recieved ${cashUsed} §afrom §6${sender} §awith the note:\n§d${note}`);
    }
    logDetails.button("Close")
    logDetails.show(player);
  });
}

function transfer(player, Noah) {
  const onlinePlayers = world.getAllPlayers();
  let uiPlayerList = [ /*{ name: "Levontriz2197" (player.name) } */ { name: "Levontriz2197" }];
  let CashV2 = world.scoreboard.getObjective("CashV2");
  let playerCash = CashV2.getScore(player)

  for (let playerList of onlinePlayers) {
    if (playerList.name === player.name) continue;
    let addToPlayerList = { name: playerList.name };

    uiPlayerList.push(addToPlayerList);
  }

  let bankUi = new ModalFormData();
  bankUi.title(`Bank (Your cash is $${playerCash})`);
  bankUi.dropdown(
    "Player",
    uiPlayerList.map((player) => player.name)
  );
  bankUi.textField("Money", "Amount to transfer");
  bankUi.textField("Note", "Note for reciever to read");

  bankUi.show(player).then((response) => {
    const [playerTransaction, amountToTransferString, playerNote] = response.formValues;
    const transferTarget = world
      .getAllPlayers()
      .find((player) => player.name === uiPlayerList[playerTransaction].name);
    let amountToTransferInt = parseInt(amountToTransferString);

    if (isNaN(amountToTransferInt)) {
      player.sendMessage("§c§oInvalid amount. Please enter a valid number.");
      return;
    }
    if (playerNote.length > 32) {
      player.sendMessage("§c§oNote must be less than 32 characters.");
      return;
    }
    player.sendMessage(`§l§aTransferring §r§e$${amountToTransferInt} §a§lto §r§7§o${uiPlayerList[playerTransaction].name}`)

    let CashV2 = world.scoreboard.getObjective("CashV2");
    let playerCash = CashV2.getScore(player);
    const transferTargetCash = CashV2.getScore(transferTarget)
    if (playerCash < amountToTransferInt) {
      player.sendMessage("§c§oInsufficient funds.");
      return;
    }
    if (amountToTransferInt <= 0) {
      player.sendMessage("§c§oInvalid amount. Please enter a positive number.");
      return;
    }
    CashV2.setScore(player, playerCash - amountToTransferInt);
    CashV2.setScore(transferTarget, transferTargetCash + amountToTransferInt)

    let transferTargetBankLogs = transferTarget.getDynamicProperty("BankLogs");


    const sendersLog = {
      sender: player.name,
      amount: amountToTransferInt,
      note: playerNote
    } 

    

    if (transferTargetBankLogs == undefined) {
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
      note: playerNote
    }

    if (playerBankLogs == undefined) {
      playerBankLogs = [];
      playerBankLogs.push(playersLog);
      player.setDynamicProperty("BankLogs", JSON.stringify(playerBankLogs));
    } else {
      playerBankLogs = JSON.parse(playerBankLogs);
      playerBankLogs.push(playersLog);
      player.setDynamicProperty("BankLogs", JSON.stringify(playerBankLogs));
    }





    player.sendMessage("§a§lFinished transaction")
    transferTarget.sendMessage(`§l§aYou were transferred §r§e$${amountToTransferInt} §a§lfrom §r§7§o${player.name} §r§a§lwith the note §d${playerNote}!`);
    transferTarget.playSound("random.levelup");
    Noah.sendMessage(`§7§o${player.name} transferred ${amountToTransferInt} to ${uiPlayerList[playerTransaction].name}`)
    return;
  });
}

function tpaIncoming(player, Noah, incomingTpa) {
  const onlinePlayers = world.getAllPlayers().map((player) => player.name);
  let listUsedForDisplay = [];

  console.log(JSON.stringify(onlinePlayers))

  for (let i = 0; i < incomingTpa.length; i++) {
    if (onlinePlayers.includes(incomingTpa[i])) {
      listUsedForDisplay.push(onlinePlayers[i]);
      console.log(onlinePlayers)
      continue;
    }
  }

  let IncomingOrder = [];

  let tpaUi = new ActionFormData();
  tpaUi.title(`Incoming Teleport Requests`);

  for (let tpaSender of listUsedForDisplay) {
    tpaUi.button(tpaSender);
    IncomingOrder.push(tpaSender);
  }

  tpaUi.show(player).then((response) => {
    let selectedSender = IncomingOrder[response.selection];
    if (selectedSender === undefined) return;

    const tpSender = world.getAllPlayers().find((sender) => sender.name === selectedSender);

    let acceptOrDecline = new ActionFormData();
    acceptOrDecline.title(`Teleport Request from ${selectedSender}`);
    acceptOrDecline.button("§a§lAccept");
    acceptOrDecline.button("§c§lDecline");
    acceptOrDecline.show(player).then((response) => {
      if (response.selection == 0) {
        tpSender.teleport(player.location);
        player.sendMessage(`§l§e${tpSender.name} §ahas been teleported to you!`)
        tpSender.sendMessage(`§a§lTeleported to §e${player.name}!`);
        Noah.sendMessage(`§7§o${tpSender.name} has teleported to ${player.name}`)
      } else {
        player.sendMessage(`§l§e${tpSender.name}'s §crequest has been declined`)
        tpSender.sendMessage(`§c§lTeleported request to §e${player.name} §chas been decline`);
      }

      incomingTpa = incomingTpa.filter(item => item !== tpSender.name);

      player.setDynamicProperty("IncomingRequest", JSON.stringify(incomingTpa));

      let tpSenderOutgoing = tpSender.getDynamicProperty("OutgoingRequest");

      let tpSenderOutgoingJSON = JSON.parse(tpSenderOutgoing);
      tpSenderOutgoingJSON = tpSenderOutgoingJSON.filter(item => item !== player.name);
      tpSender.setDynamicProperty("OutgoingRequest", JSON.stringify(tpSenderOutgoingJSON));

    });
  });
}

function tpaOutgoing(player, Noah, outgoingTpa) {
  const onlinePlayers = world.getAllPlayers();

  for (let allOnlinePlayers of onlinePlayers) {
    if (allOnlinePlayers.name in outgoingTpa) continue;
    for (let i in outgoingTpa.length) {
      if (outgoingTpa[i] === allOnlinePlayers.name) {
        outgoingTpa.splice(i, 1);
      }
    }
  }

  let OutgoingOrder = [];

  let tpaUi = new ActionFormData();
  tpaUi.title(`Outgoing Teleport Requests`);

  for (let tpaReciever of outgoingTpa) {
    tpaUi.button(tpaReciever);
    OutgoingOrder.push(tpaReciever);
  }

  tpaUi.show(player).then((response) => {
    let selectedReciever = OutgoingOrder[response.selection];
    if (selectedReciever === undefined) return;

    const tpReciever = world.getAllPlayers().find((reciever) => reciever.name === selectedReciever);



    let keepOrCancel = new ActionFormData();
    keepOrCancel.title(`Teleport Request for ${selectedReciever}`);
    keepOrCancel.button("§a§lContinue Request");
    keepOrCancel.button("§c§lCancel Request");
    keepOrCancel.show(player).then((response) => {
      if (response.selection == 1) {
        outgoingTpa = outgoingTpa.filter(item => item !== tpReciever.name);

        player.setDynamicProperty("OutgoingRequest", JSON.stringify(outgoingTpa));

        let tpRecieverIncoming = JSON.parse(tpReciever.getDynamicProperty("OutgoingRequest"));
        tpRecieverIncoming = tpRecieverIncoming.filter(item => item !== player.name);
        tpReciever.setDynamicProperty("IncomingRequest", JSON.stringify(tpRecieverIncoming));

        player.sendMessage(`§l§cRequest for §e${tpReciever.name}'s §chas been canceled`);
        tpReciever.sendMessage(`§l§e${player.name} §chas canceled their request`);
      } else {
        player.sendMessage(`§l§aRequest for §e${tpReciever.name}'s §ahas been kept!`);
      }


    });


  });
}

function tpaManagment(player, Noah, incomingTpa, outgoingTpa) {
  let CommandOrder = [];

  const incoutg = new ActionFormData();
  incoutg.title("Incoming and Outgoing Teleport Requests");
  if (incomingTpa.length > 0) {
    incoutg.button("Incoming")
    CommandOrder.push("Incoming");
  }
  if (outgoingTpa.length > 0) {
    incoutg.button("Outgoing")
    CommandOrder.push("Outgoing");
  }

  incoutg.show(player).then((response) => {
    let command = CommandOrder[response.selection];

    if (command == "Incoming") {
      tpaIncoming(player, Noah, incomingTpa)
    }
    if (command == "Outgoing") {
      tpaOutgoing(player, Noah, outgoingTpa)
    }

  });
}

function fastTravelUi(player, Noah, level) {
  const locations = {
    "Spawn": {
      level: 0, x: 0, y: 4, z: 0
    },
    "Launchpad": {
      level: 1, x: -212, y: 5, z: -327
    },
    "Parliament": {
      level: 1, x: -62, y: 4, z: 242
    },
    "The Bean": {
      level: 1, x: 400, y: 4, z: -91
    },
    "Tennis Court": {
      level: 2, x: 515, y: 4, z: 496
    },
    "Mars": {
      level: 2, x: -37, y: 20, z: -570
    },
    "Coal Pile": {
      level: 3, x: 492, y: 7, z: -608
    },
  }

  let order = [];

  const fastTravelUi = new ActionFormData();
  fastTravelUi.title("Fast Travel");
  fastTravelUi.body("Where would you like to go?");

  for (const data in locations) {
    if (level >= locations[data].level) {
      fastTravelUi.button(data);
      order.push(data);
    }
  }


  fastTravelUi.show(player).then((response) => {
    for (var i = 0; i < order.length; ++i) {
      if (response.selection == i) {
        const tag = order[i];
        const x = locations[tag].x
        const y = locations[tag].y
        const z = locations[tag].z
        player.teleport(
          { x: x, y: y, z: z },
          { dimension: world.getDimension("overworld") }
        );
        player.sendMessage(`§l§aTeleported to ${order[i]}!`);
        Noah.sendMessage(`§7§o${player.name} teleported to ${order[i]}.`);
      }
    }
    return;
  });
}

function clearInventoryConfig(player, Noah) {
  let playerWhitelist = player.getDynamicProperty("ClearWhitelist");
  var playerWhitelistJSON;

  if (playerWhitelist == undefined) {
    playerWhitelistJSON = [];
  } else {
    playerWhitelistJSON = JSON.parse(playerWhitelist);
  }

  let commandOrder = [];

  const clearConfig = new ActionFormData();
  clearConfig.title("Clear Inventory Configuration");
  clearConfig.body("Click an item to remove it from your whitelist");
  clearConfig.button("Add Item To Whitelist");
  commandOrder.push("addItemToWhitelist");
  //player.sendMessage(playerWhitelistJSON.length);
  for (let item of playerWhitelistJSON) {
    
    if (item == "tfg:aphone") {
      clearConfig.button("aPhone");
      commandOrder.push(item);
    } else {
      let itemName = item.split(":")[1].split("_");
      for (var i = 0; i < itemName.length; i++) {
        // You do not need to check if i is larger than itemName length, as your for does that for you
        // Assign it back to the array
        itemName[i] = itemName[i].charAt(0).toUpperCase() + itemName[i].substring(1);     
      }

      itemName = itemName.join(" ");

      clearConfig.button(itemName);
      commandOrder.push(item);
    }
  }


  clearConfig.show(player).then((response) => {
    let command = commandOrder[response.selection];

    if (command == "addItemToWhitelist") {
      player.sendMessage("§l§6§oRight click §r§l§awhile holding §6§oany §r§l§aitem in your inventory to add every item of its type to your whitelist")

      clearAllRightClick(player);

      // right click stuff!!!
      player.setDynamicProperty("rightClickAddItemToWhitelist", true);
    } else {
      let itemDisplayName;
      if (command == "tfg:aphone") {
        itemDisplayName = "aPhone";
      } else {
        itemDisplayName = command.split(":")[1].split("_").map(word => word.charAt(0).toUpperCase() + word.substring(1)).join(" ");
      }
      let removeOrKeep = new ActionFormData();
      removeOrKeep.title(`Remove ${itemDisplayName} from whitelist?`);
      removeOrKeep.button("§a§lKeep");
      removeOrKeep.button("§c§lRemove");

      removeOrKeep.show(player).then((response) => {
        if (response.selection == 1) {
          playerWhitelistJSON = playerWhitelistJSON.filter(item => item !== command);
          player.setDynamicProperty("ClearWhitelist", JSON.stringify(playerWhitelistJSON));
          player.sendMessage(`§l§cRemoved ${itemDisplayName} from whitelist!`);
          Noah.sendMessage(`§7§o${player.name} removed ${itemDisplayName} from whitelist.`);
        }
      });
    }
  });

}

function clearInventory(player, Noah) {
  let playerInventory = player.getComponent("inventory").container;
  let inventorySize = playerInventory.size;
  let itemsToKeep = player.getDynamicProperty("ClearWhitelist");
  if (itemsToKeep == undefined) {
    player.sendMessage(`§a§lWe suggest having at least 1 item to keep! Although all phones are kept during a clear, please specify your phone as an item to keep or set any item as an item to keep to ignore this notification!`);
    return;
  } else {
      let itemsToKeepJSON = JSON.parse(itemsToKeep);
    for (let i = 0; i < inventorySize; i++) {
      console.log(i);
      try {
        var item = playerInventory.getSlot(i);
        console.log(item.typeId);
      } catch (err) {
        var item = null;
        console.log(item);
      }
      if (item) {
        let itemName = item.typeId;
        if (payToUsePhones.includes(itemName) || itemName == "tfg:admin_pda") {
          continue;
        } else if (!itemsToKeepJSON.includes(itemName)) {
          playerInventory.setItem(i, null);
        }
      }
    }
    player.sendMessage(`§l§aCleared inventory!`);
    Noah.sendMessage(`§7§o${player.name} cleared inventory.`);
  }
}

function settingsMenu(player, Noah, level) {
  let CommandOrder = [];
  const settingsUi = new ActionFormData();
  settingsUi.title("Settings");
  if (level < 2) {
    settingsUi.button("No settings here!");
  }
  if (level >= 3) {
    settingsUi.button("Set Home")
    CommandOrder.push("SH");
  }
  if (level >= 2) {
    settingsUi.button("Clear Config")
    CommandOrder.push("ClearConfig");
  }

  settingsUi.show(player).then((response) => {
    let command = CommandOrder[response.selection];
    if (command == "SH") {
      setHome(player, Noah);
    } else if (command == "ClearConfig") {
      clearInventoryConfig(player, Noah);
    }
  })

}


function mainUi(player, Noah, level) {
  let CommandOrder = [];

  const Ui = new ActionFormData();
  Ui.title("Home Screen");
  Ui.body("");

  if (player.getDynamicProperty("IncomingRequest") == undefined) {
    var playerIncomingTpa = []
  } else {
    var playerIncomingTpa = JSON.parse(player.getDynamicProperty("IncomingRequest"));
  }

  if (player.getDynamicProperty("OutgoingRequest") == undefined) {
    var playerOutgoingTpa = []
  } else {
    var playerOutgoingTpa = JSON.parse(player.getDynamicProperty("OutgoingRequest"));
  }

  let tpaIcon = `textures/tfg-icons-/t-/${level}-/default-/t${level}-default-tpareqs`
  if (playerIncomingTpa.length > 0 || playerOutgoingTpa.length > 0) {

    Ui.button(`${playerIncomingTpa.length} Incoming TPA, ${playerOutgoingTpa.length} Outgoing TPA`, tpaIcon)
    CommandOrder.push("TPAOptions");
  }

  if (level >= 3) {
    Ui.button("Home", `textures/tfg-icons-/t-/${level}-/default-/t${level}-default-home`)
    CommandOrder.push("Home");
  }

  if (level >= 3) {
    Ui.button("Speed", `textures/tfg-icons-/t-/${level}-/default-/t${level}-default-speed`);
    CommandOrder.push("Speed");
  }
  Ui.button("Fast Travel", `textures/tfg-icons-/t-/${level}-/default-/t${level}-default-fasttravel`);
  CommandOrder.push("FT");
  Ui.button("Bank", `textures/tfg-icons-/t-/${level}-/default-/t${level}-default-bank`)
  CommandOrder.push("Bank");
  if (level >= 1) {
    Ui.button("Teleport to Player", `textures/tfg-icons-/t-/${level}-/default-/t${level}-default-tpa`)
    CommandOrder.push("TPA");
  }

  if (level >= 2) {
    Ui.button("Clear", `textures/tfg-icons-/t-/${level}-/default-/t${level}-default-clear`)
    CommandOrder.push("Clear");
  }

  if (level != 0) {
    Ui.button("Settings", `textures/tfg-icons-/t-/${level}-/default-/t${level}-default-settings`)
    CommandOrder.push("Settings");
  }

  /*Ui.button("placeholder", "textures/ui/placeholder")
  Ui.button("placeholder", "textures/ui/placeholder")
  Ui.button("placeholder", "textures/ui/placeholder")
  Ui.button("placeholder", "textures/ui/placeholder")
  Ui.button("placeholder", "textures/ui/placeholder")
  Ui.button("placeholder", "textures/ui/placeholder")
  Ui.button("placeholder", "textures/ui/placeholder")*/


  Ui.show(player).then((response) => {
    let command = CommandOrder[response.selection];
    if (command == "TPAOptions") {
      tpaManagment(player, Noah, playerIncomingTpa, playerOutgoingTpa);
    } else if (command == "FT") {
      fastTravelUi(player, Noah, level);
    } else if (command == "Bank") {
      bankUi(player, Noah, level);
    } else if (command == "TPA") {
      tpaRequest(player, Noah);
    } else if (command == "Clear") {
      clearInventory(player, Noah);
    } else if (command == "Home") {
      home(player, Noah);
    } else if (command == "Settings") {
      settingsMenu(player, Noah, level);
    } else if (command == "Speed") {
      player.runCommand("effect @s speed 10 100 true");
      player.sendMessage("§l§aSpeed boost");
      Noah.sendMessage(`§7§o${player.name} activated Speed Boost.`);
    }
    return;
  }); // show player the form 
}