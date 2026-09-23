CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT UNIQUE,
    category_id INTEGER,
    publisher TEXT,
    publication_year INTEGER,
    description TEXT,
    total_copies INTEGER DEFAULT 0,
    available_copies INTEGER DEFAULT 0,
    shelf_location TEXT,
    cover_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('Student', 'Librarian', 'Admin')) NOT NULL,
    membership_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    account_status TEXT CHECK(account_status IN ('Active', 'Blocked', 'Pending')) DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    issue_date DATETIME NOT NULL,
    due_date DATETIME NOT NULL,
    return_date DATETIME,
    fine_amount REAL DEFAULT 0.0,
    status TEXT CHECK(status IN ('Active', 'Returned', 'Overdue')) DEFAULT 'Active',
    FOREIGN KEY (book_id) REFERENCES books(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS fines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_status TEXT CHECK(payment_status IN ('Unpaid', 'Paid')) DEFAULT 'Unpaid',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);
