import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";





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
export const auth = getAuth(app);



export async function signInUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Signed in user:", userCredential.user);

    // 成功したらダッシュボードへ
    window.location.href = "../idnex.html";
    return userCredential.user;
  } catch (error) {
    console.error("Sign in error:", error);
    alert("Sign in failed: " + error.message);
    throw error;
  }
}

// 新規ユーザー登録
export async function signUpUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Created user:", userCredential.user);
    // サインアップ後にサインインページへリダイレクト
    window.location.href = "signin.html";
    return userCredential.user;
  } catch (error) {
    console.error("Sign up error:", error);
    alert("Sign up failed: " + error.message);
    throw error;
  }
}

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