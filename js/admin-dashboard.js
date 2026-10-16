
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { auth } from "./firebase-config.js";

const ADMIN_UID = "wWuBEmlsaofgjAaQi7bfblsX6L62";

const adminEmail = document.getElementById("adminEmail");
const dashboardMessage = document.getElementById("dashboardMessage");
const logoutButton = document.getElementById("logoutButton");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("admin.html");
    return;
  }

  if (user.uid !== ADMIN_UID) {
    await signOut(auth);
    window.location.replace("admin.html");
    return;
  }

  adminEmail.textContent = user.email || "অ্যাডমিন";
  dashboardMessage.textContent = "অ্যাডমিন হিসেবে যাচাই সম্পন্ন হয়েছে।";
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;

  try {
    await signOut(auth);
    window.location.replace("admin.html");
  } catch (error) {
    dashboardMessage.textContent = "লগআউট করা যায়নি। আবার চেষ্টা করুন।";
    logoutButton.disabled = false;
  }
});
