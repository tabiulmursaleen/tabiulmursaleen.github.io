
import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const noticesContainer = document.getElementById("latestNotices");
const tickerTrack = document.getElementById("noticeTickerTrack");

function showLatestNoticeMessage(message) {
  if (noticesContainer) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 3;
    cell.className = "notice-table-status";
    cell.textContent = message;
    row.appendChild(cell);
    noticesContainer.replaceChildren(row);
  }
  if (tickerTrack) {
    const tickerItem = document.createElement("li");
    tickerItem.textContent = message;
    tickerTrack.replaceChildren(tickerItem);
  }
}

async function loadLatestNotices() {
  if (!noticesContainer) return;

  try {
    const noticesQuery = query(
      collection(db, "notices"),
      where("published", "==", true)
    );

    const snapshot = await getDocs(noticesQuery);

    noticesContainer.replaceChildren();
    tickerTrack?.replaceChildren();

    if (snapshot.empty) {
      showLatestNoticeMessage("বর্তমানে কোনো প্রকাশিত নোটিশ নেই।");
      return;
    }

    const notices = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    notices.sort((a, b) => {
      const dateA = a.updatedAt?.toMillis?.()
        ?? a.createdAt?.toMillis?.()
        ?? 0;

      const dateB = b.updatedAt?.toMillis?.()
        ?? b.createdAt?.toMillis?.()
        ?? 0;

      return dateB - dateA;
    });

    // হোমপেজে সর্বশেষ ৫টি নোটিশ দেখাবে
    notices.slice(0, 5).forEach((notice) => {
      const row = document.createElement("tr");

      const dateCell = document.createElement("td");
      dateCell.textContent = formatNoticeDate(
        notice.updatedAt ?? notice.createdAt
      );

      const titleCell = document.createElement("td");
      titleCell.textContent = notice.title || "নোটিশ";

      let fileUrl = "";
      if (notice.pdfUrl?.trim()) {
        try {
          const url = new URL(notice.pdfUrl);

          if (url.protocol === "https:") {
            fileUrl = url.href;
          }
        } catch { /* Invalid attachment URLs are shown as unavailable. */ }
      }

      const actionCell = document.createElement("td");
      if (fileUrl) {
        const viewLink = document.createElement("a");
        viewLink.className = "notice-view-link";
        viewLink.href = fileUrl;
        viewLink.target = "_blank";
        viewLink.rel = "noopener noreferrer";
        viewLink.textContent = "দেখুন";
        actionCell.appendChild(viewLink);
      } else {
        actionCell.textContent = "ফাইল নেই";
      }

      row.append(dateCell, titleCell, actionCell);
      noticesContainer.appendChild(row);
      if (tickerTrack) {
        const tickerItem = document.createElement("li");
        const tickerLink = document.createElement("a");
        tickerLink.href = fileUrl || "notice.html";
        if (fileUrl) {
          tickerLink.target = "_blank";
          tickerLink.rel = "noopener noreferrer";
        }
        tickerLink.textContent = titleCell.textContent;
        tickerItem.appendChild(tickerLink);
        tickerTrack.appendChild(tickerItem);
      }
    });

    if (tickerTrack?.children.length) {
      const originals = Array.from(tickerTrack.children);
      originals.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.querySelectorAll("a").forEach((anchor) => {
          anchor.tabIndex = -1;
        });
        tickerTrack.appendChild(clone);
      });
      tickerTrack.classList.add("is-moving");
    }

  } catch (error) {
    console.error("নোটিশ লোড করতে সমস্যা:", error);

    noticesContainer.replaceChildren();
    tickerTrack?.replaceChildren();

    showLatestNoticeMessage("নোটিশ লোড করা যায়নি।");
  }
}

function formatNoticeDate(timestamp) {
  if (!timestamp?.toDate) return "তারিখ অনির্ধারিত";

  return new Intl.DateTimeFormat("bn-BD", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(timestamp.toDate());
}

loadLatestNotices();
