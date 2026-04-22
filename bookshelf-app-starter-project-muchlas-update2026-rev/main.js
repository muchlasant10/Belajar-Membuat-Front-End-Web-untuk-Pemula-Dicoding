// Inisialisasi key untuk localStorage
const STORAGE_KEY = "BOOKSHELF_APP";

// Menampung data buku dalam array
let books = [];

// Elemen form tambah buku
const bookForm = document.getElementById("bookForm");
const incompleteBookList = document.getElementById("incompleteBookList");
const completeBookList = document.getElementById("completeBookList");
const searchBookForm = document.getElementById("searchBook");
const searchBookTitle = document.getElementById("searchBookTitle");

// Variabel Cancel Edit Button
const cancelEditButton = document.getElementById("cancelEditButton");

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 1500,
  timerProgressBar: true,
});

// Variabel untuk edit mode
let editingBookId = null;

// Fungsi utama
document.addEventListener("DOMContentLoaded", () => {
  // Muat data dari localStorage
  loadBooksFromStorage();

  // Menangani event SUBMIT/SIMPAN pada form tambah buku
  bookForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = document.getElementById("bookFormTitle").value;
    const author = document.getElementById("bookFormAuthor").value;
    const year = parseInt(document.getElementById("bookFormYear").value);
    const isComplete = document.getElementById("bookFormIsComplete").checked;

    // Tampilkan Loading Penyimpanan
    let timerInterval;

    Swal.fire({
      title: editingBookId ? "Memperbarui buku..." : "Menyimpan buku...",
      html: "Harap tunggu dalam <b></b> milliseconds.",
      timer: 2000,
      timerProgressBar: true,
      allowOutsideClick: false,

      didOpen: () => {
        Swal.showLoading();

        const b = Swal.getPopup().querySelector("b");

        timerInterval = setInterval(() => {
          b.textContent = Swal.getTimerLeft();
        }, 100);
      },

      willClose: () => {
        clearInterval(timerInterval);
      }

    }).then((result) => {

      // Jalankan Proses Simpan Setelah Loading Selesai
      if (result.dismiss === Swal.DismissReason.timer) {
        let lastBookId;

        if (editingBookId) {
          updateBook(editingBookId, { title, author, year, isComplete });
          lastBookId = editingBookId;
          editingBookId = null;
        } else {
          const bookId = Date.now();
          const newBook = { id: bookId, title, author, year, isComplete };
          books.push(newBook);
          lastBookId = bookId;
        }

        saveBooksToStorage();
        renderBooks();

        setTimeout(() => {
          scrollToBook(lastBookId);
        }, 100);

        bookForm.reset();
        updateSubmitButtonText();

        document.getElementById("formAddEdit").textContent = "Tambah Buku Baru";

        // Sembunyikan Cancel Edit Button
        cancelEditButton.style.display = "none";

        Toast.fire({
          icon: 'success',
          title: 'Buku berhasil disimpan'
        });
      }
    });
  });
  
  // Menangani event submit pada form pencarian buku
  searchBookForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = searchBookTitle.value.toLowerCase();
    const filteredBooks = books.filter((book) =>
      book.title.toLowerCase().includes(query)
    );
    renderBooks(filteredBooks);
  });
});

// Fungsi untuk mengubah submit button ketika checkbox "selesai dibaca" dicentang
function updateSubmitButtonText() {
  const IsCompleteCheckbox = document.getElementById("bookFormIsComplete");
  const submitButton = document.getElementById("bookFormSubmit");

    if (IsCompleteCheckbox.checked) {
      submitButton.innerHTML = "Masukkan Buku ke rak <span> Selesai dibaca </span>";
    } else {
      submitButton.innerHTML = "Masukkan Buku ke rak <span>Belum selesai dibaca</span>";
    }
  };

document.getElementById("bookFormIsComplete").addEventListener("change", updateSubmitButtonText);

// Fungsi untuk menyimpan data ke localStorage
function saveBooksToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

