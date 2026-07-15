/* ==========================================
   Hridhaan Public Library
   Admin Panel
========================================== */

const ADMIN_PASSWORD = "Tuff@6769"; // CHANGE THIS
let currentReturnBook = null;
let previousRequestCount = 0;
let books = [];
let filteredBooks = [];
let requests = [];
let deleteBookId = null;
let editingBookId = null;

/* ==========================================
   LOGIN
========================================== */
function openReturnModal(book){

    currentReturnBook = book;

    document.getElementById("returnBook").innerHTML =
        `<strong>${book.title}</strong><br><br>
        Borrower: ${book.borrower}`;

    document
        .getElementById("returnModal")
        .classList.remove("hidden");

}

function closeReturnModal(){

    document
        .getElementById("returnModal")
        .classList.add("hidden");

}
function login(){

    const password =
        document.getElementById("password").value;

    const error =
        document.getElementById("loginError");

    if(password === ADMIN_PASSWORD){

        document.getElementById("loginScreen").style.display = "none";

        document.getElementById("dashboard").style.display = "block";

        loadBooks();
        loadRequests();

    }

    else{

        error.textContent = "Incorrect Password";

    }

}

/* ==========================================
   LOAD BOOKS & REQUESTS
========================================== */

async function loadBooks(){

    try{

        books = await getBooks();
        filteredBooks = [...books];

        updateStats();
        renderBooks();
        renderBorrowedBooks();

    }

    catch(err){

        console.error(err);

        alert("Couldn't load books.");
    }
}

async function loadRequests(){

    try{
        console.log("📥 Loading requests...");
        const data = await getRequests();
        // Play sound only if NEW requests arrived
    if (
        previousRequestCount !== 0 &&
        data.length > previousRequestCount
    ) {      
        playNotification();
    }

previousRequestCount = requests.length;
        requests = data;
        console.log("✅ Requests loaded:", requests.length);
        console.log("📋 Requests data:", requests);
        renderPendingRequests();
    }
    catch(err){
        console.error("❌ Error loading requests:", err);
        requests = [];
        renderPendingRequests();
    }
}

/* ==========================================
   STATS
========================================== */

function updateStats(){

    const bookCountEl = document.getElementById("bookCount");
    const availableCountEl = document.getElementById("availableCount");
    const borrowedCountEl = document.getElementById("borrowedCount");
    
    if(bookCountEl) bookCountEl.textContent = books.length;
    if(availableCountEl) availableCountEl.textContent = books.filter(book=>book.status==="Available").length;
    if(borrowedCountEl) borrowedCountEl.textContent = books.filter(book=>book.status==="Borrowed").length;
}

/* ==========================================
   RENDER PENDING REQUESTS
========================================== */

