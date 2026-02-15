import { signInUser } from "../firebase.js";


  const signinForm = document.getElementById("signin-form");

  signinForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // 関数を呼び出すだけ
    await signInUser(email, password);
  });