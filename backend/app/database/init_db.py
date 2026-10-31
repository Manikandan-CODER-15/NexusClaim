"""
NexusClaim — Database initialisation script.
Creates all SQLAlchemy tables in the SQLite database pointed to by DATABASE_URL
in backend/.env (default: sqlite:///./nexusclaim.db).

Run from project root:
    backend\\venv\\Scripts\\python.exe -m backend.app.database.init_db
"""

import sys
from sqlalchemy import inspect

# Import Base + engine (session.py already reads .env)
from backend.app.database.session import Base, engine

# Import ALL models so Base.metadata knows about them
import backend.app.models.entities  # noqa: F401


def init_database():
    """Create all tables that don't exist yet and print the result."""
    print("=" * 60)
    print("  NexusClaim — Database Initialisation")
    print("=" * 60)
    print(f"\nDatabase URL : {engine.url}")
    print("Creating tables ...")

    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    tables = sorted(inspector.get_table_names())

    print(f"\n[OK] {len(tables)} tables created / verified:\n")
    for i, t in enumerate(tables, 1):
        cols = [c["name"] for c in inspector.get_columns(t)]
        print(f"  {i:>2}. {t:<30}  ({len(cols)} columns)")

    print("\n" + "=" * 60)
    print("  Database initialisation complete. OK")
    print("=" * 60)
    return tables


if __name__ == "__main__":
    tables = init_database()
    if not tables:
        print("ERROR: no tables found after creation!", file=sys.stderr)
        sys.exit(1)