function renderPendingRequests(){

    const tbody = document.getElementById("requestsTable");
    
    if(!tbody){
        console.error("requestsTable element not found");
        return;
    }

    tbody.innerHTML = "";

    if(!requests || requests.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:20px;'>No pending requests</td></tr>";
        return;
    }

    requests.forEach((req, index) => {
        const book = books.find(b => Number(b.id) === Number(req.bookId));
        const bookTitle = book ? book.title : "Unknown Book";
        
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${req.name}</td>
            <td>${req.class}</td>
            <td>${bookTitle}</td>
            <td>${req.returnDate || 'N/A'}</td>
            <td>
                <button class="approve-btn" onclick="approveRequest(${index})">Approve</button>
                <button class="reject-btn" onclick="rejectRequest(${index})">Reject</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/* ==========================================
   APPROVE REQUEST
========================================== */

async function approveRequest(index){
    const req = requests[index];
    const book = books.find(b => Number(b.id) === Number(req.bookId));
    
    if(!book) {
        alert("❌ Book not found");
        return;
    }
    
    try {
        console.log("✅ Approving request for book:", book.title);
        
        // Update book status to Borrowed
        book.status = "Borrowed";
        book.borrower = req.name;
        book.dueDate = req.returnDate;
        
        await editBook(book);
        
        // Remove from requests array
        requests.splice(index, 1);
        
        alert("✅ Request approved! Book marked as borrowed.");
        
        // Reload everything
        loadBooks();
        loadRequests();
    } catch(err) {
        console.error("❌ Error approving request:", err);
        alert("Error: " + err.message);
    }
}

/* ==========================================
   REJECT REQUEST
========================================== */

async function rejectRequest(index){
    if(!confirm("Reject this request?")) return;
    
    try {
        requests.splice(index, 1);
        alert("❌ Request rejected");
        renderPendingRequests();
    } catch(err) {
        console.error("❌ Error rejecting request:", err);
        alert("Error: " + err.message);
    }
}

/* ==========================================
   SAVE REQUESTS
========================================== */

async function saveRequests(requestsList){
    try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbyHqEXt6DH4A_zJcSWRq_hYdzFVNrTU8NR5VELJBbio3nAX8M2lMkxfqLcIbTK4DuYG/exec", {
            method: "POST",
            body: JSON.stringify({
                action: "saveRequests",
                requests: requestsList
            })
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || "Failed to save requests");
        }
        return result;
    } catch(err) {
        console.error("Error saving requests:", err);
        throw err;
    }
}

/* ==========================================
   TABLE
========================================== */

