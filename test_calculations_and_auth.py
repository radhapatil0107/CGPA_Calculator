"""
Comprehensive Verification and Test Suite:
1. Calculations: SGPA, CGPA, Year Results, Target SGPA, Percentage, Performance Division
2. Authentication & Login: Registration, Login (Email/Username/Name), Security, Edge Cases
"""
import os
import sys
import unittest
import json

# Setup import path
base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(base_dir, "cgpa-calculator", "backend")
sys.path.insert(0, backend_dir)

from grades import GRADE_SCALE, GRADE_POINTS, get_grade_points, is_valid_grade
from calculator import (
    calculate_sgpa,
    calculate_cgpa,
    calculate_year_result,
    calculate_target_sgpa,
    calculate_percentage,
    get_performance_class
)
from app import app, db, User, StudentProfile, Semester


class TestCalculations(unittest.TestCase):
    """Thorough tests for all mathematical and academic calculations."""

    def test_sgpa_standard_case(self):
        """Test SGPA calculation with standard subjects and credit weights."""
        subjects = [
            {"name": "Discrete Mathematical Structures", "credits": 4, "grade": "O"},   # 4 * 10 = 40
            {"name": "Data Structures using C++", "credits": 4, "grade": "A+"},         # 4 * 9 = 36
            {"name": "Computer Organisation & Arch", "credits": 3, "grade": "A"},       # 3 * 8 = 24
            {"name": "Python Programming Lab", "credits": 2, "grade": "B+"}            # 2 * 7 = 14
        ]
        # Total credits = 13, Total points = 114
        # SGPA = 114 / 13 = 8.76923... -> 8.77
        res = calculate_sgpa(subjects)
        self.assertEqual(res["sgpa"], 8.77)
        self.assertEqual(res["total_credits"], 13.0)
        self.assertEqual(res["total_points"], 114.0)
        self.assertEqual(len(res["subjects_details"]), 4)

    def test_sgpa_all_grade_scales(self):
        """Test every single grade letter from O to F."""
        expected_points = {
            "O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "P": 4, "F": 0
        }
        for grade, pts in expected_points.items():
            self.assertTrue(is_valid_grade(grade))
            self.assertEqual(get_grade_points(grade), pts)
            sub = [{"name": "Test Subject", "credits": 4, "grade": grade}]
            res = calculate_sgpa(sub)
            self.assertEqual(res["sgpa"], float(pts))
            self.assertEqual(res["total_points"], 4.0 * pts)

    def test_sgpa_boundary_and_validation(self):
        """Test error handling in SGPA calculation."""
        # Empty list
        with self.assertRaises(ValueError):
            calculate_sgpa([])

        # Invalid grade letter
        with self.assertRaises(ValueError):
            calculate_sgpa([{"name": "Math", "credits": 4, "grade": "Z"}])

        # Negative credits
        with self.assertRaises(ValueError):
            calculate_sgpa([{"name": "Math", "credits": -2, "grade": "A"}])

        # Excessive credits (>10)
        with self.assertRaises(ValueError):
            calculate_sgpa([{"name": "Math", "credits": 15, "grade": "A"}])

    def test_cgpa_calculation(self):
        """Test multi-semester CGPA credit-weighted calculation."""
        semesters = [
            {"semester_no": 1, "credits": 20.0, "sgpa": 8.50},  # 170.0 points
            {"semester_no": 2, "credits": 22.0, "sgpa": 9.00},  # 198.0 points
            {"semester_no": 3, "credits": 20.0, "sgpa": 8.75},  # 175.0 points
            {"semester_no": 4, "credits": 22.0, "sgpa": 9.25}   # 203.5 points
        ]
        # Total credits: 84.0, Total points: 746.5
        # CGPA = 746.5 / 84.0 = 8.8869... -> 8.89
        res = calculate_cgpa(semesters)
        self.assertEqual(res["cgpa"], 8.89)
        self.assertEqual(res["total_credits"], 84.0)
        self.assertEqual(res["total_points"], 746.5)
        self.assertEqual(res["semester_count"], 4)

    def test_cgpa_empty(self):
        """Test CGPA when no semesters are provided."""
        res = calculate_cgpa([])
        self.assertEqual(res["cgpa"], 0.0)
        self.assertEqual(res["total_credits"], 0.0)
        self.assertEqual(res["semester_count"], 0)

    def test_year_result(self):
        """Test credit-weighted annual calculation."""
        # Sem 1: 20 cr, 8.5 SGPA (170 pts); Sem 2: 22 cr, 9.0 SGPA (198 pts)
        # Year SGPA = 368 / 42 = 8.7619... -> 8.76
        res = calculate_year_result(20, 8.5, 22, 9.0)
        self.assertEqual(res["year_sgpa"], 8.76)
        self.assertEqual(res["total_credits"], 42.0)
        self.assertEqual(res["percentage"], 83.22)
        self.assertEqual(res["performance_class"], "First Class with Distinction")

    def test_target_sgpa_planning(self):
        """Test required SGPA calculation."""
        # Achievable case
        res = calculate_target_sgpa(current_cgpa=8.0, completed_credits=40, target_cgpa=8.5, remaining_credits=40)
        self.assertTrue(res["reachable"])
        self.assertEqual(res["required_sgpa"], 9.0)

        # Unreachable case (> 10 required)
        res_unreach = calculate_target_sgpa(current_cgpa=6.0, completed_credits=60, target_cgpa=9.5, remaining_credits=20)
        self.assertFalse(res_unreach["reachable"])
        self.assertEqual(res_unreach["status"], "unreachable")

        # Already achieved case (even with 0 points on remaining credits, target is reached)
        res_done = calculate_target_sgpa(current_cgpa=9.0, completed_credits=80, target_cgpa=6.0, remaining_credits=20)
        self.assertTrue(res_done["reachable"])
        self.assertEqual(res_done["status"], "already_achieved")

    def test_percentage_and_division(self):
        """Test AICTE standard 9.5x percentage and academic division."""
        self.assertEqual(calculate_percentage(10.0), 95.0)
        self.assertEqual(calculate_percentage(8.0), 76.0)
        self.assertEqual(calculate_percentage(0.0), 0.0)

        self.assertEqual(get_performance_class(8.5), "First Class with Distinction")
        self.assertEqual(get_performance_class(7.0), "First Class")
        self.assertEqual(get_performance_class(6.0), "Higher Second Class")
        self.assertEqual(get_performance_class(5.2), "Second Class")
        self.assertEqual(get_performance_class(4.5), "Pass Class")
        self.assertEqual(get_performance_class(3.5), "Failed / Needs Improvement")


