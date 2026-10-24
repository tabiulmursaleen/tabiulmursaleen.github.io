(() => {
  const monthNames = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
  const banglaDigits = (value) => String(value).replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[digit]);
  const pad = (value) => String(value).padStart(2, "0");
  const toISO = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;
  const fromISO = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  };
  const formatDate = (value) => {
    const date = fromISO(value);
    return date ? `${banglaDigits(date.getDate())} ${monthNames[date.getMonth()]} ${banglaDigits(date.getFullYear())}` : "";
  };

  document.querySelectorAll('input[type="date"]').forEach((nativeInput) => {
    if (nativeInput.dataset.themedCalendar === "ready") return;
    nativeInput.dataset.themedCalendar = "ready";

    const originalValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
    const wrapper = document.createElement("div");
    wrapper.className = "site-calendar-control";
    nativeInput.before(wrapper);
    wrapper.append(nativeInput);

    const visibleInput = document.createElement("input");
    visibleInput.type = "text";
    visibleInput.className = "site-calendar-value";
    visibleInput.inputMode = "none";
    visibleInput.autocomplete = "off";
    visibleInput.placeholder = "তারিখ নির্বাচন করুন";
    visibleInput.setAttribute("aria-readonly", "true");
    visibleInput.setAttribute("aria-label", nativeInput.getAttribute("aria-label") || nativeInput.closest("label")?.childNodes[0]?.textContent?.trim() || "তারিখ নির্বাচন করুন");
    if (nativeInput.required) {
      visibleInput.required = true;
      nativeInput.required = false;
    }

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "site-calendar-open";
    openButton.setAttribute("aria-label", "ক্যালেন্ডার খুলুন");
    openButton.setAttribute("aria-haspopup", "dialog");
    openButton.setAttribute("aria-expanded", "false");
    openButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M7 14h.01M12 14h.01M17 14h.01M7 18h.01M12 18h.01M17 18h.01"/></svg>';

    const popup = document.createElement("div");
    popup.className = "site-calendar-popup";
    popup.hidden = true;
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-label", "তারিখ নির্বাচন");
    const head = document.createElement("div");
    head.className = "site-calendar-head";
    head.innerHTML = '<button type="button" class="site-calendar-prev" aria-label="আগের মাস">‹</button><div class="site-calendar-selects"><select class="site-calendar-month" aria-label="মাস"></select><select class="site-calendar-year" aria-label="বছর"></select></div><button type="button" class="site-calendar-next" aria-label="পরের মাস">›</button>';
    const weekdays = document.createElement("div");
    weekdays.className = "site-calendar-weekdays";
    weekdays.innerHTML = "<span>রবি</span><span>সোম</span><span>মঙ্গল</span><span>বুধ</span><span>বৃহঃ</span><span>শুক্র</span><span>শনি</span>";
    const days = document.createElement("div");
    days.className = "site-calendar-days";
    const footer = document.createElement("p");
    footer.className = "site-calendar-foot";
    footer.textContent = "তারিখ নির্বাচন করুন";
    popup.append(head, weekdays, days, footer);
    wrapper.append(visibleInput, openButton, popup);

    nativeInput.classList.add("site-calendar-native");
    nativeInput.tabIndex = -1;
    nativeInput.setAttribute("aria-hidden", "true");

    const monthSelect = head.querySelector(".site-calendar-month");
    const yearSelect = head.querySelector(".site-calendar-year");
    monthNames.forEach((name, index) => monthSelect.add(new Option(name, String(index))));
    const now = new Date();
    for (let year = now.getFullYear() + 10; year >= 1900; year--) {
      yearSelect.add(new Option(banglaDigits(year), String(year)));
    }
    let viewDate = fromISO(nativeInput.value) || now;

    const syncVisible = () => { visibleInput.value = formatDate(nativeInput.value); };
    const setNativeValue = (value) => {
      originalValue.set.call(nativeInput, value);
      syncVisible();
    };
    Object.defineProperty(nativeInput, "value", {
      configurable: true,
      get() { return originalValue.get.call(nativeInput); },
      set(value) { setNativeValue(value); }
    });
    syncVisible();

    const isInRange = (iso) => (!nativeInput.min || iso >= nativeInput.min) && (!nativeInput.max || iso <= nativeInput.max);
    const draw = () => {
      monthSelect.value = String(viewDate.getMonth());
      yearSelect.value = String(viewDate.getFullYear());
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const firstWeekday = new Date(year, month, 1).getDay();
      const selected = nativeInput.value;
      const today = toISO(now.getFullYear(), now.getMonth(), now.getDate());
      const cells = [];
      for (let slot = 0; slot < 42; slot++) {
        const date = new Date(year, month, slot - firstWeekday + 1);
        const iso = toISO(date.getFullYear(), date.getMonth(), date.getDate());
        const outside = date.getMonth() !== month;
        const classes = [outside ? "is-outside" : "", iso === selected ? "is-selected" : "", iso === today ? "is-today" : ""].filter(Boolean).join(" ");
        cells.push(`<button type="button" class="${classes}" data-date="${iso}" aria-pressed="${iso === selected}" ${isInRange(iso) ? "" : "disabled"}>${banglaDigits(date.getDate())}</button>`);
      }
      days.innerHTML = cells.join("");
    };
    const setOpen = (open) => {
      popup.hidden = !open;
      openButton.setAttribute("aria-expanded", String(open));
      if (open) draw();
    };

    visibleInput.addEventListener("click", () => setOpen(popup.hidden));
    visibleInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen(popup.hidden);
      } else if (event.key !== "Tab" && event.key !== "Escape") {
        event.preventDefault();
      }
    });
    openButton.addEventListener("click", () => setOpen(popup.hidden));
    head.querySelector(".site-calendar-prev").addEventListener("click", () => {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
      draw();
    });
    head.querySelector(".site-calendar-next").addEventListener("click", () => {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
      draw();
    });
    monthSelect.addEventListener("change", () => { viewDate = new Date(viewDate.getFullYear(), Number(monthSelect.value), 1); draw(); });
    yearSelect.addEventListener("change", () => { viewDate = new Date(Number(yearSelect.value), viewDate.getMonth(), 1); draw(); });
    days.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-date]");
      if (!button || button.disabled) return;
      setNativeValue(button.dataset.date);
      nativeInput.dispatchEvent(new Event("input", { bubbles: true }));
      nativeInput.dispatchEvent(new Event("change", { bubbles: true }));
      setOpen(false);
    });
    nativeInput.addEventListener("input", syncVisible);
    nativeInput.addEventListener("change", syncVisible);
    nativeInput.form?.addEventListener("reset", () => requestAnimationFrame(syncVisible));
    document.addEventListener("click", (event) => {
      if (!wrapper.contains(event.target)) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
  });
})();
