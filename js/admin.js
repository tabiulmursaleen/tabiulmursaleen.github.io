
import {
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { auth } from "./firebase-config.js";

const ADMIN_UID = "wWuBEmlsaofgjAaQi7bfblsX6L62";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  loginButton.disabled = true;
  loginMessage.textContent = "লগইন যাচাই করা হচ্ছে...";

  try {
    const result = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    if (result.user.uid !== ADMIN_UID) {
      await signOut(auth);
      throw new Error("NOT_ADMIN");
    }

    window.location.href = "admin-dashboard.html";

    loginMessage.style.color = "#183d63";

  } catch (error) {
    console.error("Login error:", error.code || error.message);

    if (error.message === "NOT_ADMIN") {
      loginMessage.textContent =
        "এই অ্যাকাউন্টের অ্যাডমিন অনুমতি নেই।";
    } else if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/invalid-email" ||
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password"
    ) {
      loginMessage.textContent =
        "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।";
    } else if (error.code === "auth/too-many-requests") {
      loginMessage.textContent =
        "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।";
    } else {
      loginMessage.textContent =
        "লগইন করা যায়নি। ইন্টারনেট ও Firebase সেটআপ পরীক্ষা করুন।";
    }

    loginMessage.style.color = "#b42318";

  } finally {
    loginButton.disabled = false;
  }
});
