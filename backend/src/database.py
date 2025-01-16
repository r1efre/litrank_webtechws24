import csv
import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


# Используем переменную окружения, если она есть
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://avnadmin:AVNS_VhEyCyHPV6jdhs65GqL@pg-1a34ffe7-worker-3c3d.g.aivencloud.com:21815/defaultdb?sslmode=require")

# Преобразование старого формата postgres:// в postgresql:// для SQLAlchemy
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()