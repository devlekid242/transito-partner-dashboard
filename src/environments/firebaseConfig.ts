// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCcSogGDcqoP1W30cHhYFSKzTtPEY-gL_8",
  authDomain: "transito-6808c.firebaseapp.com",
  projectId: "transito-6808c",
  storageBucket: "transito-6808c.firebasestorage.app",
  messagingSenderId: "464724672027",
  appId: "1:464724672027:web:0b054ebb98ae89f91402be",
  measurementId: "G-HBLV0TMEHC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);