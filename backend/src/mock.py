import csv

from database import SessionLocal, engine
from . import models

models.Base.metadata.create_all(bind=engine)

def fill_database_with_mock_data(csv_file_path: str):
    with open(csv_file_path, mode='r') as file:
        csv_reader = csv.DictReader(file)
        with SessionLocal() as session:
            for row in csv_reader:
                book = models.Book(
                    id=row['id'],
                    title=row['title'],
                    author=row['author'],
                    genre=row['genre'],
                    rating=row['rating'],
                    image_url=row['image_url']
                )
                session.add(book)
            session.commit()


if __name__ == '__main__':
    fill_database_with_mock_data('./data/mock_data.csv')