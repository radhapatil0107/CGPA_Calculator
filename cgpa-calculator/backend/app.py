"""
Student Grade Calculator - Flask Backend
College Mini Project: Second Year B.Tech CSE (Data Science)
D.Y. Patil College of Engineering & Technology, Kolhapur
"""

import os
import json
import re
from datetime import datetime
from functools import wraps

from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    session,
    redirect,
    url_for,
    flash
)
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

from grades import GRADE_SCALE, GRADE_POINTS, get_all_grades, is_valid_grade
from calculator import (
    calculate_sgpa,
    calculate_cgpa,
    calculate_year_result,
    calculate_target_sgpa,
    calculate_percentage,
    get_performance_class
)
from syllabus import SYLLABUS, get_all_syllabus, get_semester_info

# Application initialization
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
templates_path = os.path.join(project_root, "frontend", "templates")
static_path = os.path.join(project_root, "frontend", "static")
# Handle read-only filesystem environments (e.g. Vercel Serverless)
is_vercel = bool(os.environ.get("VERCEL"))
if is_vercel:
    instance_path = "/tmp"
    database_url = os.environ.get("DATABASE_URL", "sqlite:////tmp/grade_calculator.db")
else:
    instance_path = os.path.join(project_root, "instance")
    try:
        os.makedirs(instance_path, exist_ok=True)
    except OSError:
        instance_path = "/tmp"
    database_url = os.environ.get("DATABASE_URL", "sqlite:///grade_calculator.db")

app = Flask(
    __name__,
    instance_path=instance_path,
    template_folder=templates_path,
    static_folder=static_path,
)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dypcet-cse-ds-grade-calc-secret-2026")

# Database URI with PostgreSQL compatibility (e.g., for cloud deployment)
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# -----------------------------------------------------------------------------
# Database Models
# -----------------------------------------------------------------------------
class User(db.Model):
    """User account model with password hashing."""
    __tablename__ = "users"
    
    id = db.Column(db.Integer, primary_key=True)
    unique_id = db.Column(db.String(50), unique=True, nullable=True, index=True)
    email = db.Column(db.String(120), unique=True, nullable=True, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    profile = db.relationship("StudentProfile", backref="user", uselist=False, cascade="all, delete-orphan")
    semesters = db.relationship("Semester", backref="user", cascade="all, delete-orphan", order_by="Semester.semester_no")

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


class StudentProfile(db.Model):
    """Academic and personal details for the student."""
    __tablename__ = "student_profiles"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    name = db.Column(db.String(120), default="Student")
    roll_no = db.Column(db.String(40), default="DS-201")
    prn = db.Column(db.String(40), default="202401234567")
    branch = db.Column(db.String(150), default="B.Tech Computer Science & Engineering (Data Science)")
    year = db.Column(db.String(80), default="Second Year (SY)")
    college = db.Column(db.String(200), default="D.Y. Patil College of Engineering & Technology, Kolhapur")
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "name": self.name,
            "roll_no": self.roll_no,
            "prn": self.prn,
            "branch": self.branch,
            "year": self.year,
            "college": self.college
        }


class Semester(db.Model):
    """Saved semester records for CGPA tracking."""
    __tablename__ = "semesters"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    semester_no = db.Column(db.Integer, nullable=False)
    semester_name = db.Column(db.String(80), default="")
    credits = db.Column(db.Float, nullable=False)
    sgpa = db.Column(db.Float, nullable=False)
    grade_points = db.Column(db.Float, nullable=False)
    subjects_json = db.Column(db.Text, nullable=True)  # JSON-encoded list of subjects
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        subjects = []
        if self.subjects_json:
            try:
                subjects = json.loads(self.subjects_json)
            except Exception:
                subjects = []
        return {
            "id": self.id,
            "semester_no": self.semester_no,
            "semester_name": self.semester_name or f"Semester {self.semester_no}",
            "credits": self.credits,
            "sgpa": self.sgpa,
            "grade_points": self.grade_points,
            "subjects": subjects,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M")
        }


# -----------------------------------------------------------------------------
# Auth Helper Decorators & Context
# -----------------------------------------------------------------------------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            flash("Please log in to access this feature.", "warning")
            return redirect(url_for("login_view", next=request.endpoint))
        return f(*args, **kwargs)
    return decorated_function


