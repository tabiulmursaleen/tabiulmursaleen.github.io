
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { auth, db } from "./firebase-config.js";

// আগের ফাইলগুলোর একই Admin UID বসাও।
const ADMIN_UID = "wWuBEmlsaofgjAaQi7bfblsX6L62";

const form = document.getElementById("noticeForm");
const titleInput = document.getElementById("noticeTitle");
const bodyInput = document.getElementById("noticeBody");
const pdfUrlInput = document.getElementById("noticePdfUrl");
const publishedInput = document.getElementById("noticePublished");
const saveButton = document.getElementById("saveNoticeButton");
const cancelButton = document.getElementById("cancelEditButton");
const message = document.getElementById("noticeMessage");
const noticeList = document.getElementById("noticeList");

let currentAdmin = null;
let editingId = null;
let busy = false;

function showMessage(text) {
  message.textContent = text;
}

function element(tag, text, className = "") {
  const el = document.createElement(tag);
  el.textContent = text;
  if (className) el.className = className;
  return el;
}

function makeButton(text, action, id, className = "") {
  const button = element("button", text, className);
  button.type = "button";
  button.dataset.action = action;
  button.dataset.id = id;
  return button;
}

function resetForm() {
  form.reset();
  editingId = null;
  saveButton.textContent = "নোটিশ সংরক্ষণ";
  cancelButton.hidden = true;
}

cancelButton.addEventListener("click", () => {
  resetForm();
  showMessage("সম্পাদনা বাতিল করা হয়েছে।");
});

async function loadNotices() {
  noticeList.replaceChildren(element("p", "নোটিশ লোড হচ্ছে..."));

  try {
    const q = query(
      collection(db, "notices"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    noticeList.replaceChildren();

    if (snapshot.empty) {
      noticeList.append(element("p", "এখনো কোনো নোটিশ নেই।"));
      return;
    }

    snapshot.forEach((noticeDoc) => {
      const data = noticeDoc.data();
      const id = noticeDoc.id;
      const item = element("article", "", "notice-item");

      item.append(element("h4", data.title || "শিরোনাম নেই"));

      item.append(
        element(
          "p",
          data.published ? "অবস্থা: প্রকাশিত" : "অবস্থা: অপ্রকাশিত"
        )
      );

      if (data.body) {
        item.append(element("p", data.body));
      }

      if (data.pdfUrl) {
        const link = element("a", "PDF খুলুন", "notice-pdf-link");
        link.href = data.pdfUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        item.append(link);
      }

      const actions = element("div", "", "notice-actions");

      actions.append(makeButton("এডিট", "edit", id));

      actions.append(
        makeButton(
          data.published ? "অপ্রকাশিত করুন" : "প্রকাশ করুন",
          "toggle",
          id
        )
      );

      actions.append(
        makeButton("মুছে ফেলুন", "delete", id, "delete-notice")
      );

      item.append(actions);
      noticeList.append(item);
    });
  } catch (error) {
    console.error(error);
    noticeList.replaceChildren(
      element("p", "নোটিশ লোড হয়নি। Firestore Rules পরীক্ষা করুন।")
    );
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentAdmin || busy) return;

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();
  const pdfUrl = pdfUrlInput.value.trim();

  if (!title) {
    showMessage("নোটিশের শিরোনাম লিখুন।");
    return;
  }

  if (!body && !pdfUrl) {
    showMessage("নোটিশের বিবরণ অথবা PDF লিংক দিন।");
    return;
  }

  if (pdfUrl) {
    try {
      const parsedUrl = new URL(pdfUrl);

      if (parsedUrl.protocol !== "https:") {
        showMessage("PDF-এর লিংক অবশ্যই https:// দিয়ে শুরু হতে হবে।");
        return;
      }
    } catch {
      showMessage("সঠিক PDF লিংক দিন।");
      return;
    }
  }

  busy = true;
  saveButton.disabled = true;
  cancelButton.disabled = true;
  showMessage("নোটিশ সংরক্ষণ হচ্ছে...");

  try {
    const data = {
      title,
      body,
      pdfUrl,
      published: publishedInput.checked,
      updatedAt: serverTimestamp()
    };

    if (editingId) {
      const noticeRef = doc(db, "notices", editingId);
      await updateDoc(noticeRef, data);
      showMessage("নোটিশ সম্পাদনা করে সংরক্ষণ করা হয়েছে।");
    } else {
      const noticeRef = doc(collection(db, "notices"));

      await setDoc(noticeRef, {
        ...data,
        createdAt: serverTimestamp(),
        createdBy: currentAdmin.uid
      });

      showMessage("নতুন নোটিশ সংরক্ষণ করা হয়েছে।");
    }

    resetForm();
    await loadNotices();
  } catch (error) {
    console.error(error);
    showMessage("সংরক্ষণ করা যায়নি। Firestore Rules ও সংযোগ পরীক্ষা করুন।");
  } finally {
    busy = false;
    saveButton.disabled = false;
    cancelButton.disabled = false;
  }
});

noticeList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button || !currentAdmin || busy) return;

  const id = button.dataset.id;
  const action = button.dataset.action;
  const noticeRef = doc(db, "notices", id);

  busy = true;
  button.disabled = true;

  try {
    const snapshot = await getDoc(noticeRef);

    if (!snapshot.exists()) {
      showMessage("নোটিশটি খুঁজে পাওয়া যায়নি।");
      await loadNotices();
      return;
    }

    const data = snapshot.data();

    if (action === "edit") {
      editingId = id;
      titleInput.value = data.title || "";
      bodyInput.value = data.body || "";
      pdfUrlInput.value = data.pdfUrl || "";
      publishedInput.checked = data.published === true;

      saveButton.textContent = "পরিবর্তন সংরক্ষণ";
      cancelButton.hidden = false;

      form.scrollIntoView({ behavior: "smooth", block: "start" });
      showMessage("নোটিশ সম্পাদনা করুন, তারপর সংরক্ষণ চাপুন।");
    }

    if (action === "toggle") {
      await updateDoc(noticeRef, {
        published: !data.published,
        updatedAt: serverTimestamp()
      });

      showMessage("নোটিশের প্রকাশের অবস্থা পরিবর্তন হয়েছে।");
      await loadNotices();
    }

    if (action === "delete") {
      const confirmText = "এই নোটিশটি স্থায়ীভাবে মুছে ফেলতে চান?";
      const confirmed = window.confirm(window.dashboardTranslate?.(confirmText) || confirmText);

      if (!confirmed) return;

      await deleteDoc(noticeRef);

      if (editingId === id) resetForm();

      showMessage("নোটিশ মুছে ফেলা হয়েছে।");
      await loadNotices();
    }
  } catch (error) {
    console.error(error);
    showMessage("কাজটি সম্পন্ন হয়নি। Firestore Rules পরীক্ষা করুন।");
  } finally {
    busy = false;
    button.disabled = false;
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user || user.uid !== ADMIN_UID) {
    if (user) await signOut(auth);
    window.location.replace("admin.html");
    return;
  }

  currentAdmin = user;
  await loadNotices();
});
