import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, JSON
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    fullname = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True, nullable=False)
    repo_url = Column(String, nullable=True)
    file_count = Column(Integer, default=0)
    folder_count = Column(Integer, default=0)
    languages = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="projects")
    analysis_results = relationship("AnalysisResult", back_populates="project", uselist=False, cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), unique=True)
    domain = Column(String, nullable=False)
    confidence = Column(Float, default=0.0)
    modules = Column(JSON, nullable=True)
    potential_score = Column(Integer, default=0)
    saas_recommendation = Column(JSON, nullable=True)
    apis = Column(JSON, nullable=True)
    microservices = Column(JSON, nullable=True)
    architecture = Column(JSON, nullable=True)
    business_potential = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="analysis_results")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    pdf_path = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="reports")
