// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdpCe6uGUsXmFPGmQYUSzfy5NbvPddwtE",
  authDomain: "permi-2881a.firebaseapp.com",
  projectId: "permi-2881a",
  storageBucket: "permi-2881a.firebasestorage.app",
  messagingSenderId: "60995385865",
  appId: "1:60995385865:web:ef5b7fce933421d327d6d8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { db };
