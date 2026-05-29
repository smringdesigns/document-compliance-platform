from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import DATABASE_URL

# Creación del motor de la base de datos
engine = create_engine(DATABASE_URL)

# Configuración de la sesión local
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base declarativa para tus modelos
Base = declarative_base()

# Generador de la sesión de base de datos (Inyección de dependencias)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()