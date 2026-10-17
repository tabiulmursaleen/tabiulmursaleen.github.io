
import { db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const noticesContainer = document.getElementById("latestNotices");
const tickerTrack = document.getElementById("noticeTickerTrack");

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
      const li = document.createElement("li");
      li.textContent = "বর্তমানে কোনো প্রকাশিত নোটিশ নেই।";
      noticesContainer.appendChild(li);
      if (tickerTrack) {
        const tickerItem = document.createElement("li");
        tickerItem.textContent = li.textContent;
        tickerTrack.appendChild(tickerItem);
      }
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
      const li = document.createElement("li");

      const date = document.createElement("span");
      date.textContent = formatNoticeDate(
        notice.updatedAt ?? notice.createdAt
      );

      const link = document.createElement("a");
      link.textContent = notice.title || "নোটিশ";
      link.href = notice.pdfUrl?.trim() || "notice.html";

      if (notice.pdfUrl?.trim()) {
        try {
          const url = new URL(notice.pdfUrl);

          if (url.protocol === "https:") {
            link.href = url.href;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
          } else {
            link.href = "notice.html";
          }
        } catch {
          link.href = "notice.html";
        }
      }

      li.appendChild(date);
      li.appendChild(link);
      noticesContainer.appendChild(li);
      if (tickerTrack) {
        const tickerItem = document.createElement("li");
        tickerItem.appendChild(link.cloneNode(true));
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

    const li = document.createElement("li");
    li.textContent = "নোটিশ লোড করা যায়নি।";
    noticesContainer.appendChild(li);
    if (tickerTrack) {
      const tickerItem = document.createElement("li");
      tickerItem.textContent = li.textContent;
      tickerTrack.appendChild(tickerItem);
    }
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
