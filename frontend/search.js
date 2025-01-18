document.addEventListener("DOMContentLoaded", async () => {
  const userNickname = document.getElementById("user-nickname");
  const logoutButton = document.querySelector(".logout");
  const signupButton = document.querySelector(".sign-up");
  const loginButton = document.querySelector(".login");
  const addBookButton = document.querySelector(".add-book");
  const searchForm = document.getElementById('advanced-search-form');
  const advancedSearchGridBooks = document.getElementById('book-grid');
  let user = null;

  // Function to store token in local storage
  function storeToken(token) {
    localStorage.setItem("jwt_token", token);
  }

  // Function to get token from local storage
  function getToken() {
    return localStorage.getItem("jwt_token");
  }

  // Function to remove token from local storage
  function removeToken() {
    localStorage.removeItem("jwt_token");
  }

  // Function to fetch current user
  async function fetchCurrentUser() {
    const token = getToken();
    if (!token) return null;

    try {
      const response = await fetch("https://litrank-webtech-3926216d016d.herokuapp.com/users/me", {
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
      userNickname.style.display = "inline";
      userNickname.style.color = "white";
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

  // Function to display books
  function displayBooks(books) {
    advancedSearchGridBooks.innerHTML = '';
    books.forEach((book) => {
      const bookCard = document.createElement("div");
      bookCard.className = "book-card";
    
      bookCard.innerHTML = `
        <img src="${book.image_url}" alt="${book.title}">
        <div class="book-info">
          <h3 class="book-title" data-book-id="${book.id}">${book.title}</h3>
          <p class="author">${book.author}</p>
          <button class="genre" data-genre="${book.genre}">${book.genre}</button>
          <div class="rating">
            ${"★".repeat(Math.floor(book.rating))}${"☆".repeat(5 - Math.floor(book.rating))}
          </div>
          <div class="card-buttons">
            <button class="will-read" data-book-id="${book.id}">Will Read</button>
            <button class="already-read" data-book-id="${book.id}">Read</button>
          </div>
        </div>
      `;
    
      advancedSearchGridBooks.appendChild(bookCard);

      // Add event listener for genre button
      const genreButton = bookCard.querySelector(".genre");
      genreButton.addEventListener("click", () => {
        window.location.href = `search.html?genre=${encodeURIComponent(book.genre)}`;
      });

      // Add event listener for each book card
      bookCard.addEventListener("click", (event) => {
        const bookTitle = event.target.closest(".book-card").querySelector(".book-title");
        const bookId = bookTitle.getAttribute("data-book-id");
        window.location.href = `book.html?id=${bookId}`;
      });
    });
  }

  // Check if user is already logged in
  user = await fetchCurrentUser();
  displayUserNickname();

  logoutButton.addEventListener("click", () => {
    removeToken();
    user = null;
    displayUserNickname();
  });

  const addBookModal = document.getElementById("add-book-modal");
  const closeAddBookModalButton = addBookModal.querySelector(".close-button");
  const addBookForm = document.getElementById("add-book-form");

  addBookButton.addEventListener("click", () => {
    if (!user) {
      return;
    }
    addBookModal.style.display = "block";
  });

  closeAddBookModalButton.addEventListener("click", () => {
    addBookModal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === addBookModal) {
      addBookModal.style.display = "none";
    }
  });

  addBookForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(addBookForm);
    const bookData = {
      title: formData.get("title"),
      author: formData.get("author"),
      genre: formData.get("genre"),
      rating: parseFloat(formData.get("rating")),
      image_url: formData.get("image_url"),
      description: formData.get("description"),
    };

    try {
      const response = await fetch("https://litrank-webtech-3926216d016d.herokuapp.com/books/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(bookData),
      });

      if (response.ok) {
        addBookModal.style.display = "none";
        addBookForm.reset();
        const response = await fetch("https://litrank-webtech-3926216d016d.herokuapp.com/books/");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const books = await response.json();
        displayBooks(books);
      } else {
        const errorData = await response.json();
        console.error("Error adding book:", errorData);
      }
    } catch (error) {
      console.error("Error adding book:", error);
    }
  });

  searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
  
    const formData = new FormData(searchForm);
    const queryParams = new URLSearchParams();
  
    for (const [key, value] of formData.entries()) {
      if (value) {
        queryParams.append(key, value);
      }
    }
  
    try {
      const response = await fetch(`https://litrank-webtech-3926216d016d.herokuapp.com/books/search/?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const books = await response.json();
  
      advancedSearchGridBooks.innerHTML = '';

      if (books && books.length > 0) {
        displayBooks(books);
      } else {
        advancedSearchGridBooks.innerHTML = '<p>No books found matching your criteria.</p>';
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
      advancedSearchGridBooks.innerHTML = '<p>Error fetching search results. Please try again.</p>';
    }
  });

  // Function to fetch and display books based on genre
  async function fetchAndDisplayBooksByGenre(genre) {
    try {
      const response = await fetch(`https://litrank-webtech-3926216d016d.herokuapp.com/books/search/?genre=${encodeURIComponent(genre)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const books = await response.json();
      
      displayBooks(books);
    } catch (error) {
      console.error("Error fetching books by genre:", error);
      advancedSearchGridBooks.innerHTML = '<p>Error fetching books. Please try again.</p>';
    }
  }

  // Check if there is a genre query parameter in the URL
  const urlParams = new URLSearchParams(window.location.search);
  const genre = urlParams.get('genre');
  if (genre) {
    document.getElementById('search-genre').value = genre;
    await fetchAndDisplayBooksByGenre(genre);
  }

});
