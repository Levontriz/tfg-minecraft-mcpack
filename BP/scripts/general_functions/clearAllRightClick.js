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

export { clearAllRightClick };