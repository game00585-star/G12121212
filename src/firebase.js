import { initializeApp } from "firebase/app";

import {
  getFirestore,
  enableIndexedDbPersistence,
  collection,
  addDoc,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  runTransaction,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDrn6zq_ci7p2ZiLbIqgkxjXnBAy01MaZg",

  authDomain: "dfarm-pos-dd443.firebaseapp.com",

  projectId: "dfarm-pos-dd443",

  storageBucket: "dfarm-pos-dd443.firebasestorage.app",

  messagingSenderId: "795943062588",

  appId: "1:795943062588:web:b940208c7a6d7d18d38739",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Offline Support
enableIndexedDbPersistence(db)
  .then(() => {
    console.log("Firestore Offline Ready");
  })
  .catch((err) => {
    console.log(err);
  });

export {
  collection,
  addDoc,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  runTransaction,
};