// Fungsi untuk memuat data dari localStorage
function loadBooksFromStorage() {
  const storedBooks = localStorage.getItem(STORAGE_KEY);
  if (storedBooks) {
    books = JSON.parse(storedBooks);
  }
  renderBooks();
}

// Fungsi untuk merender daftar buku
function renderBooks(filteredBooks = null) {
  incompleteBookList.innerHTML = "";
  completeBookList.innerHTML = "";

  (filteredBooks || books).forEach((book) => {
    const bookElement = createBookElement(book);
    if (book.isComplete) {
      completeBookList.appendChild(bookElement);
    } else {
      incompleteBookList.appendChild(bookElement);
    }
  });
}

// Membuat elemen buku
function createBookElement(book) {
  const bookItem = document.createElement("div");
  bookItem.setAttribute("data-bookid", book.id);
  bookItem.setAttribute("data-testid", "bookItem");
  bookItem.className = book.isComplete
    ? "book_item c"
    : "book_item i";
  const titleElement = document.createElement("h3");
  titleElement.textContent = book.title;
  titleElement.setAttribute("data-testid", "bookItemTitle");

  const authorElement = document.createElement("p");
  authorElement.textContent = `Penulis: ${book.author}`;
  authorElement.setAttribute("data-testid", "bookItemAuthor");

  const yearElement = document.createElement("p");
  yearElement.textContent = `Tahun: ${book.year}`;
  yearElement.setAttribute("data-testid", "bookItemYear");

  const buttonContainer = document.createElement("div");
  buttonContainer.setAttribute("class", "button_list");

  const toggleCompleteButton = document.createElement("button");
  toggleCompleteButton.textContent = book.isComplete
    ? "  Belum selesai dibaca"
    : "  Selesai dibaca";
  toggleCompleteButton.setAttribute("data-testid", "bookItemIsCompleteButton");
  toggleCompleteButton.className = book.isComplete
    ? "btn incomplete"
    : "btn complete";
  toggleCompleteButton.addEventListener("click", () => toggleBookStatus(book.id));

  const iconOpen = document.createElement('i');
  iconOpen.classList.add('fas', 'fa-folder-open');
 
  const iconClose = document.createElement('i');
  iconClose.classList.add('fas', 'fa-folder');
 
  if (book.isComplete) {
    toggleCompleteButton.prepend(iconClose);
  } else {
    toggleCompleteButton.prepend(iconOpen);
  }

  const editButton = document.createElement("button");
  editButton.textContent = "  Edit Buku";
  editButton.setAttribute("data-testid", "bookItemEditButton");
  editButton.className = "btn edit";
  editButton.addEventListener("click", () => editBook(book.id));

  const iconEdit = document.createElement('i');
  iconEdit.classList.add('fas', 'fa-edit');
  editButton.prepend(iconEdit);


  const deleteButton = document.createElement("button");
  deleteButton.textContent = "  Hapus Buku";
  deleteButton.setAttribute("data-testid", "bookItemDeleteButton");
  deleteButton.className = "btn delete";
  deleteButton.addEventListener("click", () => deleteBook(book.id));

  const iconDelete = document.createElement('i');
  iconDelete.classList.add('fas', 'fa-trash-alt');
  deleteButton.prepend(iconDelete);

  buttonContainer.appendChild(toggleCompleteButton);
  buttonContainer.appendChild(editButton);
  buttonContainer.appendChild(deleteButton);

  bookItem.appendChild(titleElement);
  bookItem.appendChild(authorElement);
  bookItem.appendChild(yearElement);
  bookItem.appendChild(buttonContainer);

  return bookItem;
}

