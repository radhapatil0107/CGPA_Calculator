/**
 * Dual-Mode SGPA & CGPA Calculator Client-side Logic
 * Mode 1: DYPCET Data Science (NEP-2020 syllabus for 2nd, 3rd & 4th Year)
 * Mode 2: General Calculator (Step-by-step for any student / college)
 * D.Y. Patil College of Engineering & Technology, Kolhapur
 */

// Grade Scale Definition
const GRADE_POINTS = {
  "O": 10,
  "A+": 9,
  "A": 8,
  "B+": 7,
  "B": 6,
  "C": 5,
  "P": 4,
  "F": 0
};

const GRADE_OPTIONS = [
  { grade: "O", points: 10, label: "O (Outstanding - 10)" },
  { grade: "A+", points: 9, label: "A+ (Excellent - 9)" },
  { grade: "A", points: 8, label: "A (Very Good - 8)" },
  { grade: "B+", points: 7, label: "B+ (Good - 7)" },
  { grade: "B", points: 6, label: "B (Above Average - 6)" },
  { grade: "C", points: 5, label: "C (Average - 5)" },
  { grade: "P", points: 4, label: "P (Pass - 4)" },
  { grade: "F", points: 0, label: "F (Fail - 0)" }
];

// State variables
let activeMainTab = "dypcet"; // "dypcet" or "general"
let currentDypcetYear = "second_year";
let dypcetYearResults = {
  semA: null,
  semB: null
};

// General mode state
let generalSemesters = [
  {
    semNo: 1,
    name: "Semester 1",
    credits: 0,
    sgpa: 0,
    subjects: []
  }
];
let activeGeneralSemIndex = 0;

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  initDypcetTab();
  initGeneralTab();
});

// =============================================================================
// MAIN NAVIGATION TABS (DYPCET vs GENERAL)
// =============================================================================
function switchMainTab(tab) {
  activeMainTab = tab;
  const btnDypcet = document.getElementById("tabBtnDypcet");
  const btnGeneral = document.getElementById("tabBtnGeneral");
  const contentDypcet = document.getElementById("tabContentDypcet");
  const contentGeneral = document.getElementById("tabContentGeneral");

  if (tab === "dypcet") {
    btnDypcet.classList.add("active");
    btnGeneral.classList.remove("active");
    contentDypcet.style.display = "block";
    contentGeneral.style.display = "none";
  } else {
    btnGeneral.classList.add("active");
    btnDypcet.classList.remove("active");
    contentGeneral.style.display = "block";
    contentDypcet.style.display = "none";
  }
}

// =============================================================================
// TAB 1: DYPCET DATA SCIENCE LOGIC
// =============================================================================
function initDypcetTab() {
  const select = document.getElementById("dypcetYearSelect");
  if (select) {
    currentDypcetYear = select.value || "second_year";
  }
  renderDypcetYear(currentDypcetYear);
}

function onDypcetYearChange() {
  const select = document.getElementById("dypcetYearSelect");
  currentDypcetYear = select.value;
  renderDypcetYear(currentDypcetYear);
}

/**
 * Render both semesters of the selected year together on one page
 */
function renderDypcetYear(yearKey) {
  const container = document.getElementById("dypcetSemestersContainer");
  if (!container) return;
  container.innerHTML = "";

  // Reset calculations
  dypcetYearResults = { semA: null, semB: null };
  const resultCard = document.getElementById("dypcetYearResultCard");
  if (resultCard) resultCard.style.display = "none";
  const statusEl = document.getElementById("dypcetSaveStatus");
  if (statusEl) statusEl.textContent = "";

  const syllabus = typeof DYPCET_SYLLABUS !== "undefined" ? DYPCET_SYLLABUS : null;
  if (!syllabus || !syllabus.years || !syllabus.years[yearKey]) {
    container.innerHTML = `<div class="alert alert-warning">Syllabus data for ${yearKey} not found.</div>`;
    return;
  }

  const semNumbers = syllabus.years[yearKey].semesters; // e.g. [3, 4]

  semNumbers.forEach(semNo => {
    const semData = syllabus.semesters[semNo];
    if (!semData) return;

    const section = document.createElement("div");
    section.className = "semester-section-card";
    section.id = `dypcetSemSection_${semNo}`;

    section.innerHTML = `
      <div class="semester-section-header">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.25rem;">
            <span>&#128218;</span> ${escapeHtml(semData.full_name)}
          </h3>
          <span style="font-size: 0.85rem; color: var(--text-muted);">
            Evaluation Scheme &bull; ${semData.total_credits} Evaluated Credits &bull; Max Scheme Marks: ${semData.total_marks}
          </span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="text-align: right;">
            <span style="font-size: 0.78rem; color: var(--text-muted); display: block;">Semester SGPA</span>
            <span class="badge badge-A-plus" id="liveSemSgpa_${semNo}" style="font-size: 1.15rem; font-weight: 800; padding: 0.35rem 0.85rem;">
              0.00
            </span>
          </div>
        </div>
      </div>

      <!-- Pre-filled Subjects Table -->
      <div class="table-responsive" style="margin-bottom: 1.25rem;">
        <table class="table" id="dypcetTable_${semNo}">
          <thead>
            <tr>
              <th style="width: 4%; text-align: center;">#</th>
              <th style="width: 40%;">Course Name &amp; Code</th>
              <th style="width: 10%; text-align: center;">Credits</th>
              <th style="width: 18%; text-align: center;">Obtained Marks <span class="req">*</span></th>
              <th style="width: 12%; text-align: center;">Total Marks</th>
              <th style="width: 16%; text-align: center;">Grade</th>
            </tr>
          </thead>
          <tbody>
            ${renderDypcetCourseRows(semData.courses, semNo)}
          </tbody>
        </table>
      </div>

      <!-- Semester Action Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <div style="font-size: 0.85rem; color: var(--text-muted);" id="semSummaryText_${semNo}">
          Enter your obtained marks for each course above. Grades and SGPA will be calculated automatically.
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button type="button" class="btn btn-primary btn-sm" onclick="calculateDypcetSemester(${semNo})">
            &#9889; Calculate ${semData.title} SGPA
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="saveIndividualDypcetSemester(${semNo})">
            &#128190; Save to Tracker
          </button>
        </div>
      </div>
    `;

    container.appendChild(section);
  });
}

