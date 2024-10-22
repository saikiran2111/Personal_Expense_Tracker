const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./expenseTracker.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});


const initializeDatabase = () => {
  createTransactionsTable();
  createCategoriesTable();
  createUsersTable();
};


const createTransactionsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT CHECK(type IN ('income', 'expense')),
      category TEXT,
      amount REAL,
      date TEXT,
      description TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `;

  db.run(sql, (err) => {
    if (err) {
      console.error('Error creating transactions table:', err.message);
    }
  });
};



const createCategoriesTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL
    )
  `;

  db.run(sql, (err) => {
    if (err) {
      console.error('Error creating categories table:', err.message);
    }
  });
};


const createUsersTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `;

  db.run(sql, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    }
  });
};

module.exports = db;
