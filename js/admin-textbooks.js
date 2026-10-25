import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { collection, doc, getDocs, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";
import { getAcademicSubjects } from "./academic-subjects.js?v=20261022-subject-catalog2";

const ADMIN_UID = "wWuBEmlsaofgjAaQi7bfblsX6L62";
const textbooksCollection = "textbooks";
const classSelect = document.getElementById("textbookAdminClass");
const rows = document.getElementById("textbookAdminRows");
const count = document.getElementById("textbookAdminSubjectCount");
const message = document.getElementById("textbookAdminMessage");
const addForm = document.getElementById("textbookAdminAddForm");
let savedBooks = [];
let busy = false;

function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("is-error", isError);
}

function subjectTrade(subjectName) {
  const families = [
    ["এগ্রো বেইজড ফুড", "এগ্রো বেইজড ফুড"],
    ["এগ্রো বেসড ফুড", "এগ্রো বেইজড ফুড"],
    ["অ্যাপারেল", "অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস"],
    ["জেনারেল মেকানিক্স", "জেনারেল মেকানিক্স"],
    ["আইটি সাপোর্ট", "আইটি সাপোর্ট এন্ড আইওটি বেসিকস"],
    ["জেনারেল ইলেকট্রনিক্স", "জেনারেল ইলেকট্রনিক্স"]
  ];
  return families.find(([prefix]) => subjectName.includes(prefix))?.[1] || "";
}

function currentSubjects() {
  return ["09", "10"].includes(classSelect.value)
    ? getAcademicSubjects(Number(classSelect.value)).filter((subject) => subject.code)
    : [];
}

function classNameFor(code) {
  return ({ "09": "নবম", "10": "দশম", "11": "একাদশ", "12": "দ্বাদশ" })[code] || "";
}

function normalizeDriveUrl(url) {
  if (url.hostname !== "drive.google.com") return url.href;
  const fileId = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get("id");
  return fileId ? `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview` : url.href;
}

function renderBookRow(subject, subjectKey, saved = null) {
  const row = document.createElement("article");
  row.className = "textbook-admin-row";
  row.dataset.subjectKey = subjectKey;

  const identity = document.createElement("div");
  identity.className = "textbook-admin-identity";
  const heading = document.createElement("h3");
  heading.textContent = subject.name;
  identity.append(heading);
  if (subject.code) {
    const code = document.createElement("small");
    code.textContent = `বিষয় কোড: ${subject.code}`;
    identity.append(code);
  }

  const titleLabel = document.createElement("label");
  titleLabel.textContent = "বইয়ের নাম";
  const titleInput = document.createElement("input");
  titleInput.className = "textbook-admin-title";
  titleInput.type = "text";
  titleInput.maxLength = 180;
  titleInput.value = saved?.bookTitle || subject.name;
  titleInput.placeholder = "বইয়ের নাম লিখুন";
  titleLabel.append(titleInput);

  const linkLabel = document.createElement("label");
  linkLabel.textContent = "PDF লিংক";
  const linkInput = document.createElement("input");
  linkInput.className = "textbook-admin-url";
  linkInput.type = "url";
  linkInput.inputMode = "url";
  linkInput.value = saved?.pdfUrl || "";
  linkInput.placeholder = "https://...";
  linkLabel.append(linkInput);

  const actions = document.createElement("div");
  actions.className = "textbook-admin-actions";
  const status = document.createElement("span");
  status.className = "textbook-admin-row-status";
  status.textContent = saved?.published && saved.pdfUrl ? "প্রকাশিত" : "লিংক যোগ হয়নি";
  const save = document.createElement("button");
  save.type = "button";
  save.className = "textbook-admin-save";
  save.textContent = "সংরক্ষণ";
  save.addEventListener("click", () => saveBook(row, subject, subjectKey));
  actions.append(status, save);

  row.append(identity, titleLabel, linkLabel, actions);
  rows.append(row);
}

function renderRows() {
  const classCode = classSelect.value;
  const subjects = currentSubjects();
  const customBooks = savedBooks.filter((book) => book.classCode === classCode && book.custom === true);
  rows.replaceChildren();
  const total = subjects.length + customBooks.length;
  count.textContent = document.documentElement.lang === "en" ? `${total} subjects/books` : `${total}টি বিষয়/বই`;

  subjects.forEach((subject, index) => {
    const subjectKey = `${classCode}_${String(index + 1).padStart(2, "0")}`;
    renderBookRow(subject, subjectKey, savedBooks.find((book) => book.subjectKey === subjectKey));
  });

  customBooks
    .sort((a, b) => Number(a.subjectIndex || 0) - Number(b.subjectIndex || 0))
    .forEach((book) => renderBookRow({ name: book.subjectName, code: book.subjectCode || "" }, book.subjectKey, book));

  if (!subjects.length && !savedBooks.some((book) => book.classCode === classCode && book.custom === true)) {
    const empty = document.createElement("p");
    empty.className = "textbook-admin-empty";
    empty.textContent = `${classNameFor(classCode)} শ্রেণির জন্য নতুন বই যোগ করুন।`;
    rows.append(empty);
  }
}

async function loadBooks() {
  const snapshot = await getDocs(collection(db, textbooksCollection));
  savedBooks = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
  renderRows();
}