function renderDypcetCourseRows(courses, semNo) {
  return courses.map((c, idx) => {
    const isAudit = c.is_audit === true;
    return `
      <tr class="dypcet-course-row" data-sem="${semNo}" data-credits="${c.credits}" data-max-marks="${c.total_marks}" data-is-audit="${isAudit ? '1' : '0'}">
        <td style="text-align: center; color: var(--text-muted); font-weight: 600; vertical-align: middle;">
          ${idx + 1}
        </td>
        <td style="vertical-align: middle;">
          <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem; line-height: 1.25;">
            ${escapeHtml(c.name)}
          </div>
          <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 0.2rem; display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
            <span class="badge" style="font-size: 0.7rem; padding: 0.15rem 0.4rem; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--primary); font-family: monospace;">
              ${escapeHtml(c.code)}
            </span>
            <span>${escapeHtml(c.type)}</span>
            ${isAudit ? '<span class="badge" style="font-size: 0.68rem; background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3);">Mandatory Audit</span>' : ''}
          </div>
          <input type="hidden" class="dypcet-sub-name" value="${escapeHtml(c.name)}">
          <input type="hidden" class="dypcet-sub-code" value="${escapeHtml(c.code)}">
        </td>
        <td style="text-align: center; vertical-align: middle;">
          ${isAudit ? 
            '<span class="badge" style="background: var(--bg-secondary); color: var(--text-muted); font-weight: 600; padding: 0.3rem 0.6rem;">Audit</span>' : 
            `<span class="badge badge-primary" style="font-size: 0.95rem; font-weight: 700; padding: 0.35rem 0.65rem;">${c.credits}</span>`
          }
          <input type="hidden" class="dypcet-sub-credits" value="${c.credits}">
        </td>
        <td style="vertical-align: middle; text-align: center;">
          <input 
            type="number" 
            class="form-control dypcet-marks-input" 
            placeholder="0 - ${c.total_marks}" 
            min="0"
            max="${c.total_marks}"
            step="any"
            autocomplete="off"
            style="font-size: 0.95rem; font-weight: 700; text-align: center; max-width: 120px; margin: 0 auto;"
            oninput="onDypcetMarksInput(this)"
            data-max="${c.total_marks}"
          >
          <div class="dypcet-marks-error" style="display: none; font-size: 0.75rem; text-align: center; color: var(--danger, #ef4444); margin-top: 0.2rem; font-weight: 600;"></div>
        </td>
        <td style="text-align: center; vertical-align: middle;">
          <span class="badge" style="font-size: 0.9rem; font-weight: 700; background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-main); min-width: 45px; display: inline-block;">
            ${c.total_marks}
          </span>
          <input type="hidden" class="dypcet-total-marks" value="${c.total_marks}">
        </td>
        <td style="text-align: center; vertical-align: middle;">
          <input type="hidden" class="dypcet-sub-grade" value="">
          <span class="badge dypcet-grade-badge" style="font-size: 1rem; font-weight: 700; padding: 0.35rem 0.75rem; display: inline-block; min-width: 45px; background: var(--bg-secondary); color: var(--text-muted); border: 1px solid var(--border-color);">-</span>
        </td>
      </tr>
    `;
  }).join("");
}

function getGradeSelectOptions(defaultGrade = "") {
  return GRADE_OPTIONS.map(g => {
    const isSelected = g.grade === defaultGrade ? "selected" : "";
    return `<option value="${g.grade}" ${isSelected}>${g.label}</option>`;
  }).join("");
}

function getGradeBadgeClass(grade) {
  switch ((grade || "").toUpperCase()) {
    case "O": return "badge-O";
    case "A+": return "badge-A-plus";
    case "A": return "badge-A";
    case "B+": return "badge-B-plus";
    case "B": return "badge-B";
    case "C": return "badge-C";
    case "P": return "badge-P";
    case "F": return "badge-F";
    default: return "";
  }
}

function updateDypcetRowGradeBadge(row, grade) {
  const badge = row.querySelector(".dypcet-grade-badge");
  const hiddenInput = row.querySelector(".dypcet-sub-grade");
  if (!badge) return;

  badge.className = "badge dypcet-grade-badge";
  if (!grade) {
    badge.textContent = "-";
    badge.style.background = "var(--bg-secondary)";
    badge.style.color = "var(--text-muted)";
    badge.style.border = "1px solid var(--border-color)";
    if (hiddenInput) hiddenInput.value = "";
    return;
  }

  badge.textContent = grade;
  badge.style.background = "";
  badge.style.color = "";
  badge.style.border = "none";
  const badgeClass = getGradeBadgeClass(grade);
  if (badgeClass) {
    badge.classList.add(badgeClass);
  }
  if (hiddenInput) hiddenInput.value = grade;
}

/**
 * Marks input handler: auto-calculates grade and updates badge
 */
