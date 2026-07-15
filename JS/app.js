// ======================================
// Hridhaan Public Library
// app.js
// ======================================

let books = [];
let selectedBookId = null;
let selectedBook = null;

// Track the book this specific device/user just borrowed for notification checks
let trackingBookId = localStorage.getItem("trackedBookId") ? Number(localStorage.getItem("trackedBookId")) : null;

// Get DOM elements
const library = document.getElementById("library");
const search = document.getElementById("search");
const totalBooks = document.getElementById("books");
const totalGenres = document.getElementById("genres");
const totalAvailable = document.getElementById("available");
const totalBorrowed = document.getElementById("borrowed");
const featuredBook = document.getElementById("featuredBook");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");

// Load books
async function loadBooks() {
    try {
        console.log("📖 Starting to load books...");
        const freshBooks = await getBooks();
        
        if (!freshBooks || freshBooks.length === 0) {
            console.error("❌ No books returned from API");
            return;
        }
        
        // --- NOTIFICATION & DENIAL CHECK LOGIC ---
        if (books.length > 0 && trackingBookId) {
            const oldBookState = books.find(b => Number(b.id) === trackingBookId);
            const newBookState = freshBooks.find(b => Number(b.id) === trackingBookId);

            // If the book was previously Borrowed, but the Admin turned it back to Available
            if (oldBookState && oldBookState.status === "Borrowed" && newBookState && newBookState.status === "Available") {
                triggerDenialNotification(newBookState.title);
                trackingBookId = null;
                localStorage.removeItem("trackedBookId");
            }
        }
        // ----------------------------------------
        
        books = freshBooks;
        updateStats();
        loadFeaturedBook();
        displayBooks(books);
    } catch (err) {
        console.error("❌ Error loading books:", err);
    }
}

// Helper to trigger audio sound and notification popups
function triggerDenialNotification(bookTitle) {
    // 1. Play Warning Audio Synth
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime); // Warning chord tone
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (soundError) {
        console.log("Audio presentation blocked or unsupported by browser:", soundError);
    }

    // 2. Visual Browser Alert
    alert(`⚠️ Your borrowed status for "${bookTitle}" has been denied/reverted back to available by the librarian.`);
}

// Update stats
function updateStats(){
    if(totalBooks) totalBooks.textContent = books.length;
    if(totalGenres) totalGenres.textContent = new Set(books.map(book => book.genre)).size;
    if(totalAvailable) totalAvailable.textContent = books.filter(book => book.status === "Available").length;
    if(totalBorrowed) totalBorrowed.textContent = books.filter(book => book.status === "Borrowed").length;
}

// Load featured book
function loadFeaturedBook(){
    if(!books || books.length === 0 || !featuredBook) return;
    
    const featured = books[0];
    const bookId = featured.id;
    
    featuredBook.innerHTML = `
        <div class="book featured-card" style="cursor:pointer;">
            <img src="${featured.cover}" alt="${featured.title}" onerror="this.src='https://placehold.co/400x600?text=No+Cover'" style="cursor:pointer;">
            <div class="book-info">
                <h2>${featured.title}</h2>
                <p class="author">${featured.author}</p>
                <p class="series">${featured.genre}</p>
                <button class="borrow-btn">View Book</button>
            </div>
        </div>
    `;
    
    featuredBook.querySelector(".featured-card").addEventListener("click", () => openBook(bookId));
    featuredBook.querySelector(".borrow-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        openBook(bookId);
    });
}

// Display all books
function displayBooks(bookList){
    if(!library) return;
    
    library.innerHTML = "";
    const grouped = {};

    bookList.forEach(book => {
        if(!grouped[book.genre]){
            grouped[book.genre] = [];
        }
        grouped[book.genre].push(book);
    });

    Object.keys(grouped).sort().forEach(genre => {
        const section = document.createElement("section");
        section.className = "genre-section";
        section.innerHTML = `
            <h2 class="genre-heading">
                ${genre}
                <span>(${grouped[genre].length})</span>
            </h2>
            <div class="genre-grid"></div>
        `;

        const grid = section.querySelector(".genre-grid");
        
        grouped[genre].forEach(book => {
            const bookDiv = document.createElement("div");
            bookDiv.className = "book";
            bookDiv.style.cursor = "pointer";
            
            bookDiv.innerHTML = `
                <img src="${book.cover}" alt="${book.title}" onerror="this.src='https://placehold.co/400x600?text=No+Cover'" style="cursor:pointer;">
                <div class="book-info">
                    <h3>${book.title}</h3>
                    <p class="author">${book.author}</p>
                    <p class="series">${book.series || 'N/A'}</p>
                    <span class="${book.status === "Available" ? "available" : "borrowed"}">
                        ${book.status === "Available" ? "🟢 Available" : "🔴 Borrowed"}
                    </span>
                </div>
            `;
            
            bookDiv.addEventListener("click", () => {
                openBook(book.id);
            });
            
            grid.appendChild(bookDiv);
        });
        
        library.appendChild(section);
    });
}