def get_current_user():
    if "user_id" in session:
        return db.session.get(User, session["user_id"])
    return None


@app.context_processor
def inject_global_data():
    """Inject current user, profile, and active page into all Jinja templates."""
    user = get_current_user()
    profile = user.profile if user else None
    return {
        "current_user": user,
        "current_profile": profile,
        "now": datetime.utcnow()
    }


# -----------------------------------------------------------------------------
# Web Page Routes
# -----------------------------------------------------------------------------
@app.route("/")
def index():
    """Dashboard homepage."""
    user = get_current_user()
    semesters = []
    cgpa_data = {"cgpa": 0.0, "total_credits": 0.0, "total_points": 0.0, "semester_count": 0}
    percentage = 0.0
    performance_class = "N/A"
    
    if user:
        semesters = Semester.query.filter_by(user_id=user.id).order_by(Semester.semester_no).all()
        sem_list = [{"credits": s.credits, "sgpa": s.sgpa, "semester_no": s.semester_no} for s in semesters]
        cgpa_data = calculate_cgpa(sem_list)
        if cgpa_data["cgpa"] > 0:
            percentage = calculate_percentage(cgpa_data["cgpa"], 9.5)
            performance_class = get_performance_class(cgpa_data["cgpa"])

    return render_template(
        "index.html",
        active_page="index",
        semesters=semesters,
        cgpa_data=cgpa_data,
        percentage=percentage,
        performance_class=performance_class
    )


@app.route("/login", methods=["GET", "POST"])
def login_view():
    """User authentication: Sign In via Email, Registration with Unique ID & Profile."""
    if "user_id" in session:
        return redirect(url_for("index"))
        
    if request.method == "POST":
        action = request.form.get("action", "login")
        password = request.form.get("password", "")
        
        if not password:
            flash("Please provide your password.", "danger")
            return render_template("login.html", active_page="login", auth_mode=action)
            
        if action == "register":
            name = request.form.get("name", "").strip()
            email = request.form.get("email", "").strip().lower()
            branch = request.form.get("branch", "").strip()

            if not name:
                flash("Full Name is required.", "danger")
                return render_template("login.html", active_page="login", auth_mode="register")

            if not email:
                flash("Email ID is required.", "danger")
                return render_template("login.html", active_page="login", auth_mode="register")

            if not branch:
                flash("Branch & Degree is required.", "danger")
                return render_template("login.html", active_page="login", auth_mode="register")

            confirm_password = request.form.get("confirm_password", "")
            if confirm_password and confirm_password != password:
                flash("Passwords do not match. Please try again.", "danger")
                return render_template("login.html", active_page="login", auth_mode="register")

            # Check for existing email
            if User.query.filter(db.func.lower(User.email) == email).first():
                flash(f"Email '{email}' is already registered. Please sign in or use a different email.", "warning")
                return render_template("login.html", active_page="login", auth_mode="register")

            # Auto-generate a clean, unique internal username from email or name
            base_username = re.sub(r'[^a-zA-Z0-9_]', '_', email.split("@")[0])[:50] or "student"
            username = base_username
            counter = 1
            while User.query.filter_by(username=username).first():
                username = f"{base_username}_{counter}"
                counter += 1

            new_user = User(username=username, email=email, unique_id=None)
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.flush()

            profile = StudentProfile(
                user_id=new_user.id,
                name=name,
                roll_no="",
                prn="",
                branch=branch,
                year="Second Year (SY)",
                college="D.Y. Patil College of Engineering & Technology, Kolhapur"
            )
            db.session.add(profile)
            db.session.commit()

            session["user_id"] = new_user.id
            session["username"] = new_user.username
            flash(f"Welcome, {name}! Your account has been registered successfully.", "success")
            return redirect(url_for("index"))

        else:  # Login
            login_id = request.form.get("email", "").strip()
            if not login_id:
                flash("Please enter your Email ID.", "danger")
                return render_template("login.html", active_page="login")

            # Flexible lookup: matches email, username, or student profile name (case-insensitive)
            user = User.query.filter(
                (db.func.lower(User.email) == login_id.lower()) |
                (db.func.lower(User.username) == login_id.lower())
            ).first()

            if not user:
                # Also check matching by student's display name
                prof = StudentProfile.query.filter(db.func.lower(StudentProfile.name) == login_id.lower()).first()
                if not prof and " " in login_id:
                    query = StudentProfile.query
                    for part in login_id.lower().split():
                        query = query.filter(db.func.lower(StudentProfile.name).contains(part))
                    prof = query.first()
                if prof and prof.user:
                    user = prof.user

            if user and user.check_password(password):
                session["user_id"] = user.id
                session["username"] = user.username
                flash(f"Welcome back, {user.profile.name if user.profile else user.username}!", "success")
                next_page = request.args.get("next")
                if next_page and next_page in ["calculator_view", "tracker_view", "achievements_view", "student_info_view"]:
                    return redirect(url_for(next_page))
                return redirect(url_for("index"))
            else:
                flash("Invalid Email ID or password.", "danger")
                return render_template("login.html", active_page="login")

    return render_template("login.html", active_page="login")


