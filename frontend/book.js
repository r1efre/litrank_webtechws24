document.addEventListener("DOMContentLoaded", async () => {
  const bookDetails = document.getElementById("book-details");
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get("id");

  // Function to get token from local storage
  function getToken() {
    return localStorage.getItem("jwt_token");
  }

  const token = getToken();

  if (!bookId) {
    bookDetails.innerHTML = "<p>Book ID is missing in the URL.</p>";
    return;
  }

  try {
    const response = await fetch(`http://localhost:8000/books/${bookId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const book = await response.json();

    bookDetails.innerHTML = `
      <img src="${book.image_url}" alt="${book.title}" style="width: 320px; height: 520px;">
      <div class="book-info">
      <h3 class="book-title" data-book-id="${book.id}">${book.title}</h3>
      <p class="author">${book.author}</p>
      <span class="genre">${book.genre}</span>
      <p class="description">${book.description}</p>
      <div class="rating">
        ${"★".repeat(Math.floor(book.rating))}${"☆".repeat(5 - Math.floor(book.rating))}
      </div>
      <div class="card-buttons">
        <button class="will-read" data-book-id="${book.id}">Will Read</button>
        <button class="already-read" data-book-id="${book.id}">Read</button>
        ${token ? `
        <button class="update-book" data-book-id="${book.id}">Update</button>
        <button class="delete-book" data-book-id="${book.id}">Delete</button>
        ` : ''}
      </div>
      </div>
    `;

    if (token) {
      document.querySelector(".delete-book").addEventListener("click", async () => {
        if (confirm("Are you sure you want to delete this book?")) {
          try {
            const deleteResponse = await fetch(`http://localhost:8000/books/${bookId}`, {
              method: "DELETE",
              headers: {
                "Authorization": `Bearer ${token}`
              }
            });
            if (!deleteResponse.ok) {
              throw new Error(`HTTP error! status: ${deleteResponse.status}`);
            }
            alert("Book deleted successfully.");
            window.location.href = "index.html";
          } catch (error) {
            console.error("Error deleting book:", error);
            alert("Error deleting book. Please try again.");
          }
        }
      });

      const updateBookModal = document.getElementById("updateBookModal");
      const updateBookForm = document.getElementById("updateBookForm");
      const closeModal = document.querySelector(".close");

      document.querySelector(".update-book").addEventListener("click", () => {
        updateBookModal.style.display = "block";
        updateBookForm.title.value = book.title;
        updateBookForm.author.value = book.author;
        updateBookForm.genre.value = book.genre;
        updateBookForm.description.value = book.description;
        updateBookForm.rating.value = book.rating;
        updateBookForm.image_url.value = book.image_url;
      });

      closeModal.addEventListener("click", () => {
        updateBookModal.style.display = "none";
      });

      updateBookForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const updatedBook = {
          title: updateBookForm.title.value,
          author: updateBookForm.author.value,
          genre: updateBookForm.genre.value,
          description: updateBookForm.description.value,
          rating: parseFloat(updateBookForm.rating.value),
          image_url: updateBookForm.image_url.value,
        };
        try {
          const updateResponse = await fetch(`http://localhost:8000/books/${bookId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(updatedBook),
          });
          if (!updateResponse.ok) {
            throw new Error(`HTTP error! status: ${updateResponse.status}`);
          }
          alert("Book updated successfully.");
          updateBookModal.style.display = "none";
          location.reload();
        } catch (error) {
          console.error("Error updating book:", error);
          alert("Error updating book. Please try again.");
        }
      });
    }

  } catch (error) {
    console.error("Error fetching book details:", error);
    bookDetails.innerHTML = "<p>Error fetching book details. Please try again.</p>";
  }

  // Function to fetch current user
  async function fetchCurrentUser() {
    const token = getToken();
    if (!token) return null;

    try {
      const response = await fetch("http://localhost:8000/users/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        return await response.json();
      } else {
        console.error("Failed to fetch current user:", response.statusText);
        return null;
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  }

  // Function to display user nickname
  function displayUserNickname() {
    if (user) {
      userNickname.textContent = `Welcome, ${user.username}`;
      userNickname.style.color = "white";
      userNickname.style.display = "inline";
      logoutButton.style.display = "inline";
      addBookButton.style.display = "inline";
      signupButton.style.display = "none";
      loginButton.style.display = "none";
    } else {
      userNickname.style.display = "none";
      logoutButton.style.display = "none";
      addBookButton.style.display = "none";
      signupButton.style.display = "inline";
      loginButton.style.display = "inline";
    }
  }

  // Check if user is already logged in
  user = await fetchCurrentUser();
  displayUserNickname();
});