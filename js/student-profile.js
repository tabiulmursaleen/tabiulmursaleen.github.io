import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { db } from "./firebase-config.js";

const profile = document.getElementById("studentProfile");
const status = document.getElementById("studentProfileStatus");
const photo = document.getElementById("studentProfilePhoto");
const details = document.getElementById("studentProfileDetails");

const publicValueTranslations = new Map([
  ["স্কুল", "School"],
  ["কলেজ", "College"],
  ["ষষ্ঠ", "6"], ["সপ্তম", "7"], ["অষ্টম", "8"],
  ["নবম", "9"], ["দশম", "10"], ["একাদশ", "11"], ["দ্বাদশ", "12"],
  ["আইটি সাপোর্ট এন্ড আইওটি বেসিকস", "IT Support and IoT Basics"],
  ["অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস", "Apparel Manufacturing Basics"],
  ["জেনারেল মেকানিক্স", "General Mechanics"],
  ["জেনারেল ইলেক্ট্রনিক্স", "General Electronics"],
  ["এগ্রো বেসড ফুড", "Agro-Based Food"],
  ["কম্পিউটারাইজড একাউন্টিং সিস্টেম", "Computerized Accounting System"],
  ["ডিজিটাল টেকনোলজি ইন বিজনেস", "Digital Technology in Business"]
]);

function displayValue(value) {
  const text = String(value || "").trim();
  return publicValueTranslations.get(text) || text;
}

function sentenceCaseName(value) {
  return String(value || "").trim().toLocaleLowerCase().replace(/(^|\s)(\S)/gu,
    (_, spacing, character) => spacing + character.toLocaleUpperCase());
}

function addDetail(label, value) {
  if (value === undefined || value === null || value === "") return;
  const row = document.createElement("div");
  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.textContent = label;
  description.textContent = String(value);
  row.append(term, description);
  details.append(row);
}

function getPhotoUrls(photoUrl) {
  try {
    const source = new URL(photoUrl);
    const fileId = source.pathname.match(/\/file\/d\/([^/]+)/)?.[1]
      || source.searchParams.get("id");
    if (!fileId) return [photoUrl];
    const resourceKey = source.searchParams.get("resourcekey");
    const build = (path, params) => {
      const url = new URL(path, "https://drive.google.com");
      Object.entries({ id: fileId, ...params }).forEach(([key, value]) => url.searchParams.set(key, value));
      if (resourceKey) url.searchParams.set("resourcekey", resourceKey);
      return url.href;
    };
    return [
      build("/uc", { export: "view" }),
      build("/thumbnail", { sz: "w1000" }),
      build("/uc", { export: "download" })
    ];
  } catch {
    return [photoUrl];
  }
}

function driveViewerUrl(photoUrl) {
  try {
    const source = new URL(photoUrl);
    const fileId = source.pathname.match(/\/file\/d\/([^/]+)/)?.[1]
      || source.searchParams.get("id");
    if (!fileId) return photoUrl;
    const viewer = new URL(`https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`);
    const resourceKey = source.searchParams.get("resourcekey");
    if (resourceKey) viewer.searchParams.set("resourcekey", resourceKey);
    return viewer.href;
  } catch {
    return photoUrl;
  }
}

function showNotFound() {
  status.textContent = "Student details were not found or are not published.";
  status.hidden = false;
  profile.hidden = true;
}

function displayPhoto(photoUrl, name) {
  if (!photoUrl) {
    const placeholder = document.createElement("div");
    placeholder.className = "student-profile-photo-link";
    placeholder.textContent = "No photo available";
    photo.replaceWith(placeholder);
    return;
  }

  const urls = getPhotoUrls(photoUrl || "");
  let current = 0;
  photo.alt = `${sentenceCaseName(name)} — Photo`;
  photo.src = urls[current] || "";
  photo.addEventListener("error", () => {
    current += 1;
    if (current < urls.length) {
      photo.src = urls[current];
      return;
    }
    const link = document.createElement("a");
    link.className = "student-profile-photo-link";
    link.href = driveViewerUrl(photoUrl);
    link.target = photoUrl ? "_blank" : "";
    link.rel = "noopener noreferrer";
    link.textContent = "Open photo in Google Drive";
    photo.replaceWith(link);
  });
}

async function loadProfile() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    showNotFound();
    return;
  }

  try {
    const snapshot = await getDoc(doc(db, "studentDirectory", id));
    if (!snapshot.exists()) {
      showNotFound();
      return;
    }

    const student = snapshot.data();
    if (student.published !== true) {
      showNotFound();
      return;
    }

    const name = sentenceCaseName(student.name) || "Student";
    document.title = `${name} | Student Profile | Tabiul Mursaleen Nogor Karigori School & College`;
    document.getElementById("studentProfileName").textContent = name;
    displayPhoto(student.photoUrl, name);
    addDetail("Student ID", student.studentCode);
    addDetail("Session", student.session);
    addDetail("Academic Year", student.academicYear);
    addDetail("Branch", displayValue(student.branch));
    addDetail("Class", displayValue(student.className));
    addDetail("Trade", displayValue(student.trade));
    addDetail("Roll", student.roll);
    status.hidden = true;
    profile.hidden = false;
  } catch (error) {
    console.error("শিক্ষার্থী প্রোফাইল লোডের সমস্যা:", error);
    showNotFound();
  }
}

loadProfile();