@app.route("/api/resolve-email", methods=["GET"])
def api_resolve_email():
    """Look up a student's registered email address by name or username for autofill resolution."""
    identifier = request.args.get("identifier", "").strip()
    if not identifier:
        return jsonify({"found": False, "email": ""})
    
    if "@" in identifier:
        return jsonify({"found": True, "email": identifier})
        
    user = User.query.filter(
        (db.func.lower(User.email) == identifier.lower()) |
        (db.func.lower(User.username) == identifier.lower())
    ).first()
    
    if not user:
        prof = StudentProfile.query.filter(db.func.lower(StudentProfile.name) == identifier.lower()).first()
        if not prof and " " in identifier:
            query = StudentProfile.query
            for part in identifier.lower().split():
                query = query.filter(db.func.lower(StudentProfile.name).contains(part))
            prof = query.first()
        if prof and prof.user:
            user = prof.user
            
    if user and user.email:
        return jsonify({"found": True, "email": user.email})
        
    return jsonify({"found": False, "email": identifier})


@app.route("/logout")
def logout_view():
    """Clear session and log out."""
    session.clear()
    flash("You have been successfully logged out.", "info")
    return redirect(url_for("login_view"))


@app.route("/student-info", methods=["GET", "POST"])
@login_required
def student_info_view():
    """View and update student personal/academic information."""
    user = get_current_user()
    profile = user.profile
    if not profile:
        profile = StudentProfile(user_id=user.id)
        db.session.add(profile)
        db.session.commit()
        
    if request.method == "POST":
        profile.name = request.form.get("name", "").strip() or profile.name
        profile.roll_no = request.form.get("roll_no", "").strip()
        profile.branch = request.form.get("branch", "").strip() or profile.branch
        profile.year = request.form.get("year", "").strip() or profile.year
        profile.college = request.form.get("college", "").strip() or profile.college
        
        db.session.commit()
        flash("Student profile updated successfully!", "success")
        return redirect(url_for("student_info_view"))
        
    return render_template("student_info.html", active_page="student_info", profile=profile)


@app.route("/calculator")
def calculator_view():
    """Interactive SGPA & CGPA Calculator page."""
    user = get_current_user()
    return render_template(
        "calculator.html",
        active_page="calculator",
        grades=GRADE_SCALE,
        syllabus=SYLLABUS
    )


@app.route("/tracker")
def tracker_view():
    """CGPA Tracker & Semester History page."""
    user = get_current_user()
    semesters = []
    cgpa_data = {"cgpa": 0.0, "total_credits": 0.0, "total_points": 0.0, "semester_count": 0}
    percentage = 0.0
    
    if user:
        semesters = Semester.query.filter_by(user_id=user.id).order_by(Semester.semester_no).all()
        sem_list = [{"credits": s.credits, "sgpa": s.sgpa, "semester_no": s.semester_no} for s in semesters]
        cgpa_data = calculate_cgpa(sem_list)
        if cgpa_data["cgpa"] > 0:
            percentage = calculate_percentage(cgpa_data["cgpa"], 9.5)
            
    return render_template(
        "tracker.html",
        active_page="tracker",
        semesters=semesters,
        cgpa_data=cgpa_data,
        percentage=percentage
    )