// Open book modal
function openBook(id){
    const numId = Number(id);
    const book = books.find(b => Number(b.id) === numId);
    
    if(!book) return;
    if(!modal || !modalBody) return;
    
    selectedBookId = id;
    selectedBook = book;
    
    modalBody.innerHTML = `
        <img src="${book.cover}" alt="${book.title}" onerror="this.src='https://placehold.co/400x600?text=No+Cover'">
        <div class="modal-details">
            <h2>${book.title}</h2>
            <h3>${book.author}</h3>
            <p><strong>Genre:</strong> ${book.genre}</p>
            <p><strong>Series:</strong> ${book.series || 'N/A'}</p>
            <p><strong>Volume:</strong> ${book.volume || 'N/A'}</p>
            <p><strong>Status:</strong> ${book.status === "Available" ? "<span class='available'>🟢 Available</span>" : "<span class='borrowed'>🔴 Borrowed</span>"}</p>
            <p class="summary">${book.summary || 'No summary available.'}</p>
            <button class="borrow-btn" onclick="openRequestModal()">Request Book</button>
        </div>
    `;
    
    modal.classList.remove("hidden");
}

// Open request modal
function openRequestModal() {
    const requestModal = document.getElementById("requestModal");
    if (!requestModal || !selectedBook) return;
    
    document.getElementById("reqBookTitle").textContent = selectedBook.title;
    document.getElementById("reqBookAuthor").textContent = selectedBook.author;
    
    const statusEl = document.getElementById("reqBookStatus");
    statusEl.textContent = selectedBook.status === "Available" ? "🟢 Available" : "🔴 Borrowed";
    statusEl.className = selectedBook.status === "Available" ? "available" : "borrowed";
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("reqRequestDate").value = today;
    
    requestModal.classList.remove("hidden");
}

// Close request modal
function closeRequestModal() {
    const requestModal = document.getElementById("requestModal");
    if (requestModal) {
        requestModal.classList.add("hidden");
    }
}

// Submit request
async function submitRequest() {
    const phone = document.getElementById("reqPhone").value.trim();
    const name = document.getElementById("reqName").value.trim();
    const className = document.getElementById("reqClass").value.trim();
    const section = document.getElementById("reqSection").value.trim();
    const returnDate = document.getElementById("reqReturnDate").value;

    if (!name || !className || !section || !returnDate) {
        alert("Please fill all fields");
        return;
    }
    // Prevent borrowing the same book twice
    if (selectedBook.status === "Borrowed") {
        alert("❌ This book has already been borrowed.");
        return;
    }
    onst alreadyBorrowed = books.find(book =>
        book.status === "Borrowed" &&
        (
            book.borrower.toLowerCase() === name.toLowerCase() ||
            String(book.phone) === phone
        )
    );

    if (alreadyBorrowed) {
        alert("❌ You already have a borrowed book. Please return it before borrowing another.");
        return;
    }

    try {

        selectedBook.status = "Borrowed";
        selectedBook.borrower = name;
        selectedBook.dueDate = returnDate;
        selectedBook.phone = phone;

        await editBook(selectedBook);
        // FIX: Directly call editBook from api.js using the title and changing status to 'Borrowed'
        
        
        // Save the tracked book ID in the user's browser memory
        trackingBookId = Number(selectedBookId);
        localStorage.setItem("trackedBookId", trackingBookId);

        alert("✅ Book successfully borrowed!");
        
        document.getElementById("reqName").value = "";
        document.getElementById("reqClass").value = "";
        document.getElementById("reqSection").value = "";
        document.getElementById("reqReturnDate").value = "";
        
        closeRequestModal();
        modal.classList.add("hidden");
        await loadBooks();
    } catch (err) {
        console.error("❌ Error:", err);
        alert("Error borrowing book");
    }
}

// Close modal
if(closeModal){
    closeModal.onclick = () => {
        modal.classList.add("hidden");
    };
}

// Close modal when clicking outside
window.onclick = (e) => {
    if(modal && e.target === modal){
        modal.classList.add("hidden");
    }
    const requestModal = document.getElementById("requestModal");
    if(requestModal && e.target === requestModal){
        closeRequestModal();
    }
};

// Search
if(search){
    search.addEventListener("input", () => {
        const value = search.value.toLowerCase();
        const featured = document.querySelector(".featured");
        
        if(value.length > 0){
            if(featured) featured.style.display = "none";
        } else {
            if(featured) featured.style.display = "block";
        }

        const filtered = books.filter(book =>
            book.title.toLowerCase().includes(value) ||
            book.author.toLowerCase().includes(value) ||
            book.genre.toLowerCase().includes(value) ||
            (book.series && book.series.toLowerCase().includes(value))
        );
        displayBooks(filtered);
    });
}

// Start auto-checking updates every 10 seconds to catch denial status changes
setInterval(loadBooks, 10000);

// Load on page load
document.addEventListener("DOMContentLoaded", loadBooks);
