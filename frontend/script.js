document.addEventListener("DOMContentLoaded", async () => {

  const bookGrid = document.getElementById("book-grid");
  const userNickname = document.getElementById("user-nickname");
  const logoutButton = document.querySelector(".logout");
  const signupButton = document.querySelector(".sign-up");
  const loginButton = document.querySelector(".login");
  const addBookButton = document.querySelector(".add-book"); // Get add book button
  let books = [];
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
      const response = await fetch("https://litrank-webtech.herokuapp.com/books/", {
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

  function displayBooks(books) {
    bookGrid.innerHTML = "";
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
  
      bookGrid.appendChild(bookCard);

      // Add event listener for genre button
      const genreButton = bookCard.querySelector(".genre");
      genreButton.addEventListener("click", () => {
        window.location.href = `search.html?genre=${encodeURIComponent(book.genre)}`;
      });
    });
  
    // Add event listeners to book titles
    document.querySelectorAll(".book-title").forEach(title => {
      title.addEventListener("click", (event) => {
        const bookId = event.target.dataset.bookId;
        window.location.href = `book.html?id=${bookId}`;
      });
    });
  
    // Add event listeners to "Will Read" and "Read" buttons
    document.querySelectorAll(".will-read").forEach(button => {
      button.addEventListener("click", async (event) => {
          const bookId = event.target.dataset.bookId;
          await addBookToUserList(bookId, "will-read");
      });
    });
  
    document.querySelectorAll(".already-read").forEach(button => {
        button.addEventListener("click", async (event) => {
            const bookId = event.target.dataset.bookId;
            await addBookToUserList(bookId, "already-read");
        });
    });
  }

  // Check if user is already logged in
  user = await fetchCurrentUser();
  displayUserNickname();

  try {
    const response = await fetch("http://localhost:8000/books/");
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    books = await response.json();
    displayBooks(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    // alert(`Failed to load books. Please try again later. ${error}`);
  }

  async function addBookToUserList(bookId, listType) {
    if (!user) {
      alert("You must be logged in to add books to your list.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/users/${user.id}/books/${bookId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
      });

      if (response.ok) {
          alert(`Book added to ${listType.replace("-", " ")} list!`);
      } else {
          const errorData = await response.json();
          alert("Error adding book to list: " + errorData.detail);
      }
    } catch (error) {
        console.error("Error adding book to list:", error);
      alert("An error occurred. Please try again.");
    }
  }


  function filterBooks(query) {
    const filteredBooks = books.filter((book) =>
      book.title.toLowerCase().includes(query.toLowerCase())
    );
    displayBooks(filteredBooks);
  }

  const signupModal = document.getElementById("signup-modal");
  const signupCloseButton = signupModal.querySelector(".close-button");
  const signupForm = document.getElementById("signup-form");

  signupButton.addEventListener("click", () => {
    signupModal.style.display = "block";
  });

  signupCloseButton.addEventListener("click", () => {
    signupModal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === signupModal) {
      signupModal.style.display = "none";
    }
  });

  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener("input", (event) => {
    filterBooks(event.target.value);
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(signupForm);
    const userData = {
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const response = await fetch("http://localhost:8000/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        alert("Sign-Up successful!");
        signupModal.style.display = "none";
      } else {
        const errorData = await response.json();
        alert("Error: " + (errorData.detail || "Sign-up failed!"));
      }
    } catch (error) {
      console.error("Error during sign-up:", error);
      alert("An error occurred. Please try again.");
    }
  });

  const loginModal = document.getElementById("login-modal");
  const loginCloseButton = loginModal.querySelector(".close-button");
  const loginForm = document.getElementById("login-form");

  loginButton.addEventListener("click", () => {
    loginModal.style.display = "block";
  });

  loginCloseButton.addEventListener("click", () => {
    loginModal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      loginModal.style.display = "none";
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const loginData = {
      username: formData.get("username"),
      password: formData.get("password"),
    };

    try {
      const response = await fetch("http://localhost:8000/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          username: loginData.username,
          password: loginData.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        storeToken(data.access_token);
        user = await fetchCurrentUser();
        alert("Login successful!");
        loginModal.style.display = "none";
        displayUserNickname();
      } else {
        const errorData = await response.json();
        alert("Error: " + (errorData.detail || "Login failed!"));
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred. Please try again.");
    }
  });

  logoutButton.addEventListener("click", () => {
    removeToken();
    user = null;
    alert("Logout successful!");
    displayUserNickname();
  });

  const addBookModal = document.getElementById("add-book-modal");
  const closeAddBookModalButton = addBookModal.querySelector(".close-button");
  const addBookForm = document.getElementById("add-book-form");

  addBookButton.addEventListener("click", () => {
    if (!user) {
      alert("You must be logged in to add books.");
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
      description: formData.get("description")
    };

    try {
      const response = await fetch("http://localhost:8000/books/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(bookData),
      });

      if (response.ok) {
        alert("Book added successfully!");
        addBookModal.style.display = "none";
        addBookForm.reset();
        // Optionally, refresh the book list here
        const response = await fetch("http://localhost:8000/books/");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        books = await response.json();
        displayBooks(books);
      } else {
        const errorData = await response.json();
        alert("Error: " + (errorData.detail || "Failed to add book."));
      }
    } catch (error) {
      console.error("Error adding book:", error);
      alert("An error occurred. Please try again.");
    }
  });

});