@app.route("/target")
def target_view():
    """Target CGPA Planning page."""
    user = get_current_user()
    tracker_cgpa = 0.0
    tracker_credits = 0.0
    
    if user:
        semesters = Semester.query.filter_by(user_id=user.id).all()
        if semesters:
            sem_list = [{"credits": s.credits, "sgpa": s.sgpa} for s in semesters]
            res = calculate_cgpa(sem_list)
            tracker_cgpa = res["cgpa"]
            tracker_credits = res["total_credits"]
            
    return render_template(
        "target.html",
        active_page="target",
        tracker_cgpa=tracker_cgpa,
        tracker_credits=tracker_credits
    )


@app.route("/achievements")
def achievements_view():
    """Achievements leaderboard page showing CGPAs of all users in descending order."""
    users = User.query.all()
    leaderboard = []

    for u in users:
        sems = Semester.query.filter_by(user_id=u.id).order_by(Semester.semester_no).all()
        if sems:
            sem_list = [{"credits": s.credits, "sgpa": s.sgpa, "semester_no": s.semester_no} for s in sems]
            cgpa_res = calculate_cgpa(sem_list)
            cgpa_val = cgpa_res.get("cgpa", 0.0)
            total_credits = cgpa_res.get("total_credits", 0.0)
            total_semesters = len(sems)
        else:
            cgpa_val = 0.0
            total_credits = 0.0
            total_semesters = 0

        prof = u.profile
        student_name = prof.name if (prof and prof.name) else u.username
        roll_no = prof.roll_no if (prof and prof.roll_no) else "-"
        branch = prof.branch if (prof and prof.branch) else "CSE (Data Science)"

        percentage_val = calculate_percentage(cgpa_val, 9.5) if cgpa_val > 0 else 0.0
        perf_class = get_performance_class(cgpa_val) if cgpa_val > 0 else "N/A"

        leaderboard.append({
            "user_id": u.id,
            "unique_id": u.unique_id or "-",
            "username": u.username,
            "name": student_name,
            "roll_no": roll_no,
            "branch": branch,
            "cgpa": cgpa_val,
            "total_credits": total_credits,
            "semesters_count": total_semesters,
            "percentage": percentage_val,
            "performance_class": perf_class
        })

    # Sort descending by CGPA, then by total_credits descending
    leaderboard.sort(key=lambda x: (x["cgpa"], x["total_credits"]), reverse=True)

    # Assign rank with handling of ties
    rank = 1
    for idx, item in enumerate(leaderboard):
        if idx > 0:
            prev = leaderboard[idx - 1]
            if item["cgpa"] < prev["cgpa"]:
                rank = idx + 1
        item["rank"] = rank

    return render_template(
        "achievements.html",
        active_page="achievements",
        leaderboard=leaderboard
    )


@app.route("/grade-scale")
def grade_scale_view():
    """Grading Scale and Percentage conversion reference."""
    return render_template("grade_scale.html", active_page="grade_scale", grades=GRADE_SCALE)


@app.route("/report/<int:semester_id>")
@login_required
def semester_report(semester_id):
    """Printable official marksheet report for a specific saved semester."""
    user = get_current_user()
    semester = Semester.query.filter_by(id=semester_id, user_id=user.id).first_or_404()
    subjects = []
    if semester.subjects_json:
        try:
            subjects = json.loads(semester.subjects_json)
        except Exception:
            subjects = []
            
    percentage = calculate_percentage(semester.sgpa, 9.5)
    performance = get_performance_class(semester.sgpa)
    
    return render_template(
        "report.html",
        semester=semester,
        subjects=subjects,
        percentage=percentage,
        performance=performance,
        profile=user.profile,
        report_type="semester"
    )


@app.route("/report/transcript")
@login_required
def transcript_report():
    """Printable cumulative transcript report across all completed semesters."""
    user = get_current_user()
    semesters = Semester.query.filter_by(user_id=user.id).order_by(Semester.semester_no).all()
    if not semesters:
        flash("No semesters recorded yet to generate a transcript.", "warning")
        return redirect(url_for("tracker_view"))
        
    sem_list = [{"credits": s.credits, "sgpa": s.sgpa, "semester_no": s.semester_no} for s in semesters]
    cgpa_data = calculate_cgpa(sem_list)
    percentage = calculate_percentage(cgpa_data["cgpa"], 9.5)
    performance = get_performance_class(cgpa_data["cgpa"])
    
    return render_template(
        "report.html",
        semesters=semesters,
        cgpa_data=cgpa_data,
        percentage=percentage,
        performance=performance,
        profile=user.profile,
        report_type="transcript"
    )


