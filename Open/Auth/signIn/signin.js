import { signInUser } from "../../firebase.js";


  const signinForm = document.getElementById("signin-form");

  signinForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await signInUser(email, password);
      // Navigate to ai_app/index.html after successful sign in
      window.location.href = "../../ai_app/index.html";
    } catch (error) {
      alert(error.message || "Sign in failed.");
    }
  });