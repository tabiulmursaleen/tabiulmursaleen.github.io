import { isSignInWithEmailLink, onAuthStateChanged, sendSignInLinkToEmail, signInWithEmailLink, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

const loginForm = document.getElementById("teacherQuestionLoginForm");
const loginMessage = document.getElementById("teacherQuestionLoginMessage");
const teacherSelect = document.getElementById("teacherQuestionTeacher");
const submitButton = document.getElementById("teacherQuestionLoginButton");
const accountToggle = document.getElementById("teacherQuestionAccountToggle");
const accountMenu = document.getElementById("teacherQuestionAccountMenu");
const logoutButton = document.getElementById("teacherQuestionLogout");
const ADMIN_UID = "wWuBEmlsaofgjAaQi7bfblsX6L62";
const teachers = window.teachersData || [];

teachers.forEach((teacher) => {
  const option = new Option(teacher.email ? teacher.name : `${teacher.name} (ইমেইল নেই)`, teacher.id);
  option.disabled = !teacher.email;
  teacherSelect.add(option);
});

function showMessage(text, error = false) {
  loginMessage.textContent = text;
  loginMessage.classList.toggle("is-error", error);
}

async function finishEmailSignIn() {
  if (!isSignInWithEmailLink(auth, window.location.href)) return;
  let email = localStorage.getItem("teacherQuestionSignInEmail");
  if (!email) email = window.prompt("যে ইমেইলে প্রবেশ লিংকটি পাঠানো হয়েছে সেটি লিখুন:");
  if (!email) {
    showMessage("প্রবেশ সম্পন্ন করতে নিবন্ধিত ইমেইলটি লিখুন।", true);
    return;
  }
  try {
    const result = await signInWithEmailLink(auth, email, window.location.href);
    localStorage.removeItem("teacherQuestionSignInEmail");
    history.replaceState({}, document.title, window.location.pathname);
    if (!result.user.emailVerified) throw new Error("ইমেইল যাচাই সম্পন্ন হয়নি।");
    showMessage("ইমেইল যাচাই সম্পন্ন হয়েছে।");
  } catch (error) {
    console.error(error);
    showMessage("প্রবেশ লিংকটি কাজ করেনি বা মেয়াদ শেষ হয়েছে। আবার নিবন্ধিত ইমেইলে নতুন লিংক নিন।", true);
  }
}

finishEmailSignIn();

onAuthStateChanged(auth, (user) => {
  if (!user || !document.body.dataset.teacherQuestionPortal) return;
  if (user.uid !== ADMIN_UID && !teachers.some((teacher) => teacher.email?.toLowerCase() === user.email?.toLowerCase())) return;
  document.getElementById("teacherQuestionLogin").hidden = true;
  document.getElementById("teacherQuestionWorkspace").hidden = false;
});

accountToggle.addEventListener("click", () => {
  const open = accountToggle.getAttribute("aria-expanded") !== "true";
  accountToggle.setAttribute("aria-expanded", String(open));
  accountMenu.hidden = !open;
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".teacher-question-account")) {
    accountMenu.hidden = true;
    accountToggle.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    accountMenu.hidden = true;
    accountToggle.setAttribute("aria-expanded", "false");
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const teacher = teachers.find((person) => person.id === teacherSelect.value);
  if (!teacher) {
    showMessage("শিক্ষক নির্বাচন করুন।", true);
    return;
  }
  if (!teacher.email) {
    showMessage("এই শিক্ষকের প্রোফাইলে ইমেইল দেওয়া নেই। আগে নিবন্ধিত ইমেইল যোগ করতে হবে।", true);
    return;
  }
  submitButton.disabled = true;
  showMessage("নিবন্ধিত ইমেইলে প্রবেশ লিংক পাঠানো হচ্ছে…");
  try {
    const actionCodeSettings = {
      url: `${window.location.origin}${window.location.pathname}`,
      handleCodeInApp: true
    };
    await sendSignInLinkToEmail(auth, teacher.email, actionCodeSettings);
    localStorage.setItem("teacherQuestionSignInEmail", teacher.email);
    showMessage("নিবন্ধিত ইমেইলে একবারের প্রবেশ লিংক পাঠানো হয়েছে। একই ডিভাইসে লিংকটি খুলুন।");
  } catch (error) {
    console.error(error);
    showMessage(error.code === "auth/operation-not-allowed"
      ? "Firebase Authentication-এ Email link sign-in চালু করতে হবে।"
      : "প্রবেশ লিংক পাঠানো যায়নি। Firebase-এর অনুমোদিত ডোমেইন ও ইমেইল সেটিং পরীক্ষা করুন।", true);
  } finally {
    submitButton.disabled = false;
  }
});

logoutButton.addEventListener("click", async () => {
  await signOut(auth);
  accountMenu.hidden = true;
  accountToggle.setAttribute("aria-expanded", "false");
  document.getElementById("teacherQuestionWorkspace").hidden = true;
  document.getElementById("teacherQuestionLogin").hidden = false;
  loginForm.reset();
  showMessage("আপনি নিরাপদে বের হয়েছেন।");
});
