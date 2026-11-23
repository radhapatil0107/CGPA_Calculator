"""
Database Reset Utility Script.
Wipes all user accounts, student profiles, and semester records from the database
so the application can start completely fresh.
"""
import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cgpa-calculator", "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import app, db, User, StudentProfile, Semester

def reset_all_data():
    with app.app_context():
        # Count existing records
        user_count = User.query.count()
        prof_count = StudentProfile.query.count()
        sem_count = Semester.query.count()
        
        print(f"Purging existing database:")
        print(f" - Users: {user_count}")
        print(f" - Profiles: {prof_count}")
        print(f" - Semesters: {sem_count}")

        # Delete all records
        Semester.query.delete()
        StudentProfile.query.delete()
        User.query.delete()
        db.session.commit()

        print("\nAll existing data has been permanently deleted.")
        print("Application database is now 100% clean and ready for fresh registration!")

if __name__ == "__main__":
    reset_all_data()
