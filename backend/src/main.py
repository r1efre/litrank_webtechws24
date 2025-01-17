from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from starlette.responses import FileResponse
from starlette.staticfiles import StaticFiles


from .database import SessionLocal, engine
from . import models, crud, schemas, database


models.Base.metadata.create_all(bind=engine)



app = FastAPI()

app.mount("/static", StaticFiles(directory="frontend"), name="static")

# JWT Configuration
SECRET_KEY = "a_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 schema
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Utility: Verify password
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Utility: Hash password jj
def get_password_hash(password):
    return pwd_context.hash(password)

# Utility: Get user from database
def get_user(db, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

# Utility: Authenticate user
def authenticate_user(db, username: str, password: str):
    user = get_user(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user

# Create a JWT token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Dependency: Get current user from token
async def get_current_user(token: str = Depends(oauth2_scheme)):
    db = SessionLocal()
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user = get_user(db, username)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    finally:
        db.close()

# Login route: Token generation
@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = SessionLocal()
    try:
        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    finally:
        db.close()

# Protected route
@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# Existing routes and middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/books/", response_model=list[schemas.Book])
def read_books(skip: int = 0, limit: int = 50):
    db = SessionLocal()
    try:
        books = crud.get_books(db, skip=skip, limit=limit)
        return books
    finally:
        db.close()

@app.get("/books/{book_id}", response_model=schemas.Book)
def read_book(book_id: int):
    db = SessionLocal()
    try:
        book = crud.get_book(db, book_id=book_id)
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        return book
    finally:
        db.close()
        
@app.put("/books/{book_id}", response_model=schemas.Book)
def update_book(book_id: int, book: schemas.BookUpdate):
    db = SessionLocal()
    try:
        db_book = crud.update_book(db, book_id=book_id, book=book)
        if not db_book:
            raise HTTPException(status_code=404, detail="Book not found")
        return db_book
    finally:
        db.close()

@app.delete("/books/{book_id}", response_model=schemas.Book)
def delete_book(book_id: int):
    db = SessionLocal()
    try:
        book = crud.get_book(db, book_id=book_id)
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        db_book = crud.delete_book(db, book_id=book_id)
        return db_book
    finally:
        db.close()

@app.post("/books/", response_model=schemas.Book)
def create_book(book: schemas.BookCreate):
    db = SessionLocal()
    try:
        db_book = crud.create_book(db, book=book)
        return db_book
    finally:
        db.close()

@app.get("/books/search/", response_model=list[schemas.Book])
def search_books(title: str = None, author: str = None, genre: str = None, rating: float = None):
    db = SessionLocal()
    try:
        books = crud.search_books(db, title=title, author=author, genre=genre, rating=rating)
        return books
    finally:
        db.close()

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate):
    db = SessionLocal()
    try:
        db_user = crud.create_user(db, user=user)
        return db_user
    finally:
        db.close()

@app.post("/users/{user_id}/books/{book_id}/", response_model=schemas.UserBook)
def add_book_to_user(user_id: int, book_id: int):
    db = SessionLocal()
    try:
        user_book = crud.add_book_to_user(db, user_id=user_id, book_id=book_id)
        if not user_book:
            raise HTTPException(status_code=404, detail="User or Book not found")
        return user_book
    finally:
        db.close()

@app.get("/users/{user_id}/books/{book_id}/", response_model=bool)
def check_book_in_user_list(user_id: int, book_id: int):
    db = SessionLocal()
    try:
        is_in_list = crud.check_book_in_user_list(db, user_id=user_id, book_id=book_id)
        return is_in_list
    finally:
        db.close()
        
@app.delete("/users/{user_id}/books/{book_id}/", response_model=schemas.UserBook)
def remove_book_from_user(user_id: int, book_id: int):
    db = SessionLocal()
    try:
        user_book = crud.remove_book_from_user(db, user_id=user_id, book_id=book_id)
        if not user_book:
            raise HTTPException(status_code=404, detail="User or Book not found")
        return user_book
    finally:
        db.close()

        from fastapi.responses import FileResponse


from fastapi.responses import FileResponse

@app.get("/", response_class=FileResponse)
def serve_index():
    return "frontend/index.html"

@app.get("/impressum.html", response_class=FileResponse)
def serve_impressum():
    return "frontend/impressum.html"

@app.get("/map.html", response_class=FileResponse)
def serve_map():
    return "frontend/map.html"

@app.get("/contact.html", response_class=FileResponse)
def serve_contact():
    return "frontend/contact.html"

@app.get("/search.html", response_class=FileResponse)
def serve_search():
    return "frontend/search.html"

@app.get("/index.html", response_class=FileResponse)
def serve_index_alias():
    return "frontend/index.html"


