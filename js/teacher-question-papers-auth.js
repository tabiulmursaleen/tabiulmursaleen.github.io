import { onAuthStateChanged, signInAnonymously, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const loginForm = document.getElementById("teacherQuestionLoginForm");
const loginMessage = document.getElementById("teacherQuestionLoginMessage");
const teacherSelect = document.getElementById("teacherQuestionTeacher");
const birthDateInput = document.getElementById("teacherQuestionBirthDate");
const submitButton = document.getElementById("teacherQuestionLoginButton");
const accountToggle = document.getElementById("teacherQuestionAccountToggle");
const accountMenu = document.getElementById("teacherQuestionAccountMenu");
const logoutButton = document.getElementById("teacherQuestionLogout");
const ADMIN_UID = "wWuBEmlsaofgjAaQi7bfblsX6L62";
const teachers = window.teachersData || [];

function populateTeacherSelect() {
  const selectedId = teacherSelect.value;
  teacherSelect.replaceChildren(new Option("শিক্ষক নির্বাচন করুন", ""));
  teachers.forEach((teacher) => teacherSelect.add(new Option(teacher.name, teacher.id)));
  if (teachers.some((teacher) => teacher.id === selectedId)) teacherSelect.value = selectedId;
}

window.teacherDirectoryReady = (async () => {
  let directoryLoadFailed = false;
  try {
    const snapshot = await getDocs(query(collection(db, "publicTeacherDirectory"), where("published", "==", true)));
    snapshot.docs.forEach((entry) => {
      const data = entry.data();
      if (data.deleted || !data.name) return;
      const id = data.id || entry.id;
      const existingIndex = teachers.findIndex((person) => person.id === id);
      const publicTeacher = {
        ...(existingIndex >= 0 ? teachers[existingIndex] : {}),
        id, name: data.name,
        designation: data.designation || "",
        subject: data.subject || "",
        photo: data.photo || ""
      };
      if (existingIndex >= 0) teachers[existingIndex] = publicTeacher;
      else teachers.push(publicTeacher);
    });
    window.teachersData = teachers;
  } catch (error) {
    directoryLoadFailed = true;
    console.error("শিক্ষক তালিকা Firestore থেকে লোড হয়নি:", error);
  }
  populateTeacherSelect();
  if (directoryLoadFailed) {
    showMessage("নতুন শিক্ষকের তালিকা লোড হয়নি। Firestore Rules প্রকাশ করুন এবং অ্যাডমিন ড্যাশবোর্ড একবার খুলুন।", true);
  }
})();

function showMessage(text, error = false) {
  loginMessage.textContent = text;
  loginMessage.classList.toggle("is-error", error);
}

function showWorkspace(teacher = null) {
  window.teacherQuestionSignedInTeacher = teacher;
  window.teacherQuestionIsAdmin = !teacher;
  window.teacherPortalUser = auth.currentUser;
  document.getElementById("teacherQuestionLogin").hidden = true;
  document.getElementById("teacherQuestionWorkspace").hidden = false;
  document.getElementById("teacherPortalChoices").hidden = false;
  document.querySelectorAll(".teacher-tool-panel").forEach((panel) => { panel.hidden = true; });
  const accountLabel = teacher?.name || "অ্যাডমিন";
  document.getElementById("teacherQuestionIdentity").textContent = teacher?.name || "অ্যাডমিন · সকল শিক্ষকের তথ্য";
  document.getElementById("teacherQuestionAccountLabel").textContent = accountLabel;
  document.getElementById("teacherQuestionAccountToggle").setAttribute("aria-label", `${accountLabel} · প্রোফাইল ও লগআউট`);
  const avatar = document.getElementById("teacherQuestionAvatar");
  const fallback = document.getElementById("teacherQuestionAvatarFallback");
  if (teacher?.photo) {
    avatar.onload = () => { avatar.hidden = false; fallback.hidden = true; };
    avatar.onerror = () => { avatar.hidden = true; fallback.hidden = false; fallback.textContent = teacher.name?.trim().slice(0, 1) || "শি"; };
    avatar.src = teacher.photo;
  } else {
    avatar.hidden = true;
    fallback.hidden = false;
    fallback.textContent = teacher ? teacher.name.trim().slice(0, 1) : "অ";
  }
}

function showLogin() {
  window.teacherQuestionSignedInTeacher = null;
  window.teacherQuestionIsAdmin = false;
  window.teacherPortalUser = null;
  document.getElementById("teacherQuestionWorkspace").hidden = true;
  document.getElementById("teacherQuestionLogin").hidden = false;
}

onAuthStateChanged(auth, async (user) => {
  await window.teacherDirectoryReady;
  window.teacherPortalUser = user;
  if (!user) { showLogin(); return; }
  if (user.uid === ADMIN_UID) { showWorkspace(); return; }
  if (!user.isAnonymous) { showLogin(); return; }

  try {
    const session = await getDoc(doc(db, "teacherSessions", user.uid));
    const teacherId = session.exists() ? session.data().teacherId : "";
    const teacher = teachers.find((person) => person.id === teacherId);
    if (teacher) showWorkspace(teacher);
    else showLogin();
  } catch (error) {
    console.error("শিক্ষক সেশন পড়া যায়নি:", error);
    showLogin();
    showMessage("প্রবেশের তথ্য যাচাই করা যায়নি। Firestore Rules প্রকাশ করা আছে কি না দেখুন।", true);
  }
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
  await window.teacherDirectoryReady;
  const teacher = teachers.find((person) => person.id === teacherSelect.value);
  if (!teacher) { showMessage("শিক্ষক নির্বাচন করুন।", true); return; }
  const dob = birthDateInput.value;
  if (!dob) { showMessage("জন্মতারিখ নির্বাচন করুন।", true); return; }

  submitButton.disabled = true;
  showMessage("নাম ও জন্মতারিখ যাচাই করা হচ্ছে…");
  try {
    let user = auth.currentUser;
    if (user?.uid === ADMIN_UID) { showWorkspace(); return; }
    if (user && !user.isAnonymous) {
      await signOut(auth);
      user = null;
    }
    if (!user) user = (await signInAnonymously(auth)).user;

    const sessionRef = doc(db, "teacherSessions", user.uid);
    const existing = await getDoc(sessionRef);
    if (existing.exists()) {
      const session = existing.data();
      if (session.teacherId !== teacher.id || session.dob !== dob) {
        showMessage("এই ব্রাউজারে আগে অন্য শিক্ষক প্রবেশ করেছেন। আগে লগআউট করে আবার চেষ্টা করুন।", true);
        return;
      }
    } else {
      await setDoc(sessionRef, { teacherId: teacher.id, dob });
    }

    window.location.reload();
  } catch (error) {
    console.error("শিক্ষক প্রবেশ সম্পন্ন হয়নি:", error);
    const errorMessage = error.code === "auth/operation-not-allowed"
      ? "Firebase Authentication-এ Anonymous sign-in চালু করতে হবে।"
      : error.code === "permission-denied"
        ? "জন্মতারিখটি মেলেনি অথবা ব্যক্তিগত শিক্ষক রেকর্ডটি এখনো তৈরি হয়নি। অ্যাডমিন ড্যাশবোর্ডে জনবল সম্পাদনা থেকে শিক্ষকের জন্মতারিখ সংরক্ষণ করে আবার চেষ্টা করুন।"
        : `প্রবেশ যাচাই হয়নি (${error.code || "unknown"})। Firestore Rules প্রকাশিত আছে কি না দেখুন।`;
    showMessage(errorMessage, true);
  } finally {
    submitButton.disabled = false;
  }
});

logoutButton.addEventListener("click", async () => {
  const user = auth.currentUser;
  accountMenu.hidden = true;
  accountToggle.setAttribute("aria-expanded", "false");
  try {
    if (user?.uid === ADMIN_UID) await signOut(auth);
    else if (user?.isAnonymous) await deleteDoc(doc(db, "teacherSessions", user.uid));
    showLogin();
    loginForm.reset();
    showMessage("আপনি নিরাপদে বের হয়েছেন।");
  } catch (error) {
    console.error("প্রবেশ বন্ধ করা যায়নি:", error);
    showMessage("লগআউট সম্পন্ন হয়নি। আবার চেষ্টা করুন।", true);
  }
});