function onDypcetMarksInput(inputEl) {
  const row = inputEl.closest("tr");
  const maxMarks = parseFloat(row.dataset.maxMarks) || 100;
  const val = inputEl.value.trim();
  const errorEl = row.querySelector(".dypcet-marks-error");

  if (val === "") {
    inputEl.classList.remove("is-invalid");
    if (errorEl) errorEl.style.display = "none";
    updateDypcetRowGradeBadge(row, "");
    return;
  }

  const num = parseFloat(val);
  if (isNaN(num) || num < 0 || num > maxMarks) {
    inputEl.classList.add("is-invalid");
    if (errorEl) {
      errorEl.textContent = `Max: ${maxMarks}`;
      errorEl.style.display = "block";
    }
    updateDypcetRowGradeBadge(row, "");
  } else {
    inputEl.classList.remove("is-invalid");
    if (errorEl) errorEl.style.display = "none";
    const pct = (num / maxMarks) * 100;
    const autoGrade = getGradeFromPercentage(pct);
    updateDypcetRowGradeBadge(row, autoGrade);
  }
}

function getDefaultMarksForGrade(grade, maxMarks = 100) {
  let pct = 85;
  switch ((grade || "").toUpperCase()) {
    case "O": pct = 95; break;
    case "A+": pct = 85; break;
    case "A": pct = 75; break;
    case "B+": pct = 65; break;
    case "B": pct = 58; break;
    case "C": pct = 52; break;
    case "P": pct = 45; break;
    case "F": pct = 30; break;
    default: return "";
  }
  return Math.round((pct / 100) * maxMarks);
}

function getGradeFromPercentage(pct) {
  if (pct === null || pct === undefined || isNaN(pct) || pct === "") return "";
  const p = parseFloat(pct);
  if (p >= 90) return "O";
  if (p >= 80) return "A+";
  if (p >= 70) return "A";
  if (p >= 60) return "B+";
  if (p >= 55) return "B";
  if (p >= 50) return "C";
  if (p >= 40) return "P";
  return "F";
}

/**
 * Calculate SGPA for one semester in DYPCET mode
 */
function calculateDypcetSemester(semNo) {
  const table = document.getElementById(`dypcetTable_${semNo}`);
  if (!table) return null;

  const rows = table.querySelectorAll("tbody tr.dypcet-course-row");
  let totalCredits = 0;
  let totalPoints = 0;
  const subjects = [];
  let hasMissingMarks = false;

  rows.forEach(r => {
    const isAudit = r.dataset.isAudit === "1";
    const name = r.querySelector(".dypcet-sub-name").value;
    const code = r.querySelector(".dypcet-sub-code").value;
    const credits = parseFloat(r.querySelector(".dypcet-sub-credits").value) || 0;
    const marksInput = r.querySelector(".dypcet-marks-input");
    const gradeInput = r.querySelector(".dypcet-sub-grade");
    const grade = gradeInput ? (gradeInput.value || "").trim().toUpperCase() : "";
    const marksVal = marksInput ? marksInput.value.trim() : "";
    const marks = marksVal !== "" ? parseFloat(marksVal) : null;
    const totalMarks = parseFloat(r.querySelector(".dypcet-total-marks").value) || 100;

    if (!isAudit) {
      if (marks === null || isNaN(marks) || marks < 0 || marks > totalMarks || !grade) {
        if (marksInput) marksInput.classList.add("is-invalid");
        hasMissingMarks = true;
      } else {
        if (marksInput) marksInput.classList.remove("is-invalid");
        const gp = GRADE_POINTS[grade] !== undefined ? GRADE_POINTS[grade] : 0;
        totalCredits += credits;
        totalPoints += (credits * gp);
        subjects.push({
          name: name,
          code: code,
          credits: credits,
          grade: grade,
          marks: marks,
          total_marks: totalMarks,
          grade_point: gp,
          earned_points: credits * gp
        });
      }
    } else {
      // Audit courses: record if marks entered
      if (grade && marks !== null) {
        subjects.push({
          name: name,
          code: code,
          credits: 0,
          grade: grade,
          marks: marks,
          total_marks: totalMarks,
          grade_point: GRADE_POINTS[grade] || 0,
          earned_points: 0
        });
      }
    }
  });

  if (hasMissingMarks) {
    alert(`Please enter valid obtained marks for all credit courses in Semester ${semNo}.`);
    return null;
  }

  const sgpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0.0;

  // Update live badge
  const badge = document.getElementById(`liveSemSgpa_${semNo}`);
  if (badge) {
    badge.textContent = sgpa.toFixed(2);
  }

  const summary = document.getElementById(`semSummaryText_${semNo}`);
  if (summary) {
    summary.innerHTML = `<strong>Calculated:</strong> SGPA: <span style="color: var(--primary); font-weight: 700;">${sgpa.toFixed(2)}</span> &bull; Evaluated Credits: ${totalCredits.toFixed(1)} &bull; Total Points: ${totalPoints.toFixed(1)}`;
  }

  return {
    semester_no: semNo,
    semester_name: `Semester ${semNo}`,
    credits: totalCredits,
    sgpa: sgpa,
    total_points: totalPoints,
    subjects: subjects
  };
}

/**
 * Calculate the Year Result (Credit-Weighted Average of both semesters)
 */
