import csv
import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker




DATABASE_URL = "postgresql://avnadmin:AVNS_VhEyCyHPV6jdhs65GqL@pg-1a34ffe7-worker-3c3d.g.aivencloud.com:21815/defaultdb?sslmode=require"  # Или другой URL для PostgreSQL/MySQL
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


