export const env = {
  environment: import.meta.env.VITE_ENVIRONMENT || (import.meta.env.DEV ? 'development' : 'production'),
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  },
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
  },
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  },
};

export const assertEnv = (required = []) => {
  const missing = [];
  const flat = {
    'VITE_FIREBASE_API_KEY': env.firebase.apiKey,
    'VITE_FIREBASE_AUTH_DOMAIN': env.firebase.authDomain,
    'VITE_FIREBASE_PROJECT_ID': env.firebase.projectId,
    'VITE_FIREBASE_STORAGE_BUCKET': env.firebase.storageBucket,
    'VITE_FIREBASE_MESSAGING_SENDER_ID': env.firebase.messagingSenderId,
    'VITE_FIREBASE_APP_ID': env.firebase.appId,
    'VITE_GOOGLE_CLIENT_ID': env.google.clientId,
  };
  required.forEach((k) => { if (!flat[k]) missing.push(k); });
  if (missing.length && import.meta.env.PROD) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
};


