export const queryKeys = {
  user: (uid) => ['user', uid],
  reminders: {
    list: (uid) => ['reminders', 'list', uid],
    partnerList: (partnerId) => ['reminders', 'partner', partnerId],
  },
  messages: {
    thread: (uid, partnerId) => ['messages', 'thread', uid, partnerId],
  },
  moods: {
    today: (uid) => ['moods', 'today', uid],
    history: (uid) => ['moods', 'history', uid],
  },
  calendar: {
    events: (uid) => ['calendar', 'events', uid],
  },
};