function renderBooks(){

    const tbody = document.getElementById("bookTable");
    
    if(!tbody){
        console.error("bookTable element not found");
        return;
    }

    tbody.innerHTML = "";

    filteredBooks.forEach(book => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><img src="${book.cover}" alt="${book.title}" style="width:40px;height:60px;object-fit:cover;border-radius:4px;"></td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.genre}</td>
            <td><span class="${book.status==="Available"?"available":"borrowed"}">${book.status}</span></td>
            <td>
                <button class="edit-btn" onclick="openEditModal(${book.id})">Edit</button>
                <button class="delete-btn" onclick="openDeleteModal(${book.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/* ==========================================
   BORROWED BOOKS TABLE
========================================== */

function renderBorrowedBooks(){

    const tbody = document.getElementById("borrowedTable");
    
    if(!tbody){
        console.error("borrowedTable element not found");
        return;
    }

    tbody.innerHTML = "";

    const borrowedBooks = books.filter(book => book.status === "Borrowed");
    
    if(borrowedBooks.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:20px;'>No borrowed books</td></tr>";
        return;
    }

    borrowedBooks.forEach(book => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.borrower || 'N/A'}</td>
            <td>${book.dueDate || 'N/A'}</td>
            <td>
                <button class="return-btn" onclick="markAsAvailable(${book.id})">Mark Available</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/* ==========================================
   MARK AS AVAILABLE
========================================== */

async function markAsAvailable(bookId) {

    const book = books.find(b => b.id === bookId);

    if(!book) return;

    openReturnModal(book);

}
setInterval(loadBooks,60000); // Refresh books every 60 secondsS
async function returnedNormally() {

    currentReturnBook.status = "Available";
    currentReturnBook.borrower = "";
    currentReturnBook.dueDate = "";
    currentReturnBook.phone = "";

    await editBook(currentReturnBook);

    closeReturnModal();

    alert("Book marked as available!");

    loadBooks();

}
async function borrowCancelled() {

    console.log(currentReturnBook);

    const phone = String(currentReturnBook.phone|| "").replace(/\D/g, "");

    const message =
    `Hello ${currentReturnBook.borrower},

    Unfortunately your borrowing of "${currentReturnBook.title}" has been cancelled.

    The book is now available again.

    - Hridhaan Public Library`;

    window.open(
        `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`,
        "_blank"
    );

    currentReturnBook.status = "Available";
    currentReturnBook.borrower = "";
    currentReturnBook.dueDate = "";
    currentReturnBook.phone = "";

    await editBook(currentReturnBook);

    closeReturnModal();

    loadBooks();

}

/* ==========================================
   SEARCH
========================================== */

function searchBooks(){

    const searchBooksEl = document.getElementById("searchBooks");
    if(!searchBooksEl) return;
    
    const query = searchBooksEl.value.toLowerCase();
    filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.genre.toLowerCase().includes(query)
    );
    renderBooks();
}

/* ==========================================
   ADD BOOK MODAL
========================================== */

function openAddModal(){

    editingBookId = null;
    document.getElementById("modalTitle").textContent = "Add New Book";
    document.getElementById("bookTitle").value = "";
    document.getElementById("bookAuthor").value = "";
    document.getElementById("bookGenre").value = "";
    document.getElementById("bookStatus").value = "Available";
    document.getElementById("bookCover").value = "";
    document.getElementById("bookSummary").value = "";
    document.getElementById("bookSeries").value = "";
    document.getElementById("bookVolume").value = "";
    document.getElementById("bookModal").classList.remove("hidden");
}

function closeBookModal(){

    document.getElementById("bookModal").classList.add("hidden");
}

async function saveBook(){

    const bookData = {
        title: document.getElementById("bookTitle").value,
        author: document.getElementById("bookAuthor").value,
        genre: document.getElementById("bookGenre").value,
        status: document.getElementById("bookStatus").value,
        cover: document.getElementById("bookCover").value,
        summary: document.getElementById("bookSummary").value,
        series: document.getElementById("bookSeries").value,
        volume: document.getElementById("bookVolume").value
    };

    if(!bookData.title || !bookData.author){
        alert("Please fill in title and author");
        return;
    }

    try{
        if(editingBookId){
            bookData.id = editingBookId;
            await editBook(bookData);
            alert("Book updated!");
        }
        else{
            await addBook(bookData);
            alert("Book added!");
        }
        closeBookModal();
        loadBooks();
    }
    catch(err){
        console.error(err);
        alert("Error: " + err);
    }
}

/* ==========================================
   EDIT BOOK MODAL
========================================== */

function openEditModal(bookId){

    const book = books.find(b => b.id === bookId);
    if(!book) return;

    editingBookId = bookId;
    document.getElementById("modalTitle").textContent = "Edit Book";
    document.getElementById("bookTitle").value = book.title;
    document.getElementById("bookAuthor").value = book.author;
    document.getElementById("bookGenre").value = book.genre;
    document.getElementById("bookStatus").value = book.status;
    document.getElementById("bookCover").value = book.cover;
    document.getElementById("bookSummary").value = book.summary || "";
    document.getElementById("bookSeries").value = book.series || "";
    document.getElementById("bookVolume").value = book.volume || "";
    document.getElementById("bookModal").classList.remove("hidden");
}

/* ==========================================
   DELETE BOOK MODAL
========================================== */

function openDeleteModal(bookId){

    deleteBookId = bookId;
    document.getElementById("deleteModal").classList.remove("hidden");
}

function closeDeleteModal(){

    document.getElementById("deleteModal").classList.add("hidden");
}

async function confirmDelete(){

    try{
        await deleteBook(deleteBookId);
        alert("Book deleted!");
        closeDeleteModal();
        loadBooks();
    }
    catch(err){
        console.error(err);
        alert("Error: " + err);
    }
}

/* ==========================================
   DOCUMENT READY
========================================== */

document.addEventListener("DOMContentLoaded", function(){
    const searchBooksEl = document.getElementById("searchBooks");
    if(searchBooksEl){
        searchBooksEl.addEventListener("input", searchBooks);
    }
    
    const closeModalEl = document.getElementById("closeModal");
    if(closeModalEl){
        closeModalEl.onclick = closeBookModal;
    }
    
    const closeDeleteModalEl = document.getElementById("closeDeleteModal");
    if(closeDeleteModalEl){
        closeDeleteModalEl.onclick = closeDeleteModal;
    }
});
function playNotification() {

    const audio = new Audio(
        "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
    );

    audio.volume = 0.5;

    audio.play().catch(() => {});

}
