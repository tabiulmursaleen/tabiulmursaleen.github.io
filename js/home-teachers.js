(function renderHomeTeacherPreview() {
  const grid = document.getElementById("teacherPreviewGrid");
  if (!grid || typeof teachers === "undefined") return;

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);

  grid.innerHTML = teachers.slice(0, 10).map(teacher => `
    <article class="teacher-card${teacher.id === 'teacher-03' ? ' teacher-name-small' : ''}">
      <a class="teacher-preview-card-link" href="teacher-profile.html?id=${encodeURIComponent(teacher.id)}">
        <img src="${escapeHtml(teacher.photo)}" alt="${escapeHtml(teacher.name)}" loading="lazy">
        <div class="teacher-card-content">
          <h2>${escapeHtml(teacher.name)}</h2>
          <p>${escapeHtml(teacher.designation)}</p>
          ${teacher.subject ? `<span>${escapeHtml(teacher.subject)}</span>` : ""}
        </div>
      </a>
    </article>
  `).join("");
})();
