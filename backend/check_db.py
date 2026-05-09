import sqlite3
conn = sqlite3.connect("hr_app.db")
tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print("Tables:", tables)
if ('alembic_version',) in tables:
    version = conn.execute("SELECT version_num FROM alembic_version").fetchall()
    print("Alembic version:", version)
conn.close()
