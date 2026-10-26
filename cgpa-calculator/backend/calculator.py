"""
Pure mathematical calculation functions for SGPA, CGPA, Target Planning,
and Percentage conversion for engineering students.
"""

from typing import List, Dict, Any, Union
from grades import get_grade_points, is_valid_grade


def calculate_sgpa(subjects: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate Semester Grade Point Average (SGPA).
    
    Formula:
        SGPA = Sum(Subject Credits * Grade Points) / Sum(Subject Credits)
        
    Args:
        subjects: List of subject dicts, each with:
            - 'credits': numeric (between 1 and 6)
            - 'grade': str (one of 'O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F')
            - 'name': str (optional subject name)
            
    Returns:
        Dict containing:
            - sgpa: float rounded to 2 decimals
            - total_credits: float rounded to 2 decimals
            - total_points: float rounded to 2 decimals
            - subjects_details: List with calculated points per subject
            
    Raises:
        ValueError: On empty subject list, invalid credits, or unknown grades.
    """
    if not subjects or not isinstance(subjects, list):
        raise ValueError("At least one subject is required to calculate SGPA.")
        
    total_credits: float = 0.0
    total_weighted_points: float = 0.0
    subjects_details: List[Dict[str, Any]] = []
    
    for idx, sub in enumerate(subjects, start=1):
        name = str(sub.get("name", f"Subject {idx}")).strip()
        if not name:
            name = f"Subject {idx}"
            
        raw_credits = sub.get("credits")
        if raw_credits is None:
            raise ValueError(f"Subject '{name}' is missing credit value.")
            
        try:
            credits = float(raw_credits)
        except (ValueError, TypeError):
            raise ValueError(f"Credits for '{name}' must be a valid number.")
            
        if credits < 0:
            raise ValueError(f"Credits for '{name}' cannot be negative.")
        if credits > 10:  # Safety upper limit
            raise ValueError(f"Credits for '{name}' cannot exceed 10.")
            
        grade = str(sub.get("grade", "")).strip().upper()
        if not is_valid_grade(grade):
            raise ValueError(f"Invalid grade '{grade}' for subject '{name}'.")
            
        grade_point = get_grade_points(grade)
        earned_points = credits * grade_point
        
        total_credits += credits
        total_weighted_points += earned_points
        
        sub_detail = {
            "name": name,
            "credits": round(credits, 2),
            "grade": grade,
            "grade_point": grade_point,
            "earned_points": round(earned_points, 2)
        }
        if "marks" in sub and sub["marks"] is not None:
            sub_detail["marks"] = sub["marks"]
        if "total_marks" in sub and sub["total_marks"] is not None:
            sub_detail["total_marks"] = sub["total_marks"]
        if "code" in sub and sub["code"]:
            sub_detail["code"] = sub["code"]
        subjects_details.append(sub_detail)
        
    if total_credits == 0:
        return {
            "sgpa": 0.0,
            "total_credits": 0.0,
            "total_points": 0.0,
            "subjects_details": subjects_details
        }
        
    sgpa = round(total_weighted_points / total_credits, 2)
    
    return {
        "sgpa": sgpa,
        "total_credits": round(total_credits, 2),
        "total_points": round(total_weighted_points, 2),
        "subjects_details": subjects_details
    }


def calculate_cgpa(semesters: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate Cumulative Grade Point Average (CGPA) across multiple semesters.
    
    Formula:
        CGPA = Sum(Semester Credits * Semester SGPA) / Sum(Semester Credits)
        
    Args:
        semesters: List of dicts, each with:
            - 'credits': total credits of that semester (float/int)
            - 'sgpa': SGPA achieved in that semester (float/int)
            - 'semester_no' or 'name': identifier (optional)
            
    Returns:
        Dict containing:
            - cgpa: float rounded to 2 decimals
            - total_credits: float rounded to 2 decimals
            - total_points: float rounded to 2 decimals
            - semester_count: int
            
    Raises:
        ValueError: If input format is invalid or values are out of bounds.
    """
    if not semesters:
        return {
            "cgpa": 0.0,
            "total_credits": 0.0,
            "total_points": 0.0,
            "semester_count": 0
        }
        
    total_credits: float = 0.0
    total_weighted_points: float = 0.0
    
    for idx, sem in enumerate(semesters, start=1):
        sem_label = sem.get("semester_no") or sem.get("name") or f"Semester {idx}"
        
        try:
            credits = float(sem.get("credits", 0))
            sgpa = float(sem.get("sgpa", 0))
        except (ValueError, TypeError):
            raise ValueError(f"Credits and SGPA for '{sem_label}' must be valid numbers.")
            
        if credits < 0:
            raise ValueError(f"Credits for '{sem_label}' cannot be negative.")
        if sgpa < 0 or sgpa > 10:
            raise ValueError(f"SGPA for '{sem_label}' must be between 0.0 and 10.0.")
            
        earned = credits * sgpa
        total_credits += credits
        total_weighted_points += earned
        
    if total_credits == 0:
        return {
            "cgpa": 0.0,
            "total_credits": 0.0,
            "total_points": 0.0,
            "semester_count": len(semesters)
        }
        
    cgpa = round(total_weighted_points / total_credits, 2)
    
    return {
        "cgpa": cgpa,
        "total_credits": round(total_credits, 2),
        "total_points": round(total_weighted_points, 2),
        "semester_count": len(semesters)
    }


def calculate_year_result(
    sem1_credits: float,
    sem1_sgpa: float,
    sem2_credits: float,
    sem2_sgpa: float
) -> Dict[str, Any]:
    """
    Calculate the credit-weighted average of two semesters for an academic year.
    Formula:
        Year SGPA = (Sem1 Credits * Sem1 SGPA + Sem2 Credits * Sem2 SGPA) / (Sem1 Credits + Sem2 Credits)
    """
    total_credits = float(sem1_credits) + float(sem2_credits)
    if total_credits <= 0:
        return {
            "year_sgpa": 0.0,
            "total_credits": 0.0,
            "total_points": 0.0,
            "percentage": 0.0,
            "performance_class": "N/A"
        }
    total_points = (float(sem1_credits) * float(sem1_sgpa)) + (float(sem2_credits) * float(sem2_sgpa))
    year_sgpa = round(total_points / total_credits, 2)
    return {
        "year_sgpa": year_sgpa,
        "total_credits": round(total_credits, 2),
        "total_points": round(total_points, 2),
        "percentage": calculate_percentage(year_sgpa, 9.5),
        "performance_class": get_performance_class(year_sgpa)
    }


def calculate_target_sgpa(
    current_cgpa: float,
    completed_credits: float,
    target_cgpa: float,
    remaining_credits: float
) -> Dict[str, Any]:
    """
    Calculate the required average SGPA for remaining semesters to achieve a target CGPA.
    
    Formula:
        Total Target Points = Target CGPA * (Completed Credits + Remaining Credits)
        Current Total Points = Current CGPA * Completed Credits
        Required Points = Total Target Points - Current Total Points
        Required SGPA = Required Points / Remaining Credits
        
    Args:
        current_cgpa: Current CGPA (0.0 to 10.0)
        completed_credits: Total credits earned so far
        target_cgpa: Desired target CGPA (0.0 to 10.0)
        remaining_credits: Credits remaining to complete degree
        
    Returns:
        Dict with:
            - required_sgpa: float rounded to 2 decimals
            - reachable: bool
            - status: str ('already_achieved', 'achievable', 'unreachable', 'not_possible')
            - message: str explanatory feedback message
    """
    try:
        current_cgpa = float(current_cgpa)
        completed_credits = float(completed_credits)
        target_cgpa = float(target_cgpa)
        remaining_credits = float(remaining_credits)
    except (ValueError, TypeError):
        raise ValueError("All inputs for target calculation must be numeric.")
        
    if current_cgpa < 0 or current_cgpa > 10:
        raise ValueError("Current CGPA must be between 0.0 and 10.0.")
    if target_cgpa < 0 or target_cgpa > 10:
        raise ValueError("Target CGPA must be between 0.0 and 10.0.")
    if completed_credits < 0:
        raise ValueError("Completed credits cannot be negative.")
    if remaining_credits <= 0:
        raise ValueError("Remaining credits must be greater than zero.")
        
    # Total credits upon graduation
    total_credits = completed_credits + remaining_credits
    if total_credits <= 0:
        raise ValueError("Total graduation credits must be greater than zero.")
        
    current_points = current_cgpa * completed_credits
    target_total_points = target_cgpa * total_credits
    needed_points = target_total_points - current_points
    
    required_sgpa_raw = needed_points / remaining_credits
    required_sgpa = round(required_sgpa_raw, 2)
    
    # Analyze outcome
    if required_sgpa > 10.0:
        return {
            "required_sgpa": required_sgpa,
            "reachable": False,
            "status": "unreachable",
            "message": (
                f"Target is mathematically unreachable. You would require an average SGPA "
                f"of {required_sgpa:.2f}, but the maximum attainable SGPA is 10.00."
            )
        }
    elif required_sgpa <= 0.0:
        return {
            "required_sgpa": 0.0,
            "reachable": True,
            "status": "already_achieved",
            "message": (
                f"Target already achieved! Even with minimum passing grades, "
                f"your current performance of {current_cgpa:.2f} satisfies your target {target_cgpa:.2f}."
            )
        }
    elif required_sgpa < 4.0:
        return {
            "required_sgpa": max(4.0, required_sgpa),
            "reachable": True,
            "status": "easily_achievable",
            "message": (
                f"Target is comfortably achievable. You only need a minimum passing SGPA of "
                f"{max(4.0, required_sgpa):.2f} (Grade P) across the remaining {remaining_credits:.0f} credits."
            )
        }
    else:
        difficulty = "Ambitious & challenging" if required_sgpa >= 8.5 else "Very achievable"
        return {
            "required_sgpa": required_sgpa,
            "reachable": True,
            "status": "achievable",
            "message": (
                f"{difficulty}! You need to maintain an average SGPA of {required_sgpa:.2f} "
                f"across the remaining {remaining_credits:.0f} credits."
            )
        }


def calculate_percentage(cgpa: float, multiplier: float = 9.5) -> float:
    """
    Convert CGPA to approximate percentage.
    Default formula: Percentage = CGPA * 9.5 (AICTE / D.Y. Patil standard).
    
    Args:
        cgpa: CGPA value
        multiplier: Multiplier factor (default 9.5)
        
    Returns:
        float: Percentage rounded to 2 decimals
    """
    try:
        cgpa = float(cgpa)
        multiplier = float(multiplier)
    except (ValueError, TypeError):
        raise ValueError("CGPA and multiplier must be numeric.")
        
    if cgpa < 0 or cgpa > 10:
        raise ValueError("CGPA must be between 0.0 and 10.0.")
    if multiplier <= 0:
        raise ValueError("Multiplier must be greater than zero.")
        
    percentage = cgpa * multiplier
    return round(min(100.0, percentage), 2)


def get_performance_class(cgpa: float) -> str:
    """
    Return academic performance class based on CGPA for engineering degrees.
    """
    if cgpa >= 7.75:
        return "First Class with Distinction"
    elif cgpa >= 6.75:
        return "First Class"
    elif cgpa >= 5.75:
        return "Higher Second Class"
    elif cgpa >= 5.00:
        return "Second Class"
    elif cgpa >= 4.00:
        return "Pass Class"
    else:
        return "Failed / Needs Improvement"