async function saveBook(row, subject, subjectKey) {
  if (busy) return;
  const titleInput = row.querySelector(".textbook-admin-title");
  const linkInput = row.querySelector(".textbook-admin-url");
  const saveButton = row.querySelector(".textbook-admin-save");
  const status = row.querySelector(".textbook-admin-row-status");
  const bookTitle = titleInput.value.trim();
  const rawUrl = linkInput.value.trim();
  if (!bookTitle) {
    setMessage("বইয়ের নাম লিখুন।", true);
    titleInput.focus();
    return;
  }

  let pdfUrl = "";
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== "https:") throw new Error("https");
      pdfUrl = normalizeDriveUrl(parsed);
    } catch {
      setMessage("সঠিক https:// PDF লিংক দিন।", true);
      linkInput.focus();
      return;
    }
  }

  busy = true;
  saveButton.disabled = true;
  status.textContent = "সংরক্ষণ হচ্ছে…";
  const classCode = classSelect.value;
  const existing = savedBooks.find((book) => book.subjectKey === subjectKey);
  const reference = existing?.id
    ? doc(db, textbooksCollection, existing.id)
    : doc(collection(db, textbooksCollection));
  const record = {
    classCode,
    className: classNameFor(classCode),
    subjectKey,
    subjectIndex: Number(subjectKey.split("_").at(-1)) || savedBooks.length + 1,
    subjectName: subject.name,
    subjectCode: subject.code,
    trade: subjectTrade(subject.name),
    bookTitle,
    pdfUrl,
    published: Boolean(pdfUrl),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(reference, record, { merge: true });
    const updated = { id: reference.id, ...record, updatedAt: null };
    savedBooks = [...savedBooks.filter((book) => book.subjectKey !== subjectKey), updated];
    status.textContent = pdfUrl ? "প্রকাশিত" : "লিংক যোগ হয়নি";
    setMessage(pdfUrl ? "বইয়ের তথ্য সংরক্ষণ ও প্রকাশ করা হয়েছে।" : "বইয়ের নাম সংরক্ষিত হয়েছে। PDF লিংক দিলে সাইটে দেখা যাবে।");
  } catch (error) {
    console.error("পাঠ্যবই সংরক্ষণ হয়নি:", error);
    status.textContent = "সংরক্ষণ হয়নি";
    setMessage("পাঠ্যবই সংরক্ষণ হয়নি। Firestore Rules প্রকাশ ও প্রবেশাধিকার পরীক্ষা করুন।", true);
  } finally {
    busy = false;
    saveButton.disabled = false;
  }
}

addForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  const subjectName = document.getElementById("textbookAdminNewSubject").value.trim();
  const bookTitle = document.getElementById("textbookAdminNewTitle").value.trim();
  const rawUrl = document.getElementById("textbookAdminNewUrl").value.trim();
  let pdfUrl = "";
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== "https:") throw new Error("https");
      pdfUrl = normalizeDriveUrl(parsed);
    } catch {
      setMessage("সঠিক https:// PDF লিংক দিন।", true);
      return;
    }
  }
  if (!subjectName || !bookTitle) return;

  const classCode = classSelect.value;
  const subjectKey = `${classCode}_custom_${crypto.randomUUID()}`;
  const newRecord = {
    classCode,
    className: classNameFor(classCode),
    subjectKey,
    subjectIndex: savedBooks.filter((book) => book.classCode === classCode).length + 1,
    subjectName,
    subjectCode: "",
    trade: subjectTrade(subjectName),
    bookTitle,
    pdfUrl,
    published: Boolean(pdfUrl),
    custom: true,
    updatedAt: serverTimestamp()
  };
  const reference = doc(collection(db, textbooksCollection));
  const submit = addForm.querySelector("button[type=submit]");
  submit.disabled = true;
  try {
    await setDoc(reference, newRecord);
    savedBooks.push({ id: reference.id, ...newRecord, updatedAt: null });
    addForm.reset();
    renderRows();
    setMessage(pdfUrl ? "নতুন বই যোগ করে প্রকাশ করা হয়েছে।" : "নতুন বই সংরক্ষিত হয়েছে। PDF লিংক যোগ করলে সাইটে দেখা যাবে।");
  } catch (error) {
    console.error("নতুন বই যোগ হয়নি:", error);
    setMessage("নতুন বই যোগ হয়নি। Firestore Rules প্রকাশ ও প্রবেশাধিকার পরীক্ষা করুন।", true);
  } finally {
    submit.disabled = false;
  }
});

classSelect.addEventListener("change", renderRows);

onAuthStateChanged(auth, async (user) => {
  if (!user || user.uid !== ADMIN_UID) {
    rows.replaceChildren();
    setMessage("অ্যাডমিন হিসেবে প্রবেশ করুন।", true);
    return;
  }
  try {
    await loadBooks();
    setMessage("প্রতিটি বিষয়ের বইয়ের নাম ও PDF লিংক আলাদাভাবে সংরক্ষণ করুন।");
  } catch (error) {
    console.error("পাঠ্যবই লোড হয়নি:", error);
    setMessage("পাঠ্যবই লোড হয়নি। Firestore Rules পরীক্ষা করুন।", true);
  }
});
