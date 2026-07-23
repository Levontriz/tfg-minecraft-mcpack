export const VERSION = "26.2.2";

export const TPA_REQUEST_TIMEOUT = 30000; // 2 minutes in milliseconds

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
