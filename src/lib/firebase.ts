const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let firebaseApp: any = null;
let firebaseAuth: any = null;
let googleAuthProvider: any = null;

// Lazy initialize Firebase app
async function getFirebaseApp() {
    if (firebaseApp) return firebaseApp;

    const { initializeApp } = await import('firebase/app');
    firebaseApp = initializeApp(firebaseConfig);
    return firebaseApp;
}

// Lazy initialize Firebase Auth
export async function getFirebaseAuth() {
    if (firebaseAuth) return firebaseAuth;

    const app = await getFirebaseApp();
    const { getAuth } = await import('firebase/auth');
    firebaseAuth = getAuth(app);
    return firebaseAuth;
}

// Lazy initialize Google Provider
export async function getGoogleProvider() {
    if (googleAuthProvider) return googleAuthProvider;

    const { GoogleAuthProvider } = await import('firebase/auth');
    googleAuthProvider = new GoogleAuthProvider();

    // Add custom parameters to prevent caching issues and improve reliability
    googleAuthProvider.setCustomParameters({
        prompt: 'select_account',
        display: 'popup'
    });

    return googleAuthProvider;
}