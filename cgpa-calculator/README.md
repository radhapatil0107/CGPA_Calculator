# Student Grade Calculator & CGPA Tracker
**College Mini Project**  
*Department of Computer Science & Engineering (Data Science)*  
*Second Year B.Tech (SY) &bull; D.Y. Patil College of Engineering & Technology, Kolhapur*

---

## 📌 Project Overview
The **Student Grade Calculator** is a full-featured web application engineered specifically for engineering students to calculate their **Semester Grade Point Average (SGPA)** and **Cumulative Grade Point Average (CGPA)** within a minute. 

Built in alignment with autonomous university and Shivaji University 10-point credit grading rules, it features student profile management, real-time client-side validation, progress tracking with dynamic Chart.js visualization, target CGPA goal planning, and printable official marksheets.

---

## 🛠️ Tech Stack (Strict Requirements)
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (Zero external JS/UI frameworks, pure ES6+)
- **Backend:** Python + Flask
- **Database:** SQLite (managed via Flask-SQLAlchemy ORM)
- **Visualizations:** Chart.js (CDN) for semester progression line charts
- **Security:** Werkzeug password hashing, session management

---

## 📁 Project Structure
```text
cgpa-calculator/
├── backend/
│   ├── app.py              # Flask web server, auth, database models & REST APIs
│   ├── calculator.py       # Pure calculation functions (SGPA, CGPA, Target, Percentage)
│   ├── grades.py           # 10-Point Grade scale configuration (O to F) & descriptions
│   ├── test_calculator.py  # Automated unit tests for calculation logic
│   └── requirements.txt    # Python dependency declarations
├── frontend/
│   ├── templates/          # Jinja templates for the web pages
│   └── static/
│       ├── css/            # Stylesheets
│       └── js/             # Frontend JavaScript
├── instance/
│   └── grade_calculator.db # SQLite database
└── README.md               # Documentation and execution instructions
```

---

## 🚀 How to Run the Website

### Step 1: Clone or Open Project Directory
```powershell
cd "c:\Users\RADHIKA\OneDrive\Desktop\Student Grade Calculation\cgpa-calculator\backend"
```

### Step 2: Install Dependencies
```powershell
python -m pip install -r requirements.txt
```

### Step 3: Run the Application
```powershell
python app.py
```

### Step 4: Open in Web Browser
Open your browser and visit:
```
http://127.0.0.1:5000
```

> **💡 Quick Demo Login:**  
> A pre-seeded student account is available out of the box:  
> - **Username:** `student`  
> - **Password:** `student123`  
> You can also click the **"⚡ Auto-fill Demo Account"** button on the login screen to sign in instantly!

---

## 🧪 Running Unit Tests
All calculation pure functions in `calculator.py` are covered by automated unit tests:
```powershell
python -m unittest test_calculator.py
```
*Result:* 13 passing test cases verifying sample inputs, edge cases, zero division handling, and target boundaries.

---

## 🌟 Key Features

1. **User Authentication & Profiles:**
   - Password hashing with Werkzeug.
   - Stores Student Name, Roll Number, PRN, Branch, Year, and College Name.
   
2. **Interactive SGPA Calculator:**
   - Add/remove course rows dynamically.
   - Credits validation (1 to 6 credits), letter grade selector (`O`, `A+`, `A`, `B+`, `B`, `C`, `P`, `F`).
   - One-click presets for **SY B.Tech CSE Data Science** (Semester 3 and Semester 4).
   - Instant calculation with detailed grade breakdown card.
   - One-click **"Save to CGPA Tracker"**.

3. **CGPA Tracker & Analytics:**
   - Calculates overall credit-weighted CGPA: $\text{CGPA} = \frac{\sum (\text{SGPA} \times \text{Credits})}{\sum \text{Credits}}$.
   - Smooth Chart.js line graph showing SGPA trends over time.
   - Add, edit, or delete semester entries.

4. **Target CGPA Planner:**
   - Computes required average SGPA in remaining semesters to achieve a target CGPA.
   - Intelligently flags unreachable goals ($\text{SGPA} > 10.0$) or goals already secured.

5. **Grade Scale & Live Converter:**
   - Complete 10-point scale table.
   - Live interactive CGPA-to-Percentage converter with editable multiplier (default 9.5).

6. **Official Print & PDF Export:**
   - Clean `@media print` layout hiding navigation and buttons.
   - Formatted with official college header, student credentials, and signature blocks.

7. **Dark / Light Mode:**
   - Persistent theme toggle saved in `localStorage`.

---

## 📸 Screenshots Section

### 1. Dashboard & Student Overview
*Clean header with D.Y. Patil College of Engineering & Technology, Kolhapur branding, cumulative CGPA metric, and quick action cards.*

### 2. SGPA Calculator
*Dynamic subject table with inline credit validation, presets for Second Year CSE Data Science, and instant result badge.*

### 3. CGPA Tracker & Progression Chart
*Interactive Chart.js line graph displaying semester-wise SGPA trajectory alongside running cumulative CGPA.*

### 4. Target Planner
*Strategic planning calculator showing required SGPA to attain desired placement or distinction milestones.*

### 5. Printable Grade Sheet / Transcript
*Formal marksheet layout ready for printing or exporting as PDF.*

---

## 🎓 Academic Context
- **Institution:** D.Y. Patil College of Engineering & Technology, Kolhapur
- **Department:** Computer Science & Engineering (Data Science)
- **Class:** Second Year B.Tech (SY)
- **Standard:** AICTE / Autonomous University 10-Point Credit System
