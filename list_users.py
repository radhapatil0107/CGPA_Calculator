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
        users = User.query.order_by(User.id).all()
        print("\n" + "=" * 115)
        print(" " * 38 + "STUDENT USERS DIRECTORY & LOGIN AUDIT")
        print("=" * 115)
        header = f"{'ID':<4} | {'Username':<24} | {'Email':<26} | {'Student Name':<22} | {'Roll No':<8} | {'Logins':<6} | {'Last Login':<19}"
        print(header)
        print("-" * 115)
        for u in users:
            p = u.profile
            p_name = (p.name[:20] if p and p.name else "-")
            roll_no = (p.roll_no[:7] if p and p.roll_no else "-")
            last_log = u.last_login.strftime('%Y-%m-%d %H:%M') if u.last_login else "Never"
            uname = (u.username[:22] if u.username else "-")
            email = (u.email[:24] if u.email else "-")
            logins = str(u.login_count or 0)
            print(f"{u.id:<4} | {uname:<24} | {email:<26} | {p_name:<22} | {roll_no:<8} | {logins:<6} | {last_log:<19}")
        print("=" * 115)
        print(f"Total registered students in database: {len(users)}\n")

if __name__ == "__main__":
    show_users()