// Fungsi untuk mengganti status buku
function toggleBookStatus(bookId) {
  const book = books.find((b) => b.id === bookId);

  Swal.fire({
    title: book.isComplete 
      ? "Pindahkan ke rak belum selesai dibaca?"
      : "Tandai sebagai selesai dibaca?",
    text: "Status buku akan berubah",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#68ce8d",
    confirmButtonText: "Ya",
    cancelButtonColor: "#db5959",
    cancelButtonText: "Batalkan",
    customClass: {
      confirmButton: 'btn-confirm',
      cancelButton: 'btn-cancel'
    },
  }).then((result) => {
    if (result.isConfirmed) {

      book.isComplete = !book.isComplete;
      saveBooksToStorage();
      renderBooks();

      Toast.fire({
        icon: 'success',
        title: book.isComplete
          ? 'Tandai sebagai selesai dibaca'
          : 'Dipindahkan ke rak belum selesai dibaca'
      });
    }
  });
}

// Fungsi untuk menghapus buku
function deleteBook(bookId) {
  Swal.fire({
    title: "Apakah Anda yakin ingin menghapus buku ini?",
    text: "Data tidak bisa dikembalikan setelah dihapus!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#68ce8d",
    confirmButtonText: "Ya, hapus!",
    cancelButtonColor: "#db5959",
    cancelButtonText: "Batalkan",
    customClass: {
      confirmButton: 'btn-confirm',
      cancelButton: 'btn-cancel'
    },
    // buttonsStyling: false
  }).then((result) => {
    if (result.isConfirmed) {

      books = books.filter((b) => b.id !== bookId);
      saveBooksToStorage();
      renderBooks();

      Toast.fire({
        icon: 'success',
        title: 'Buku berhasil dihapus'
      });

    } else {
      Toast.fire({
        icon: 'info',
        title: 'Penghapusan dibatalkan'
      });
    }
  });
}

// Fungsi untuk mengedit buku
function editBook(bookId) {
  const book = books.find((b) => b.id === bookId);
  if (book) {
    document.getElementById("bookFormTitle").value = book.title;
    document.getElementById("bookFormAuthor").value = book.author;
    document.getElementById("bookFormYear").value = book.year;
    document.getElementById("bookFormIsComplete").checked = book.isComplete;

    updateSubmitButtonText();

    editingBookId = bookId;

    document.getElementById("formAddEdit").textContent = "Edit Buku";

    // Scroll ke form
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    // Fokus ke input
    setTimeout(() => {
      const input = document.getElementById("bookFormTitle");
      input.focus({ preventScroll: true });

      // Kursor ke belakang
      input.setSelectionRange(input.value.length, input.value.length);
    }, 500);

    // Tampilkan Cancel Edit Button
    cancelEditButton.style.display = "inline-block";

    Toast.fire({
      icon: 'info',
      title: 'Mode edit aktif'
    });
  }  
}

// Fungsi Cancel Edit Button
cancelEditButton.addEventListener("click", () => {
  
  bookForm.reset();
  updateSubmitButtonText();

  editingBookId = null;
  
  // kembalikan judul
  document.getElementById("formAddEdit").textContent = "Tambah Buku Baru";  

  // sembunyikan tombol batal
  cancelEditButton.style.display = "none";

  // notifikasi
  Toast.fire({
    icon: 'info',
    title: 'Edit dibatalkan'
  });
});

// Fungsi untuk memperbarui buku
function updateBook(bookId, updatedData) {
  books = books.map((b) =>
    b.id === bookId ? { ...b, ...updatedData } : b
  );
}

// Fungsi Scroll ke buku yang dibuat/edit
function scrollToBook(bookId) {
  const book = document.querySelector(`[data-bookid="${bookId}"]`);
  if (book) {
    book.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    // HIGHLIGHT untuk menandai buku
    book.style.transition = "0.3s";
    book.style.backgroundColor = "#d1fae5";

    setTimeout(() => {
      book.style.backgroundColor = "";
    }, 1500);
  }
}

const scrollTopButton = document.getElementById("scrollTopButton");

// tampilkan tombol saat scroll ke bawah
window.addEventListener("scroll", () => {
  if (window.scrollY > 200) {
    scrollTopButton.style.opacity = "1";
    scrollTopButton.style.pointerEvents = "auto";
  } else {
    scrollTopButton.style.opacity = "0";
    scrollTopButton.style.pointerEvents = "none";
  }
});

// klik tombol → scroll ke atas
scrollTopButton.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
  
});