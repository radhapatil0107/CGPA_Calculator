"""
Unit tests for pure calculation logic in calculator.py
"""

import unittest
from calculator import (
    calculate_sgpa,
    calculate_cgpa,
    calculate_year_result,
    calculate_target_sgpa,
    calculate_percentage,
    get_performance_class
)


class TestCalculator(unittest.TestCase):

    def test_sample_data_sgpa(self):
        """
        Test with user sample data:
        5 subjects, credits [4, 3, 3, 2, 2] with grades ['A', 'B+', 'O', 'A', 'B']
        Credits:
          - Sub 1: 4 credits, Grade A  (points = 8)  => 4 * 8 = 32
          - Sub 2: 3 credits, Grade B+ (points = 7)  => 3 * 7 = 21
          - Sub 3: 3 credits, Grade O  (points = 10) => 3 * 10 = 30
          - Sub 4: 2 credits, Grade A  (points = 8)  => 2 * 8 = 16
          - Sub 5: 2 credits, Grade B  (points = 6)  => 2 * 6 = 12
        Total credits = 4 + 3 + 3 + 2 + 2 = 14
        Total points = 32 + 21 + 30 + 16 + 12 = 111
        Expected SGPA = 111 / 14 = 7.92857... => 7.93
        """
        subjects = [
            {"name": "Data Structures", "credits": 4, "grade": "A"},
            {"name": "Applied Statistics", "credits": 3, "grade": "B+"},
            {"name": "Discrete Mathematics", "credits": 3, "grade": "O"},
            {"name": "Python Lab", "credits": 2, "grade": "A"},
            {"name": "DBMS", "credits": 2, "grade": "B"}
        ]
        result = calculate_sgpa(subjects)
        self.assertEqual(result["total_credits"], 14.0)
        self.assertEqual(result["total_points"], 111.0)
        self.assertEqual(result["sgpa"], 7.93)
        self.assertEqual(len(result["subjects_details"]), 5)

    def test_perfect_sgpa(self):
        """Test all 'O' grades yields 10.0 SGPA."""
        subjects = [
            {"name": "Course 1", "credits": 4, "grade": "O"},
            {"name": "Course 2", "credits": 3, "grade": "O"}
        ]
        res = calculate_sgpa(subjects)
        self.assertEqual(res["sgpa"], 10.0)
        self.assertEqual(res["total_credits"], 7.0)
        self.assertEqual(res["total_points"], 70.0)

    def test_failing_grade_sgpa(self):
        """Test with grade 'F' having 0 grade points."""
        subjects = [
            {"name": "Sub 1", "credits": 4, "grade": "F"},
            {"name": "Sub 2", "credits": 4, "grade": "O"}
        ]
        res = calculate_sgpa(subjects)
        # 4*0 + 4*10 = 40. Total credits = 8. SGPA = 40/8 = 5.0
        self.assertEqual(res["sgpa"], 5.0)

    def test_invalid_grade_raises_error(self):
        """Test invalid grade input raises ValueError."""
        subjects = [{"name": "Sub 1", "credits": 3, "grade": "Z"}]
        with self.assertRaises(ValueError):
            calculate_sgpa(subjects)

    def test_empty_subjects_raises_error(self):
        """Test empty subject list raises ValueError."""
        with self.assertRaises(ValueError):
            calculate_sgpa([])

    def test_negative_credits_raises_error(self):
        """Test negative credits raises ValueError."""
        subjects = [{"name": "Sub 1", "credits": -3, "grade": "A"}]
        with self.assertRaises(ValueError):
            calculate_sgpa(subjects)

    def test_calculate_cgpa_multiple_semesters(self):
        """Test CGPA calculation with multiple semesters."""
        semesters = [
            {"semester_no": 1, "credits": 20, "sgpa": 8.0},  # points = 160
            {"semester_no": 2, "credits": 20, "sgpa": 9.0},  # points = 180
            {"semester_no": 3, "credits": 14, "sgpa": 7.93}  # points = 111.02
        ]
        # Total credits = 54
        # Total points = 160 + 180 + 111.02 = 451.02
        # CGPA = 451.02 / 54 = 8.352... => 8.35
        res = calculate_cgpa(semesters)
        self.assertEqual(res["total_credits"], 54.0)
        self.assertEqual(res["cgpa"], 8.35)

    def test_calculate_cgpa_empty(self):
        """Test empty semester list returns 0.0 CGPA safely."""
        res = calculate_cgpa([])
        self.assertEqual(res["cgpa"], 0.0)
        self.assertEqual(res["total_credits"], 0.0)

    def test_target_sgpa_achievable(self):
        """
        Current CGPA: 7.5 over 40 credits.
        Target CGPA: 8.0 over total 80 credits (40 remaining).
        Total points needed = 8.0 * 80 = 640.
        Current points = 7.5 * 40 = 300.
        Points needed in remaining = 340.
        Required SGPA = 340 / 40 = 8.5.
        """
        res = calculate_target_sgpa(
            current_cgpa=7.5,
            completed_credits=40,
            target_cgpa=8.0,
            remaining_credits=40
        )
        self.assertTrue(res["reachable"])
        self.assertEqual(res["required_sgpa"], 8.5)
        self.assertEqual(res["status"], "achievable")

    def test_target_sgpa_unreachable(self):
        """
        Current CGPA: 6.0 over 60 credits.
        Target CGPA: 9.0 over 80 credits (20 remaining).
        Total needed = 9.0 * 80 = 720.
        Current = 6.0 * 60 = 360.
        Points needed = 360 over 20 credits => Required SGPA = 18.0 (>10).
        """
        res = calculate_target_sgpa(
            current_cgpa=6.0,
            completed_credits=60,
            target_cgpa=9.0,
            remaining_credits=20
        )
        self.assertFalse(res["reachable"])
        self.assertEqual(res["status"], "unreachable")
        self.assertEqual(res["required_sgpa"], 18.0)

    def test_target_sgpa_already_achieved(self):
        """Target CGPA is lower than current and already achieved."""
        res = calculate_target_sgpa(
            current_cgpa=9.0,
            completed_credits=60,
            target_cgpa=6.0,
            remaining_credits=20
        )
        self.assertTrue(res["reachable"])
        self.assertEqual(res["status"], "already_achieved")

    def test_percentage_calculation(self):
        """Test CGPA to percentage with default 9.5 and custom multiplier."""
        self.assertEqual(calculate_percentage(8.0, 9.5), 76.0)
        self.assertEqual(calculate_percentage(10.0, 9.5), 95.0)
        self.assertEqual(calculate_percentage(7.93, 10.0), 79.3)

    def test_performance_class(self):
        """Test academic class classifications."""
        self.assertEqual(get_performance_class(8.5), "First Class with Distinction")
        self.assertEqual(get_performance_class(7.0), "First Class")
        self.assertEqual(get_performance_class(6.0), "Higher Second Class")
        self.assertEqual(get_performance_class(5.2), "Second Class")
        self.assertEqual(get_performance_class(4.2), "Pass Class")
        self.assertEqual(get_performance_class(3.5), "Failed / Needs Improvement")


    def test_year_weighted_average(self):
        """Test year result calculation with credit-weighted average."""
        # Sem 3: 22 credits, 8.50 SGPA => 187 points
        # Sem 4: 22 credits, 9.00 SGPA => 198 points
        # Total: 44 credits, 385 points => 8.75 SGPA
        res = calculate_year_result(22.0, 8.50, 22.0, 9.00)
        self.assertEqual(res["total_credits"], 44.0)
        self.assertEqual(res["total_points"], 385.0)
        self.assertEqual(res["year_sgpa"], 8.75)
        self.assertEqual(res["percentage"], 83.12)
        self.assertEqual(res["performance_class"], "First Class with Distinction")


if __name__ == "__main__":
    unittest.main()
