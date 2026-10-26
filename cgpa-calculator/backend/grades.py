"""
Grade definitions and scale configurations for the Student Grade Calculator.
Aligned with Autonomous / Shivaji University grading standards for
B.Tech CSE (Data Science), D.Y. Patil College of Engineering & Technology, Kolhapur.
"""

from typing import Dict, List, Optional


# Grade scale mapping: Grade letter -> Grade Points and descriptions
GRADE_SCALE: List[Dict[str, any]] = [
    {
        "grade": "O",
        "points": 10,
        "description": "Outstanding",
        "marks_range": "90% - 100%",
        "performance": "Exceptional mastery of subject matter"
    },
    {
        "grade": "A+",
        "points": 9,
        "description": "Excellent",
        "marks_range": "80% - 89%",
        "performance": "Superior performance with comprehensive understanding"
    },
    {
        "grade": "A",
        "points": 8,
        "description": "Very Good",
        "marks_range": "70% - 79%",
        "performance": "Good knowledge and strong analytical skill"
    },
    {
        "grade": "B+",
        "points": 7,
        "description": "Good",
        "marks_range": "60% - 69%",
        "performance": "Above average with sound concept application"
    },
    {
        "grade": "B",
        "points": 6,
        "description": "Above Average",
        "marks_range": "55% - 59%",
        "performance": "Satisfactory understanding of fundamental concepts"
    },
    {
        "grade": "C",
        "points": 5,
        "description": "Average",
        "marks_range": "50% - 54%",
        "performance": "Average level of comprehension and delivery"
    },
    {
        "grade": "P",
        "points": 4,
        "description": "Pass",
        "marks_range": "40% - 49%",
        "performance": "Meets minimum passing requirements"
    },
    {
        "grade": "F",
        "points": 0,
        "description": "Fail",
        "marks_range": "Below 40%",
        "performance": "Unsatisfactory, course needs to be reappeared"
    }
]

# Quick lookup dictionary for grade to grade point
GRADE_POINTS: Dict[str, int] = {
    item["grade"]: item["points"] for item in GRADE_SCALE
}


def get_grade_points(grade: str) -> int:
    """
    Retrieve grade point for a given grade letter.
    
    Args:
        grade: Letter grade symbol (e.g. 'O', 'A+', 'B')
        
    Returns:
        Integer grade point (0 to 10)
        
    Raises:
        ValueError: If grade symbol is invalid
    """
    cleaned_grade = grade.strip().upper() if isinstance(grade, str) else ""
    if cleaned_grade not in GRADE_POINTS:
        valid_options = ", ".join(GRADE_POINTS.keys())
        raise ValueError(f"Invalid grade '{grade}'. Valid options are: {valid_options}")
    return GRADE_POINTS[cleaned_grade]


def is_valid_grade(grade: str) -> bool:
    """
    Check if a grade letter exists in the grading scale.
    """
    if not isinstance(grade, str):
        return False
    return grade.strip().upper() in GRADE_POINTS


def get_all_grades() -> List[Dict[str, any]]:
    """
    Return the full grade scale with points and descriptions.
    """
    return GRADE_SCALE
