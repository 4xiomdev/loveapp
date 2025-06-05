export const USER_IDS = {
  USER_L_UID: "9f7zMkAVlWOL6QhndiUmYPKIAJ82",
  USER_J_UID: "EfzatENMPzfGUHoy3lfJOwR3uBv1"
};

// For future expansion, we can add relationship types
export const RELATIONSHIP_TYPES = {
  PARTNER: 'partner',
  FRIEND: 'friend',
  FAMILY: 'family'
};

export const USER_MODES = {
  PARTNER: 'PARTNER',
  SOLO: 'SOLO'
};

export const FEATURE_ACCESS = {
  [USER_MODES.PARTNER]: ['messages', 'stars', 'coupons', 'reminders', 'accountability'],
  [USER_MODES.SOLO]: ['reminders', 'accountability'] // Features available in solo mode
};

// Default user settings
export const DEFAULT_USER_SETTINGS = {
  mode: USER_MODES.SOLO,  // Default to SOLO mode
  notifications: true,
  emailNotifications: true,
  calendarSync: false
}; 