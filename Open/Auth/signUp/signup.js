import { signUpUser } from "../../firebase.js";

const signupForm = document.getElementById("signup-form");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;



  try {
    const userCredential = await signUpUser(email, password);
    console.log("User created:", userCredential.user);
    // 新規登録成功 → Sign In ページやLPへ遷移
    window.location.href = "../signIn/signin.html";
  } catch (err) {
    console.error("Sign up error:", err.code, err.message);
    alert(`Sign up failed: ${err.message}`);
  }
});