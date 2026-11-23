#!/usr/bin/env python3
"""
CLI Utility to inspect registered users, user IDs, emails, usernames, and login activity.
Usage:
    python list_users.py
"""
import os
import sys

# Setup backend import
base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(base_dir, "cgpa-calculator", "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import app, db, User, StudentProfile, Semester

def show_users():
    with app.app_context():
        db_file = os.path.abspath(db.engine.url.database) if db.engine.url.database else "SQLite"
        users = User.query.order_by(User.id).all()
        semesters = Semester.query.order_by(Semester.user_id, Semester.semester_no).all()
        
        print("\n" + "=" * 115)
        print(" " * 38 + "STUDENT USERS DIRECTORY & DATABASE INSPECTION")
        print("=" * 115)
        print(f"Database File: {db_file}")
        print(f"Total Users: {len(users)} | Total Semesters: {len(semesters)}")
        print("=" * 115)
        
        if not users:
            print("\n  [Database is currently empty - 0 registered students]")
            print("  As soon as you register a student on the website, they will appear here.\n")
        else:
            header = f"{'ID':<4} | {'Username':<24} | {'Email':<26} | {'Student Name':<22} | {'Roll No':<8} | {'Branch':<20}"
            print(header)
            print("-" * 115)
            for u in users:
                p = u.profile
                p_name = (p.name[:20] if p and p.name else "-")
                roll_no = (p.roll_no[:7] if p and p.roll_no else "-")
                branch = (p.branch[:18] if p and p.branch else "-")
                uname = (u.username[:22] if u.username else "-")
                email = (u.email[:24] if u.email else "-")
                print(f"{u.id:<4} | {uname:<24} | {email:<26} | {p_name:<22} | {roll_no:<8} | {branch:<20}")
            
            if semesters:
                print("\n" + "-" * 115)
                print("SAVED SEMESTER RECORDS:")
                print(f"{'User ID':<8} | {'Semester':<10} | {'Credits':<8} | {'SGPA':<6} | {'Created At':<19}")
                print("-" * 115)
                for s in semesters:
                    c_at = s.created_at.strftime('%Y-%m-%d %H:%M') if s.created_at else "-"
                    print(f"{s.user_id:<8} | Sem {s.semester_no:<6} | {s.credits:<8.1f} | {s.sgpa:<6.2f} | {c_at:<19}")

        print("=" * 115 + "\n")

if __name__ == "__main__":
    show_users()