class TestAuthenticationAndLogin(unittest.TestCase):
    """Test user registration, login, session handling, and edge cases."""

    test_db_path = os.path.join(base_dir, "test_auth_temp.db")

    def setUp(self):
        # Configure app for testing with clean temporary file SQLite
        app.config["TESTING"] = True
        app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{self.test_db_path}"
        app.config["WTF_CSRF_ENABLED"] = False
        self.client = app.test_client()
        with app.app_context():
            db.engine.dispose()
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()
            db.engine.dispose()
        if os.path.exists(self.test_db_path):
            try:
                os.remove(self.test_db_path)
            except OSError:
                pass

    def test_user_registration_success(self):
        """Test normal user registration."""
        response = self.client.post("/login", data={
            "action": "register",
            "name": "Arjun Sharma",
            "email": "arjun.sharma@example.com",
            "branch": "B.Tech Computer Science & Engineering",
            "password": "SecurePassword123",
            "confirm_password": "SecurePassword123"
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)

        with app.app_context():
            user = User.query.filter_by(email="arjun.sharma@example.com").first()
            self.assertIsNotNone(user)
            self.assertTrue(user.check_password("SecurePassword123"))
            self.assertIsNotNone(user.profile)
            self.assertEqual(user.profile.name, "Arjun Sharma")
            self.assertEqual(user.profile.branch, "B.Tech Computer Science & Engineering")

    def test_registration_duplicate_email(self):
        """Test that registering duplicate email (even with different case) is prevented."""
        # 1st Registration
        self.client.post("/login", data={
            "action": "register",
            "name": "User One",
            "email": "testuser@gmail.com",
            "branch": "CSE",
            "password": "Pass1",
            "confirm_password": "Pass1"
        })
        self.client.get("/logout")

        # 2nd Registration with same email in uppercase
        response = self.client.post("/login", data={
            "action": "register",
            "name": "User Two",
            "email": "TESTUSER@GMAIL.COM",
            "branch": "CSE",
            "password": "Pass2",
            "confirm_password": "Pass2"
        }, follow_redirects=True)
        self.assertIn(b"already registered", response.data)

    def test_registration_password_mismatch(self):
        """Test password mismatch error during registration."""
        response = self.client.post("/login", data={
            "action": "register",
            "name": "Mismatch User",
            "email": "mismatch@example.com",
            "branch": "CSE",
            "password": "Password123",
            "confirm_password": "DifferentPassword"
        }, follow_redirects=True)
        self.assertIn(b"Passwords do not match", response.data)

    def test_login_success_and_case_insensitivity(self):
        """Test login with email (standard, uppercase, with spaces)."""
        # Register user
        self.client.post("/login", data={
            "action": "register",
            "name": "Radhika Patil",
            "email": "radhika.patil@example.com",
            "branch": "B.Tech CSE (Data Science)",
            "password": "MySecretPassword",
            "confirm_password": "MySecretPassword"
        })
        self.client.get("/logout")

        # 1. Login with exact email
        res1 = self.client.post("/login", data={
            "action": "login",
            "email": "radhika.patil@example.com",
            "password": "MySecretPassword"
        }, follow_redirects=True)
        self.assertIn(b"Welcome back", res1.data)
        self.client.get("/logout")

        # 2. Login with uppercase email
        res2 = self.client.post("/login", data={
            "action": "login",
            "email": "RADHIKA.PATIL@EXAMPLE.COM",
            "password": "MySecretPassword"
        }, follow_redirects=True)
        self.assertIn(b"Welcome back", res2.data)
        self.client.get("/logout")

        # 3. Login with leading/trailing spaces
        res3 = self.client.post("/login", data={
            "action": "login",
            "email": "  radhika.patil@example.com  ",
            "password": "MySecretPassword"
        }, follow_redirects=True)
        self.assertIn(b"Welcome back", res3.data)
        self.client.get("/logout")

        # 4. Login using Student Name
        res4 = self.client.post("/login", data={
            "action": "login",
            "email": "Radhika Patil",
            "password": "MySecretPassword"
        }, follow_redirects=True)
        self.assertIn(b"Welcome back", res4.data)

    def test_login_wrong_password_and_unknown_user(self):
        """Test authentication rejection."""
        # Register user
        self.client.post("/login", data={
            "action": "register",
            "name": "Valid User",
            "email": "valid@example.com",
            "branch": "CSE",
            "password": "CorrectPassword",
            "confirm_password": "CorrectPassword"
        })
        self.client.get("/logout")

        # Wrong password
        res_wrong_pw = self.client.post("/login", data={
            "action": "login",
            "email": "valid@example.com",
            "password": "WrongPassword"
        }, follow_redirects=True)
        self.assertIn(b"Invalid Email ID or password", res_wrong_pw.data)

        # Unknown user
        res_unknown = self.client.post("/login", data={
            "action": "login",
            "email": "doesnotexist@example.com",
            "password": "SomePassword"
        }, follow_redirects=True)
        self.assertIn(b"Invalid Email ID or password", res_unknown.data)

    def test_protected_routes(self):
        """Verify protected routes redirect anonymous users to login."""
        res_profile = self.client.get("/student-info", follow_redirects=True)
        self.assertIn(b"Please log in to access this feature", res_profile.data)

        res_report = self.client.get("/report/1", follow_redirects=True)
        self.assertIn(b"Please log in to access this feature", res_report.data)

        # Verify API requires auth
        res_api_sem = self.client.get("/api/semesters")
        self.assertEqual(res_api_sem.status_code, 401)

        res_api_save = self.client.post("/api/save-cgpa", json={"semesters": []})
        self.assertEqual(res_api_save.status_code, 401)


if __name__ == "__main__":
    unittest.main()
