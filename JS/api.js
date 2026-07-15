// Use the NEW deployment URL - it should end with /exec
const API_URL = "https://script.google.com/macros/s/AKfycbynf2z0M_ouROEr6u5tPImnb_7s3H7qclVb0wUetcBH0G-SoLIf4kQz9zT1YwYOY-3T/exec";

async function getBooks(){
    try {
        console.log("🔄 Fetching books from:", API_URL);
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            console.error("❌ HTTP Error:", response.status, response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("✅ Books fetched successfully:", data.length, "books");
        return data;
    } catch (err) {
        console.error("❌ Error fetching books:", err);
        throw err;
    }
}

async function getRequests(){
    try {
        console.log("🔄 Fetching requests from:", API_URL);
        const response = await fetch(API_URL + "?action=getRequests");
        
        if (!response.ok) {
            console.error("❌ HTTP Error:", response.status);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("✅ Requests fetched:", data);
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.error("❌ Error fetching requests:", err);
        return [];
    }
}

async function submitBookRequest(name, className, section, bookId, returnDate) {
    try {
        console.log("📤 Submitting request...");
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "addRequest",
                name: name,
                class: className,
                section: section,
                bookId: bookId,
                returnDate: returnDate
            })
        });
        const result = await response.json();
        console.log("📋 Request result:", result);
        if (!result.success) {
            throw new Error(result.message || "Request failed");
        }
        return result;
    } catch (err) {
        console.error("❌ Error submitting request:", err);
        throw err;
    }
}

async function addBook(bookData) {
    try {
        console.log("📚 Adding book...");
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "addBook",
                ...bookData
            })
        });
        const result = await response.json();
        console.log("✅ Add result:", result);
        if (!result.success) {
            throw new Error(result.message || "Failed to add book");
        }
        return result;
    } catch (err) {
        console.error("❌ Error adding book:", err);
        throw err;
    }
}

async function editBook(book) {

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            body: JSON.stringify({

                action: "editBook",

                id: book.id,
                title: book.title,
                author: book.author,
                genre: book.genre,
                status: book.status,
                borrower: book.borrower,
                dueDate: book.dueDate,
                cover: book.cover,
                summary: book.summary,
                series: book.series,
                volume: book.volume,
                phone: book.phone

            })

        });

        const result = await response.json();

        if(!result.success){
            throw new Error(result.message);
        }

        return result;

    }

    catch(err){

        console.error(err);
        throw err;

    }

}

async function deleteBook(bookId) {
    try {
        console.log("🗑️ Deleting book:", bookId);
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "deleteBook",
                id: bookId
            })
        });
        const result = await response.json();
        console.log("✅ Delete result:", result);
        if (!result.success) {
            throw new Error(result.message || "Failed to delete book");
        }
        return result;
    } catch (err) {
        console.error("❌ Error deleting book:", err);
        throw err;
    }
}