# -----------------------------------------------------------------------------
# API Endpoints (JSON)
# -----------------------------------------------------------------------------
@app.route("/api/grades", methods=["GET"])
def api_grades():
    """Return grading scale list."""
    return jsonify({"success": True, "grades": get_all_grades()})


@app.route("/api/syllabus", methods=["GET"])
def api_syllabus():
    """Return official DYPCET B.Tech Data Science syllabus."""
    return jsonify({"success": True, "syllabus": get_all_syllabus()})


@app.route("/api/sgpa", methods=["POST"])
def api_sgpa():
    """
    Calculate SGPA for a given list of subjects.
    Request body:
        { "subjects": [ { "name": "...", "credits": 4, "grade": "A" }, ... ] }
    """
    data = request.get_json() or {}
    subjects = data.get("subjects", [])
    
    if not subjects:
        return jsonify({"success": False, "error": "No subjects provided. Add at least one subject."}), 400
        
    try:
        result = calculate_sgpa(subjects)
        return jsonify({"success": True, **result})
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": "Server calculation error: " + str(e)}), 500


@app.route("/api/cgpa", methods=["POST"])
def api_cgpa():
    """
    Calculate CGPA for a given list of semesters.
    Request body:
        { "semesters": [ { "credits": 20, "sgpa": 8.5 }, ... ] }
    """
    data = request.get_json() or {}
    semesters = data.get("semesters", [])
    
    try:
        result = calculate_cgpa(semesters)
        return jsonify({"success": True, **result})
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/year-result", methods=["POST"])
def api_year_result():
    """
    Calculate credit-weighted average for an academic year (two semesters).
    Request body:
        { "sem1_credits": 22, "sem1_sgpa": 8.5, "sem2_credits": 22, "sem2_sgpa": 9.0 }
    """
    data = request.get_json() or {}
    try:
        sem1_credits = float(data.get("sem1_credits", 0))
        sem1_sgpa = float(data.get("sem1_sgpa", 0))
        sem2_credits = float(data.get("sem2_credits", 0))
        sem2_sgpa = float(data.get("sem2_sgpa", 0))
        result = calculate_year_result(sem1_credits, sem1_sgpa, sem2_credits, sem2_sgpa)
        return jsonify({"success": True, **result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/api/save-cgpa", methods=["POST"])
def api_save_cgpa():
    """
    Save or update semesters from the multi-semester CGPA calculator
    and calculate/save overall Cumulative CGPA to the database.
    Request body:
        {
          "semesters": [
             { "semester_no": 1, "semester_name": "Semester 1 (FY)", "sgpa": 8.50, "credits": 20.0 },
             ...
          ]
        }
    """
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "error": "Authentication required. Please sign in to save your CGPA."}), 401

    data = request.get_json() or {}
    semesters_data = data.get("semesters", [])
    if not semesters_data:
        return jsonify({"success": False, "error": "No semester data provided to save."}), 400

    try:
        saved_items = []
        for idx, item in enumerate(semesters_data, start=1):
            sem_name = str(item.get("semester_name", f"Semester {idx}")).strip()
            
            # Extract number from name if possible (e.g. 'Semester 2 (FY)' -> 2)
            match = re.search(r'(?:Semester|Sem)\s*(\d+)', sem_name, re.IGNORECASE)
            if match:
                sem_no = int(match.group(1))
            else:
                sem_no = int(item.get("semester_no", idx))

            sgpa = float(item.get("sgpa", 0))
            if sgpa < 0 or sgpa > 10:
                return jsonify({"success": False, "error": f"Invalid SGPA ({sgpa}) for {sem_name}. Must be between 0.0 and 10.0."}), 400

            credits = float(item.get("credits", 20.0))
            if credits <= 0:
                credits = 20.0

            grade_points = round(credits * sgpa, 2)

            existing = Semester.query.filter_by(user_id=user.id, semester_no=sem_no).first()
            if existing:
                existing.semester_name = sem_name
                existing.sgpa = sgpa
                existing.credits = credits
                existing.grade_points = grade_points
                saved_items.append(existing)
            else:
                new_sem = Semester(
                    user_id=user.id,
                    semester_no=sem_no,
                    semester_name=sem_name,
                    credits=credits,
                    sgpa=sgpa,
                    grade_points=grade_points
                )
                db.session.add(new_sem)
                saved_items.append(new_sem)

        db.session.commit()

        # Recalculate full cumulative CGPA from all saved semesters for this user
        all_sems = Semester.query.filter_by(user_id=user.id).order_by(Semester.semester_no).all()
        sem_list = [{"credits": s.credits, "sgpa": s.sgpa, "semester_no": s.semester_no} for s in all_sems]
        cgpa_res = calculate_cgpa(sem_list)
        percentage = calculate_percentage(cgpa_res["cgpa"], 9.5) if cgpa_res["cgpa"] > 0 else 0.0

        return jsonify({
            "success": True,
            "message": f"CGPA of {cgpa_res['cgpa']:.2f} successfully saved to Cumulative CGPA!",
            "cgpa": cgpa_res["cgpa"],
            "total_credits": cgpa_res["total_credits"],
            "total_points": cgpa_res["total_points"],
            "percentage": percentage,
            "semesters": [s.to_dict() for s in all_sems]
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": f"Failed to save CGPA: {str(e)}"}), 500



@app.route("/api/target", methods=["POST"])
def api_target():
    """
    Calculate target required SGPA.
    Request body:
        {
          "current_cgpa": 7.5,
          "completed_credits": 40,
          "target_cgpa": 8.0,
          "remaining_credits": 40
        }
    """
    data = request.get_json() or {}
    try:
        current_cgpa = data.get("current_cgpa")
        completed_credits = data.get("completed_credits")
        target_cgpa = data.get("target_cgpa")
        remaining_credits = data.get("remaining_credits")
        
        result = calculate_target_sgpa(
            current_cgpa=current_cgpa,
            completed_credits=completed_credits,
            target_cgpa=target_cgpa,
            remaining_credits=remaining_credits
        )
        return jsonify({"success": True, **result})
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/semesters", methods=["GET", "POST"])
def api_semesters():
    """Retrieve saved semesters or save a new/updated semester for logged in user."""
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "error": "Authentication required. Please log in."}), 401
        
    if request.method == "GET":
        semesters = Semester.query.filter_by(user_id=user.id).order_by(Semester.semester_no).all()
        sem_list = [s.to_dict() for s in semesters]
        calc_list = [{"credits": s.credits, "sgpa": s.sgpa} for s in semesters]
        cgpa_res = calculate_cgpa(calc_list)
        return jsonify({
            "success": True,
            "semesters": sem_list,
            "cgpa": cgpa_res["cgpa"],
            "total_credits": cgpa_res["total_credits"],
            "total_points": cgpa_res["total_points"]
        })
        
    # POST - Save or update semester
    data = request.get_json() or {}
    try:
        sem_no = int(data.get("semester_no", 1))
        credits = float(data.get("credits", 0))
        sgpa = float(data.get("sgpa", 0))
        sem_name = data.get("semester_name", f"Semester {sem_no}").strip()
        subjects = data.get("subjects", [])
        
        if sem_no < 1 or sem_no > 12:
            return jsonify({"success": False, "error": "Semester number must be between 1 and 12."}), 400
        if credits <= 0:
            return jsonify({"success": False, "error": "Semester credits must be greater than zero."}), 400
        if sgpa < 0 or sgpa > 10:
            return jsonify({"success": False, "error": "SGPA must be between 0.0 and 10.0."}), 400
            
        grade_points = round(credits * sgpa, 2)
        subjects_json = json.dumps(subjects) if subjects else None
        
        # Check if semester already exists for this user
        existing = Semester.query.filter_by(user_id=user.id, semester_no=sem_no).first()
        if existing:
            existing.credits = credits
            existing.sgpa = sgpa
            existing.grade_points = grade_points
            existing.semester_name = sem_name
            if subjects_json:
                existing.subjects_json = subjects_json
            db.session.commit()
            return jsonify({
                "success": True,
                "message": f"Semester {sem_no} updated successfully in Tracker!",
                "semester": existing.to_dict()
            })
        else:
            new_sem = Semester(
                user_id=user.id,
                semester_no=sem_no,
                semester_name=sem_name,
                credits=credits,
                sgpa=sgpa,
                grade_points=grade_points,
                subjects_json=subjects_json
            )
            db.session.add(new_sem)
            db.session.commit()
            return jsonify({
                "success": True,
                "message": f"Semester {sem_no} saved successfully to Tracker!",
                "semester": new_sem.to_dict()
            }), 201
            
    except (ValueError, TypeError) as ve:
        return jsonify({"success": False, "error": f"Invalid data: {str(ve)}"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": f"Failed to save semester: {str(e)}"}), 500


@app.route("/api/semesters/<int:semester_id>", methods=["PUT", "DELETE"])
@login_required
def api_semester_detail(semester_id):
    """Edit or delete an individual semester entry."""
    user = get_current_user()
    semester = Semester.query.filter_by(id=semester_id, user_id=user.id).first()
    
    if not semester:
        return jsonify({"success": False, "error": "Semester not found."}), 404
        
    if request.method == "DELETE":
        sem_no = semester.semester_no
        db.session.delete(semester)
        db.session.commit()
        return jsonify({"success": True, "message": f"Semester {sem_no} removed from tracker."})
        
    if request.method == "PUT":
        data = request.get_json() or {}
        try:
            if "credits" in data:
                c = float(data["credits"])
                if c <= 0:
                    return jsonify({"success": False, "error": "Credits must be greater than zero."}), 400
                semester.credits = c
                
            if "sgpa" in data:
                s = float(data["sgpa"])
                if s < 0 or s > 10:
                    return jsonify({"success": False, "error": "SGPA must be between 0.0 and 10.0."}), 400
                semester.sgpa = s
                
            if "semester_no" in data:
                semester.semester_no = int(data["semester_no"])
                
            if "semester_name" in data:
                semester.semester_name = str(data["semester_name"]).strip()
                
            semester.grade_points = round(semester.credits * semester.sgpa, 2)
            db.session.commit()
            return jsonify({"success": True, "message": "Semester updated successfully.", "semester": semester.to_dict()})
        except (ValueError, TypeError) as ve:
            return jsonify({"success": False, "error": str(ve)}), 400


@app.route("/api/student-info", methods=["GET"])
def api_student_info():
    """Fetch current user profile data."""
    user = get_current_user()
    if not user or not user.profile:
        return jsonify({"success": False, "error": "Not logged in"}), 401
    return jsonify({"success": True, "profile": user.profile.to_dict()})


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
def api_delete_user(user_id):
    """Delete a user account and their records completely from achievements and database."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "error": "User record not found."}), 404

    try:
        user_name = user.profile.name if user.profile else user.username
        is_current = session.get("user_id") == user.id

        db.session.delete(user)
        db.session.commit()

        if is_current:
            session.clear()

        return jsonify({
            "success": True,
            "message": f"Student '{user_name}' has been successfully removed from Achievements.",
            "logged_out": is_current
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": f"Failed to delete user: {str(e)}"}), 500


@app.route("/api/users/<int:user_id>/clear-data", methods=["POST", "DELETE"])
def api_clear_user_data(user_id):
    """Clear all saved semester and CGPA data for a user, resetting their score to 0.00 in Achievements."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "error": "User record not found."}), 404

    try:
        user_name = user.profile.name if user.profile else user.username
        Semester.query.filter_by(user_id=user.id).delete()
        db.session.commit()

        return jsonify({
            "success": True,
            "message": f"CGPA and semester records for '{user_name}' have been cleared."
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": f"Failed to clear data: {str(e)}"}), 500



# -----------------------------------------------------------------------------
# Database Setup & Seed
# -----------------------------------------------------------------------------
def init_db():
    """Create tables if not already present."""
    with app.app_context():
        db.create_all()


# Initialize tables when starting
init_db()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() in ("true", "1")
    app.run(debug=debug, host="0.0.0.0", port=port)