async function calculateDypcetYearResult() {
  const syllabus = typeof DYPCET_SYLLABUS !== "undefined" ? DYPCET_SYLLABUS : null;
  if (!syllabus || !syllabus.years || !syllabus.years[currentDypcetYear]) return;

  const [semA, semB] = syllabus.years[currentDypcetYear].semesters;

  const resA = calculateDypcetSemester(semA);
  const resB = calculateDypcetSemester(semB);

  if (!resA || !resB) return;

  dypcetYearResults.semA = resA;
  dypcetYearResults.semB = resB;

  // Compute Year Weighted Average: (c1*s1 + c2*s2) / (c1 + c2)
  const totalYearCredits = resA.credits + resB.credits;
  const totalYearPoints = resA.total_points + resB.total_points;
  const yearSgpa = totalYearCredits > 0 ? parseFloat((totalYearPoints / totalYearCredits).toFixed(2)) : 0.0;
  const percentage = Math.min(100, yearSgpa * 9.5);

  let division = "First Class with Distinction";
  if (yearSgpa < 4.0) division = "Failed / Needs Improvement";
  else if (yearSgpa < 5.0) division = "Pass Class";
  else if (yearSgpa < 5.75) division = "Second Class";
  else if (yearSgpa < 6.75) division = "Higher Second Class";
  else if (yearSgpa < 7.75) division = "First Class";

  // Update Year Result Card
  const resultCard = document.getElementById("dypcetYearResultCard");
  const yearHeading = document.getElementById("yearResultHeading");
  const yearSgpaEl = document.getElementById("yearResultSgpaDisplay");
  const sem1SgpaEl = document.getElementById("yearSem1SgpaDisplay");
  const sem1LabelEl = document.getElementById("yearSem1LabelDisplay");
  const sem2SgpaEl = document.getElementById("yearSem2SgpaDisplay");
  const sem2LabelEl = document.getElementById("yearSem2LabelDisplay");
  const yearPctEl = document.getElementById("yearPercentageDisplay");
  const yearDivEl = document.getElementById("yearDivisionDisplay");

  const yearTitle = syllabus.years[currentDypcetYear].name;
  if (yearHeading) yearHeading.textContent = `${yearTitle} Result Summary`;
  if (yearSgpaEl) yearSgpaEl.textContent = yearSgpa.toFixed(2);
  if (sem1SgpaEl) sem1SgpaEl.textContent = resA.sgpa.toFixed(2);
  if (sem1LabelEl) sem1LabelEl.textContent = `Sem ${semA} SGPA (${resA.credits} credits)`;
  if (sem2SgpaEl) sem2SgpaEl.textContent = resB.sgpa.toFixed(2);
  if (sem2LabelEl) sem2LabelEl.textContent = `Sem ${semB} SGPA (${resB.credits} credits)`;
  if (yearPctEl) yearPctEl.textContent = `${percentage.toFixed(2)}%`;
  if (yearDivEl) yearDivEl.textContent = division;

  if (resultCard) {
    resultCard.style.display = "block";
    resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

/**
 * Save both semesters of the active year to the database tracker
 */
async function saveDypcetYearSemesters() {
  if (!dypcetYearResults.semA || !dypcetYearResults.semB) {
    await calculateDypcetYearResult();
  }

  const resA = dypcetYearResults.semA;
  const resB = dypcetYearResults.semB;

  if (!resA || !resB) return;

  const btn = document.getElementById("btnSaveBothSemesters");
  const statusEl = document.getElementById("dypcetSaveStatus");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = "&#9203; Saving Both Semesters...";
  }

  try {
    const payload = {
      semesters: [
        {
          semester_no: resA.semester_no,
          semester_name: `Semester ${resA.semester_no} (SY)`,
          credits: resA.credits,
          sgpa: resA.sgpa,
          subjects: resA.subjects
        },
        {
          semester_no: resB.semester_no,
          semester_name: `Semester ${resB.semester_no} (SY)`,
          credits: resB.credits,
          sgpa: resB.sgpa,
          subjects: resB.subjects
        }
      ]
    };

    const response = await fetch("/api/save-cgpa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      if (response.status === 401) {
        alert("Please log in first to save your semesters to the tracker.");
        window.location.href = "/login?next=calculator_view";
        return;
      }
      throw new Error(data.error || "Failed to save semesters");
    }

    if (statusEl) {
      statusEl.style.color = "#10b981";
      statusEl.innerHTML = `&#10004; Semesters ${resA.semester_no} &amp; ${resB.semester_no} saved! Overall CGPA: <strong>${parseFloat(data.cgpa).toFixed(2)}</strong> <a href="/tracker" style="text-decoration: underline; margin-left: 6px;">View Tracker &rarr;</a>`;
    }
  } catch (err) {
    if (statusEl) {
      statusEl.style.color = "#ef4444";
      statusEl.textContent = `Error: ${err.message}`;
    } else {
      alert(err.message);
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "&#128190; Save Both Semesters to Tracker";
    }
  }
}

/**
 * Save an individual semester from DYPCET mode
 */
async function saveIndividualDypcetSemester(semNo) {
  const res = calculateDypcetSemester(semNo);
  if (!res) return;

  try {
    const payload = {
      semester_no: res.semester_no,
      semester_name: `Semester ${res.semester_no} (SY)`,
      credits: res.credits,
      sgpa: res.sgpa,
      subjects: res.subjects
    };

    const response = await fetch("/api/semesters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      if (response.status === 401) {
        alert("Please log in to save your semester to the tracker.");
        window.location.href = "/login?next=calculator_view";
        return;
      }
      throw new Error(data.error || "Failed to save");
    }

    alert(`Semester ${semNo} (SGPA: ${res.sgpa.toFixed(2)}) saved successfully to your Tracker!`);
  } catch (err) {
    alert("Error: " + err.message);
  }
}

/**
 * Reset all grades and marks in DYPCET mode
 */
function resetDypcetGrades() {
  document.querySelectorAll("#dypcetSemestersContainer tr.dypcet-course-row").forEach(row => {
    const marksInp = row.querySelector(".dypcet-marks-input");
    if (marksInp) {
      marksInp.value = "";
      marksInp.classList.remove("is-invalid");
    }
    const err = row.querySelector(".dypcet-marks-error");
    if (err) err.style.display = "none";
    updateDypcetRowGradeBadge(row, "");
  });
  document.querySelectorAll("[id^='liveSemSgpa_']").forEach(el => {
    el.textContent = "0.00";
  });
  const resultCard = document.getElementById("dypcetYearResultCard");
  if (resultCard) resultCard.style.display = "none";
}

