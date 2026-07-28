export const VERSION = "26.4.3";

export const TPA_REQUEST_TIMEOUT = 120000; // 2 minutes in milliseconds

export const WorldDyanmicPropertiesKey = { // Not extensive please add more as needed
  CASH: "Cash",
  PACK_VERSION: "packVersion",
  PAYDAY_AMOUNT: "paydayAmount",
  PAYDAY_INTERVAL: "paydayInterval",
  PAYDAY_ENABLED: "paydayEnabled",
};

export const PlayerDynamicPropertiesKey = { // Not extensive please add more as needed
  RIGHT_CLICK_SIGNATURE: "rightClickSignature",
  PLAYER_TO_SIGN: "playerToSign",
  CLEAR_SIGNATURES: "clearSignatures",
  RIGHT_CLICK_ADD_ITEM_TO_WHITELIST: "rightClickAddItemToWhitelist",
  RIGHT_CLICK_SET_LORE: "rightClickSetLore",
  LORE_TO_SET: "loreToSet",
};

export const ItemDynamicPropertiesKey = { // Not extensive please add more as needed
  OWNER: "Owner",
};

export const PAYDAY_DEFAULTS = {
  amount: 10,
  interval: 12000, // 10 minutes in ticks (20 ticks per second)
  enabled: true,
}

// Shared gameplay configuration for phone-related features
export const PAY_TO_USE_PHONES = [
  "tfg:cobblestphone",
  "tfg:aphone",
  "tfg:nebula_pro"
];

export const PHONE_LEVELS = {
  "tfg:pda": 0,
  "tfg:cobblestphone": 1,
  "tfg:aphone": 2,
  "tfg:nebula_pro": 3
};

// Players allowed to access admin-only flows
export const ADMINS = ["Purtzle", "Levontriz2197", "CalmestLotus734"];

// Primary player to receive moderation pings
export const NOTIFY_ADMIN = "Purtzle";
