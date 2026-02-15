import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

// 画像アップロード
export async function uploadImage(file, imageId) {
  const imageRef = ref(storage, `images/train/img_${imageId}.jpg`);
  await uploadBytes(imageRef, file);
}

// label.txt アップロード
export async function uploadLabel(text, imageId) {
  const blob = new Blob([text], { type: "text/plain" });
  const labelRef = ref(storage, `labels/train/img_${imageId}.txt`);
  await uploadBytes(labelRef, blob);
}