function printDypcetYearReport() {
  if (!dypcetYearResults.semA || !dypcetYearResults.semB) {
    calculateDypcetYearResult();
  }
  const resA = dypcetYearResults.semA;
  const resB = dypcetYearResults.semB;
  if (!resA || !resB) return;

  const totalCredits = resA.credits + resB.credits;
  const totalPoints = resA.total_points + resB.total_points;
  const yearSgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";

  document.getElementById("printReportTitle").textContent = "ANNUAL ACADEMIC GRADE REPORT";
  document.getElementById("printSemName").textContent = `Academic Year (Semesters ${resA.semester_no} & ${resB.semester_no})`;
  document.getElementById("printCredits").textContent = totalCredits.toFixed(1);
  document.getElementById("printPoints").textContent = totalPoints.toFixed(1);
  document.getElementById("printSgpa").textContent = yearSgpa;

  const tbody = document.getElementById("printBreakdownBody");
  tbody.innerHTML = "";

  const allSubjects = [...resA.subjects, ...resB.subjects];
  allSubjects.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${escapeHtml(s.name)}</strong></td>
      <td style="text-align: center;">${s.credits}</td>
      <td style="text-align: center;">${s.marks !== null && s.marks !== undefined ? s.marks : '-'} / ${s.total_marks || 100}</td>
      <td style="text-align: center;"><strong>${s.grade}</strong></td>
      <td style="text-align: center;">${s.grade_point}</td>
      <td style="text-align: right;">${s.earned_points}</td>
    `;
    tbody.appendChild(tr);
  });

  window.print();
}

// =============================================================================
// TAB 2: GENERAL MODE LOGIC (ANY USER / ANY COLLEGE - MAX 8 SEMESTERS)
// =============================================================================
const MAX_GENERAL_SEMESTERS = 8;

function initGeneralTab() {
  if (generalSemesters.length > MAX_GENERAL_SEMESTERS) {
    generalSemesters = generalSemesters.slice(0, MAX_GENERAL_SEMESTERS);
    if (activeGeneralSemIndex >= MAX_GENERAL_SEMESTERS) {
      activeGeneralSemIndex = MAX_GENERAL_SEMESTERS - 1;
    }
  }
  renderGeneralSemesterPills();
  renderActiveGeneralSemester();
  updateGeneralOverallSummary();
  updateAddSemesterButtonState();
}

function updateAddSemesterButtonState() {
  const addBtn = document.getElementById("btnAddNewGenSem");
  const removeBtn = document.getElementById("btnRemoveGenSem");
  if (addBtn) {
    if (generalSemesters.length >= MAX_GENERAL_SEMESTERS) {
      addBtn.disabled = true;
      addBtn.style.opacity = "0.65";
      addBtn.style.cursor = "not-allowed";
      addBtn.title = "Maximum 8 semesters reached (4-Year Engineering Degree)";
      addBtn.innerHTML = `&#10004; Max 8 Semesters Reached`;
    } else {
      addBtn.disabled = false;
      addBtn.style.opacity = "1";
      addBtn.style.cursor = "pointer";
      addBtn.title = `Add Semester ${generalSemesters.length + 1} of ${MAX_GENERAL_SEMESTERS}`;
      addBtn.innerHTML = `+ Add Semester ${generalSemesters.length + 1} (Max 8)`;
    }
  }
  if (removeBtn) {
    removeBtn.style.display = generalSemesters.length > 1 ? "inline-flex" : "none";
  }
}

function renderGeneralSemesterPills() {
  const container = document.getElementById("generalSemPillsContainer");
  if (!container) return;
  container.innerHTML = "";

  generalSemesters.forEach((sem, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `btn btn-sm ${idx === activeGeneralSemIndex ? 'btn-primary' : 'btn-outline'}`;
    btn.style.fontWeight = "700";
    btn.innerHTML = `${escapeHtml(sem.name)} ${sem.sgpa > 0 ? `(${sem.sgpa.toFixed(2)})` : ''}`;
    btn.onclick = () => switchGeneralSemester(idx);
    container.appendChild(btn);
  });
  updateAddSemesterButtonState();
}

function switchGeneralSemester(index) {
  activeGeneralSemIndex = index;
  renderGeneralSemesterPills();
  renderActiveGeneralSemester();
}

function addNewGeneralSemester() {
  if (generalSemesters.length >= MAX_GENERAL_SEMESTERS) {
    alert("Maximum limit of 8 semesters reached! A 4-year engineering degree has only 8 semesters.");
    updateAddSemesterButtonState();
    return;
  }
  const nextNo = generalSemesters.length + 1;
  generalSemesters.push({
    semNo: nextNo,
    name: `Semester ${nextNo}`,
    credits: 0,
    sgpa: 0,
    subjects: []
  });
  activeGeneralSemIndex = generalSemesters.length - 1;
  renderGeneralSemesterPills();
  renderActiveGeneralSemester();
  updateGeneralOverallSummary();
  updateAddSemesterButtonState();
}

function removeLastGeneralSemester() {
  if (generalSemesters.length <= 1) {
    alert("At least one semester must remain.");
    return;
  }
  const lastSem = generalSemesters[generalSemesters.length - 1];
  if (!confirm(`Are you sure you want to remove ${lastSem.name}?`)) return;
  generalSemesters.pop();
  if (activeGeneralSemIndex >= generalSemesters.length) {
    activeGeneralSemIndex = generalSemesters.length - 1;
  }
  renderGeneralSemesterPills();
  renderActiveGeneralSemester();
  updateGeneralOverallSummary();
  updateAddSemesterButtonState();
}

