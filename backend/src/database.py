import csv
import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker




# Считываем DATABASE_URL из переменных окружения
SQLALCHEMY_DATABASE_URL = os.getenv("postgresql://avnadmin:AVNS_VhEyCyHPV6jdhs65GqL@pg-1a34ffe7-worker-3c3d.g.aivencloud.com:21815/defaultdb?sslmode=require")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("No DATABASE_URL environment variable found")

# Создаём движок с SSL
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()