function renderActiveGeneralSemester() {
  const sem = generalSemesters[activeGeneralSemIndex];
  if (!sem) return;

  const titleEl = document.getElementById("generalActiveSemTitle");
  if (titleEl) titleEl.textContent = `${sem.name} Course Subjects`;

  const tbody = document.getElementById("generalSubjectsBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (sem.subjects.length === 0) {
    // Show a helpful placeholder row prompting user to add subjects
    const placeholderRow = document.createElement("tr");
    placeholderRow.id = "generalEmptyRowHint";
    placeholderRow.innerHTML = `
      <td colspan="6" style="text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
        <div style="font-size: 2rem; margin-bottom: 0.4rem;">📝</div>
        <div style="font-size: 0.92rem;">No subjects added yet. Click <strong>+ Add Subject Row</strong> to start entering your subjects.</div>
      </td>
    `;
    tbody.appendChild(placeholderRow);
    updateGeneralLiveCredits();
    return;
  }

  sem.subjects.forEach((sub, subIdx) => {
    const tr = document.createElement("tr");
    tr.className = "general-sub-row";
    const obt = sub.obtained_marks !== undefined && sub.obtained_marks !== null ? sub.obtained_marks : "";
    const tot = sub.total_marks !== undefined && sub.total_marks !== null ? sub.total_marks : "";
    const grade = sub.grade || (obt !== "" && tot !== "" && parseFloat(tot) > 0 ? getGradeFromPercentage((parseFloat(obt) / parseFloat(tot)) * 100) : "");
    const badgeClass = grade ? getGradeBadgeClass(grade) : "";

    tr.innerHTML = `
      <td style="vertical-align: middle;">
        <input type="text" class="form-control gen-sub-name" placeholder="e.g. Mathematics - I" value="${escapeHtml(sub.name)}" required>
      </td>
      <td style="vertical-align: middle; text-align: center;">
        <input type="number" class="form-control gen-sub-credits" min="0.5" max="20" step="0.5" value="${sub.credits || ""}" placeholder="e.g. 4" style="text-align: center; max-width: 80px; margin: 0 auto; font-weight: 600;" oninput="updateGeneralLiveCredits()">
      </td>
      <td style="vertical-align: middle; text-align: center;">
        <input type="number" class="form-control gen-sub-obtained" min="0" step="any" placeholder="e.g. 75" value="${obt}" style="text-align: center; max-width: 85px; margin: 0 auto; font-weight: 600;" oninput="onGeneralMarksInput(this)">
      </td>
      <td style="vertical-align: middle; text-align: center;">
        <input type="number" class="form-control gen-sub-total" min="1" step="any" placeholder="e.g. 100" value="${tot}" style="text-align: center; max-width: 80px; margin: 0 auto; font-weight: 600;" oninput="onGeneralMarksInput(this)">
      </td>
      <td style="vertical-align: middle; text-align: center;">
        <span class="badge gen-grade-badge ${badgeClass}" style="font-size: 0.95rem; font-weight: 700; padding: 0.35rem 0.65rem; min-width: 42px; display: inline-block; ${!grade ? 'background: var(--bg-secondary); color: var(--text-muted); border: 1px solid var(--border-color);' : ''}">${grade || '-'}</span>
        <input type="hidden" class="gen-sub-grade" value="${grade}">
      </td>
      <td style="vertical-align: middle; text-align: center;">
        <button type="button" class="btn btn-danger-outline btn-sm" onclick="removeGeneralSubjectRow(this)" title="Remove Subject" style="padding: 0.25rem 0.55rem; font-size: 1rem; line-height: 1;">&times;</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updateGeneralLiveCredits();
}

function addGeneralSubjectRow() {
  const tbody = document.getElementById("generalSubjectsBody");
  if (!tbody) return;

  // Remove the empty-state placeholder row if present
  const hint = document.getElementById("generalEmptyRowHint");
  if (hint) hint.remove();

  const tr = document.createElement("tr");
  tr.className = "general-sub-row";
  tr.innerHTML = `
    <td style="vertical-align: middle;">
      <input type="text" class="form-control gen-sub-name" placeholder="e.g. Mathematics - I" value="" required>
    </td>
    <td style="vertical-align: middle; text-align: center;">
      <input type="number" class="form-control gen-sub-credits" min="0.5" max="20" step="0.5" value="" placeholder="e.g. 4" style="text-align: center; max-width: 80px; margin: 0 auto; font-weight: 600;" oninput="updateGeneralLiveCredits()">
    </td>
    <td style="vertical-align: middle; text-align: center;">
      <input type="number" class="form-control gen-sub-obtained" min="0" step="any" placeholder="e.g. 75" value="" style="text-align: center; max-width: 85px; margin: 0 auto; font-weight: 600;" oninput="onGeneralMarksInput(this)">
    </td>
    <td style="vertical-align: middle; text-align: center;">
      <input type="number" class="form-control gen-sub-total" min="1" step="any" placeholder="e.g. 100" value="" style="text-align: center; max-width: 80px; margin: 0 auto; font-weight: 600;" oninput="onGeneralMarksInput(this)">
    </td>
    <td style="vertical-align: middle; text-align: center;">
      <span class="badge gen-grade-badge" style="font-size: 0.95rem; font-weight: 700; padding: 0.35rem 0.65rem; min-width: 42px; display: inline-block; background: var(--bg-secondary); color: var(--text-muted); border: 1px solid var(--border-color);">-</span>
      <input type="hidden" class="gen-sub-grade" value="">
    </td>
    <td style="vertical-align: middle; text-align: center;">
      <button type="button" class="btn btn-danger-outline btn-sm" onclick="removeGeneralSubjectRow(this)" title="Remove Subject" style="padding: 0.25rem 0.55rem; font-size: 1rem; line-height: 1;">&times;</button>
    </td>
  `;
  tbody.appendChild(tr);
  updateGeneralLiveCredits();
}

function onGeneralMarksInput(inputEl) {
  const row = inputEl.closest("tr");
  const obtainedInput = row.querySelector(".gen-sub-obtained");
  const totalInput = row.querySelector(".gen-sub-total");
  const badge = row.querySelector(".gen-grade-badge");
  const hiddenGrade = row.querySelector(".gen-sub-grade");

  const obtVal = obtainedInput.value.trim();
  const totVal = totalInput.value.trim();

  if (obtVal === "" || totVal === "") {
    obtainedInput.classList.remove("is-invalid");
    totalInput.classList.remove("is-invalid");
    badge.className = "badge gen-grade-badge";
    badge.textContent = "-";
    badge.style.background = "var(--bg-secondary)";
    badge.style.color = "var(--text-muted)";
    badge.style.border = "1px solid var(--border-color)";
    hiddenGrade.value = "";
    return;
  }

  const obt = parseFloat(obtVal);
  const tot = parseFloat(totVal);

  if (isNaN(obt) || isNaN(tot) || obt < 0 || tot <= 0 || obt > tot) {
    if (isNaN(obt) || obt < 0 || (tot > 0 && obt > tot)) obtainedInput.classList.add("is-invalid");
    if (isNaN(tot) || tot <= 0) totalInput.classList.add("is-invalid");
    badge.className = "badge gen-grade-badge";
    badge.textContent = "-";
    badge.style.background = "var(--bg-secondary)";
    badge.style.color = "var(--text-muted)";
    badge.style.border = "1px solid var(--border-color)";
    hiddenGrade.value = "";
  } else {
    obtainedInput.classList.remove("is-invalid");
    totalInput.classList.remove("is-invalid");
    const pct = (obt / tot) * 100;
    const grade = getGradeFromPercentage(pct);
    hiddenGrade.value = grade;
    badge.textContent = grade;
    badge.className = `badge gen-grade-badge ${getGradeBadgeClass(grade)}`;
    badge.style.background = "";
    badge.style.color = "";
    badge.style.border = "none";
  }
}

function removeGeneralSubjectRow(btn) {
  const tbody = document.getElementById("generalSubjectsBody");
  btn.closest("tr").remove();

  // If no real subject rows left, show the empty-state hint
  const realRows = tbody.querySelectorAll("tr.general-sub-row");
  if (realRows.length === 0) {
    const placeholderRow = document.createElement("tr");
    placeholderRow.id = "generalEmptyRowHint";
    placeholderRow.innerHTML = `
      <td colspan="6" style="text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
        <div style="font-size: 2rem; margin-bottom: 0.4rem;">📝</div>
        <div style="font-size: 0.92rem;">No subjects added yet. Click <strong>+ Add Subject Row</strong> to start entering your subjects.</div>
      </td>
    `;
    tbody.appendChild(placeholderRow);
  }
  updateGeneralLiveCredits();
}

function updateGeneralLiveCredits() {
  const rows = document.querySelectorAll("#generalSubjectsBody tr.general-sub-row");
  let totalCredits = 0;
  rows.forEach(r => {
    const cred = parseFloat(r.querySelector(".gen-sub-credits").value) || 0;
    totalCredits += cred;
  });
  const badge = document.getElementById("generalLiveCreditsBadge");
  if (badge) {
    badge.textContent = `${rows.length} ${rows.length === 1 ? 'Course' : 'Courses'} • ${totalCredits.toFixed(1)} Credits`;
  }
}

/**
 * Calculate SGPA for current general semester
 */
function calculateGeneralSemesterSgpa() {
  const rows = document.querySelectorAll("#generalSubjectsBody tr.general-sub-row");
  const errBox = document.getElementById("generalErrorBox");
  const errMsg = document.getElementById("generalErrorMessage");

  if (errBox) errBox.style.display = "none";

  if (rows.length === 0) {
    if (errMsg) errMsg.textContent = "Please add at least one subject.";
    if (errBox) errBox.style.display = "block";
    return;
  }

  let totalCredits = 0;
  let totalPoints = 0;
  const subjects = [];
  let hasError = false;

  rows.forEach(r => {
    const nameInput = r.querySelector(".gen-sub-name");
    const credInput = r.querySelector(".gen-sub-credits");
    const obtInput = r.querySelector(".gen-sub-obtained");
    const totInput = r.querySelector(".gen-sub-total");
    const gradeInput = r.querySelector(".gen-sub-grade");

    const name = nameInput.value.trim() || "Subject";
    const credits = parseFloat(credInput.value);
    const obtVal = obtInput.value.trim();
    const totVal = totInput.value.trim();
    const obtained = obtVal !== "" ? parseFloat(obtVal) : null;
    const totalMarks = totVal !== "" ? parseFloat(totVal) : 100;
    const grade = (gradeInput.value || "").trim().toUpperCase();

    if (isNaN(credits) || credits <= 0) {
      credInput.classList.add("is-invalid");
      hasError = true;
    } else {
      credInput.classList.remove("is-invalid");
    }

    if (obtained === null || isNaN(obtained) || obtained < 0 || isNaN(totalMarks) || totalMarks <= 0 || obtained > totalMarks || !grade) {
      if (obtained === null || isNaN(obtained) || obtained < 0 || (totalMarks > 0 && obtained > totalMarks)) {
        obtInput.classList.add("is-invalid");
      }
      if (isNaN(totalMarks) || totalMarks <= 0) {
        totInput.classList.add("is-invalid");
      }
      hasError = true;
    } else {
      obtInput.classList.remove("is-invalid");
      totInput.classList.remove("is-invalid");
    }

    const gp = GRADE_POINTS[grade] !== undefined ? GRADE_POINTS[grade] : 0;
    totalCredits += credits;
    totalPoints += (credits * gp);
    subjects.push({
      name,
      credits,
      obtained_marks: obtained,
      total_marks: totalMarks,
      grade,
      grade_point: gp,
      earned_points: credits * gp
    });
  });

  if (hasError) {
    if (errMsg) errMsg.textContent = "Please ensure all credits, obtained marks, and total marks are filled correctly.";
    if (errBox) errBox.style.display = "block";
    return;
  }

  const sgpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0.0;
  const pct = Math.min(100, sgpa * 9.5);

  let division = "Pass Class";
  if (sgpa >= 7.75) division = "First Class with Distinction";
  else if (sgpa >= 6.75) division = "First Class";
  else if (sgpa >= 5.75) division = "Higher Second Class";
  else if (sgpa >= 5.00) division = "Second Class";
  else if (sgpa < 4.00) division = "Failed / Needs Improvement";

  // Update general sem in array
  generalSemesters[activeGeneralSemIndex].credits = totalCredits;
  generalSemesters[activeGeneralSemIndex].sgpa = sgpa;
  generalSemesters[activeGeneralSemIndex].subjects = subjects;
  generalSemesters[activeGeneralSemIndex].total_points = totalPoints;

  // Update current result box
  document.getElementById("generalEmptyState").style.display = "none";
  const resultBox = document.getElementById("generalSemResultBox");
  resultBox.style.display = "block";

  document.getElementById("generalResultSemName").textContent = generalSemesters[activeGeneralSemIndex].name;
  document.getElementById("generalResultSgpaDisplay").textContent = sgpa.toFixed(2);
  document.getElementById("generalResultDivision").textContent = division;
  document.getElementById("generalResultCreditsDisplay").textContent = totalCredits.toFixed(1);
  document.getElementById("generalResultPointsDisplay").textContent = totalPoints.toFixed(1);
  document.getElementById("generalResultPctDisplay").textContent = `${pct.toFixed(2)}%`;

  renderGeneralSemesterPills();
  updateGeneralOverallSummary();
}

/**
 * Update added semesters summary table and calculate cumulative CGPA
 */
function updateGeneralOverallSummary() {
  const tbody = document.getElementById("generalSummaryTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  let overallPoints = 0;
  let overallCredits = 0;

  generalSemesters.forEach((sem, idx) => {
    overallCredits += sem.credits;
    overallPoints += (sem.credits * sem.sgpa);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${escapeHtml(sem.name)}</strong></td>
      <td style="text-align: center;">${sem.credits.toFixed(1)}</td>
      <td style="text-align: center;">
        <span class="badge ${sem.sgpa >= 8.5 ? 'badge-O' : (sem.sgpa >= 7.5 ? 'badge-A-plus' : 'badge-B-plus')}" style="font-weight: 800;">
          ${sem.sgpa.toFixed(2)}
        </span>
      </td>
      <td style="text-align: center;">${(sem.credits * sem.sgpa).toFixed(1)}</td>
      <td style="text-align: center;">
        <button type="button" class="btn btn-secondary btn-sm" onclick="switchGeneralSemester(${idx})">&#9998; View</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const cumulativeCgpa = overallCredits > 0 ? parseFloat((overallPoints / overallCredits).toFixed(2)) : 0.0;
  const overallPct = Math.min(100, cumulativeCgpa * 9.5);

  const cgpaEl = document.getElementById("generalCumulativeCgpaDisplay");
  if (cgpaEl) cgpaEl.textContent = cumulativeCgpa.toFixed(2);

  const credEl = document.getElementById("generalTotalCreditsDisplay");
  if (credEl) credEl.textContent = overallCredits.toFixed(1);

  const pctEl = document.getElementById("generalTotalPctDisplay");
  if (pctEl) pctEl.textContent = `${overallPct.toFixed(2)}%`;
}

/**
 * Save all general semesters to database tracker
 */
async function saveAllGeneralSemestersToTracker() {
  const payload = {
    semesters: generalSemesters.map(s => ({
      semester_no: s.semNo,
      semester_name: s.name,
      credits: s.credits,
      sgpa: s.sgpa,
      subjects: s.subjects
    }))
  };

  const feedback = document.getElementById("generalSaveFeedback");

  try {
    const res = await fetch("/api/save-cgpa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      if (res.status === 401) {
        alert("Please log in to your account first to save to tracker.");
        window.location.href = "/login?next=calculator_view";
        return;
      }
      throw new Error(data.error || "Failed to save");
    }

    if (feedback) {
      feedback.style.display = "block";
      feedback.className = "alert alert-success";
      feedback.innerHTML = `&#10004; ${data.message} <a href="/tracker" style="text-decoration: underline; margin-left: 6px;">Go to Tracker &rarr;</a>`;
    }
  } catch (err) {
    if (feedback) {
      feedback.style.display = "block";
      feedback.className = "alert alert-danger";
      feedback.textContent = `Error: ${err.message}`;
    } else {
      alert("Error: " + err.message);
    }
  }
}

function resetGeneralCalculator() {
  if (!confirm("Are you sure you want to reset all general semesters?")) return;
  generalSemesters = [
    {
      semNo: 1,
      name: "Semester 1",
      credits: 0,
      sgpa: 0,
      subjects: []
    }
  ];
  activeGeneralSemIndex = 0;
  initGeneralTab();
  const resultBox = document.getElementById("generalSemResultBox");
  if (resultBox) resultBox.style.display = "none";
  document.getElementById("generalEmptyState").style.display = "block";
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
