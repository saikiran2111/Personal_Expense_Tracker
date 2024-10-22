// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const saltRounds = 10; 
const secretKey = 'personal_tracker_key'; 


// Initialize the express application
const app = express();
const port = 3000;   //Port for server to listen on

// Middleware to parse JSON requests
app.use(bodyParser.json());


// Home route
app.get('/', (req, res) => {
  res.send('Personal Expense Tracker API');
});

//Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});



// Required validations for transactions data
const transactionSchema = Joi.object({
  type: Joi.string().valid('income', 'expense').required(),
  category: Joi.string().required(),
  amount: Joi.number().positive().required(),
  date: Joi.date().iso().required(),
  description: Joi.string().optional()
});




// User registration endpoint
app.post('/register', (req, res) => {
    const { username, password } = req.body;  //Destructure username and password from request body

    //check if username and password provided
    if (!username || !password) {
        return res.status(400).json({ error: 'Please provide username and password.' });
    }

    // Check if the username already exists
    const checkUserSql = 'SELECT * FROM users WHERE username = ?';
    db.get(checkUserSql, [username], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: 'Username already exists.' });
        }

        // Hash the password
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) {
                return res.status(500).json({ error: err.message });  //Handle hashing errors
            }

            // Insert new user into the database
            const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
            db.run(sql, [username, hash], function (err) {
                if (err) {
                    return res.status(500).json({ error: err.message });    //Handle insertion errors
                }
                res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
            });
        });
    });
});



// User login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;  //Destructure username and password from request body

    //check if username and password provided
    if (!username || !password) {
        return res.status(400).json({ error: 'Please provide username and password.' });
    }

    // SQL query to find the user
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });   //Handle SQL errors
        }
        if (!row) {
            return res.status(401).json({ error: 'Invalid username or password.' }); // If user not found, return error
        }

        
        // Compare the provided password with the hashed password stored in the database
        bcrypt.compare(password, row.password, (err, match) => {
            if (err) {
                return res.status(500).json({ error: err.message }); // Handle comparison errors
            }
            if (!match) {
                return res.status(401).json({ error: 'Invalid username or password.' });  // If passwords don't match, return error
            }

            // Create a JWT token for the user
            const token = jwt.sign({ userId: row.id }, secretKey, { expiresIn: '1h' }); // Token expires in 1 hour
            res.json({ message: 'Login successful', token }); // Respond with success message and token
        });
    });
});


// Middleware for JWT authentication
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token from the Authorization header

    if (!token) {
        return res.sendStatus(403);  // If no token, return forbidden status
    }

    // Verify the token
    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.sendStatus(403);   // If verification fails, return forbidden status
        }
        req.user = user; // Attach user info to request object
        next();          // Call next middleware
    });
};


// REST APIs


// Add a new transaction with Joi validation
app.post('/transactions', authenticateJWT, (req, res) => {
    const { error } = transactionSchema.validate(req.body); // Validate transaction data

    if (error) {
        return res.status(400).json({ error: error.details[0].message });  // If validation fails, return error
    }
    const { type, category, amount, date, description } = req.body;   // Destructure transaction data
    const userId = req.user.userId; // Get userId from the token
    const sql = `INSERT INTO transactions (user_id, type, category, amount, date, description) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [userId, type, category, amount, date, description || ''];   // Prepare parameters for SQL query

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });    // Handle SQL errors
        }
        res.status(201).json({
            message: 'Transaction added successfully',
            transactionId: this.lastID,    // Respond with success message and transaction ID
        });
    });
});



// Add multiple transactions
app.post('/transactions/batch', (req, res) => {
    const transactions = req.body.transactions;     // Get transactions from request body

    // Check if transactions are provided and are in an array
    if (!Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({ error: 'Please provide an array of transactions.' });
    }

    const sql = `INSERT INTO transactions (type, category, amount, date, description) VALUES (?, ?, ?, ?, ?)`;
    const promises = transactions.map(transaction => {
        const { type, category, amount, date, description } = transaction;   // Destructure each transaction

        // Validate transaction data
        if (!type || !category || !amount || !date) {
            return Promise.reject('Invalid transaction data');   // Return error if invalid data
        }

        // Insert transaction into the database
        return new Promise((resolve, reject) => {
            db.run(sql, [type, category, amount, date, description || ''], function (err) {
                if (err) {
                    reject(err.message);     // Reject promise if error occurs
                } else {
                    resolve(this.lastID);    // Resolve with transaction ID
                }
            });
        });
    });

    // Handle the results of all promises
    Promise.all(promises)
        .then(ids => {
            res.status(201).json({
                message: 'Transactions added successfully',
                transactionIds: ids,  // Respond with success message and array of transaction IDs
            });
        })
        .catch(err => {
            res.status(500).json({ error: err });
        });
});




// Get all transactions with pagination and filtering
app.get('/transactions', authenticateJWT, (req, res) => {
    const { page = 1, limit = 10, type, category, startDate, endDate } = req.query;   // Destructure query parameters
  
    // Parse page and limit to integers
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const offset = (parsedPage - 1) * parsedLimit;     // Calculate offset for pagination
  
    // Base SQL query for fetching transactions
    let sql = 'SELECT * FROM transactions WHERE 1=1';  
    const params = [];   // Array for storing query parameters
  
    // Apply filters
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }
  
    sql += ' LIMIT ? OFFSET ?';          // Apply limit and offset for pagination
    params.push(parsedLimit, offset);    // Add limit and offset to parameters
  
    // Execute SQL query to fetch transactions
    db.all(sql, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
  
      // Fetch total count for pagination metadata
      db.get(`SELECT COUNT(*) AS count FROM transactions WHERE 1=1` + 
             (type ? ' AND type = ?' : '') + 
             (category ? ' AND category = ?' : '') + 
             (startDate ? ' AND date >= ?' : '') + 
             (endDate ? ' AND date <= ?' : ''), params.slice(0, -2), (err, countRow) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
  
        const total = countRow.count;
        const totalPages = Math.ceil(total / parsedLimit);
  
        res.json({                            // Respond with the fetched transactions
          transactions: rows,
          currentPage: parsedPage,
          totalPages: totalPages,
          totalTransactions: total,
        });
      });
    });
});
  
  
  

// Get a transaction by ID
app.get('/transactions/:id', (req, res) => {
    const { id } = req.params;                                 // Destructure id from request parameters
    const sql = 'SELECT * FROM transactions WHERE id = ?';     // SQL query to fetch a transaction by ID
    db.get(sql, [id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Transaction not found' });     // If transaction not found, return error
      }
      res.json({ transaction: row });     // Respond with the found transaction
    });
});

  

// Update a transaction by ID with Joi validation
app.put('/transactions/:id', (req, res) => {
    const { error } = transactionSchema.validate(req.body);       // Validate transaction data
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });      // If validation fails, return error
    }
  
    const { id } = req.params;
    const { type, category, amount, date, description } = req.body;           // Destructure transaction data
  
    const sql = `UPDATE transactions SET type = ?, category = ?, amount = ?, date = ?, description = ? WHERE id = ?`;
    const params = [type, category, amount, date, description || '', id];         // Prepare parameters for SQL query
  
    db.run(sql, params, function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transaction not found' });        // If no transaction was updated, return error
      }
      res.json({ message: 'Transaction updated successfully' });                // Respond with success message
    });
});

  
// Delete a transaction by ID
app.delete('/transactions/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM transactions WHERE id = ?';       // SQL query to delete a transaction by ID
    db.run(sql, id, function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transaction not found' });       // If no transaction was deleted, return error
      }
      res.json({ message: 'Transaction deleted successfully' });               // Respond with success message
    });
});


// Get summary of transactions
app.get('/summary', (req, res) => {
    const sqlIncome = 'SELECT SUM(amount) AS totalIncome FROM transactions WHERE type = "income"';   // SQL query to calculate the total income from transactions  
    const sqlExpense = 'SELECT SUM(amount) AS totalExpense FROM transactions WHERE type = "expense"';  // SQL query to calculate the total expenses from transactions
  
    // Object to hold the summary data
    let summary = {};
    
    // Get total income from the database
    db.get(sqlIncome, [], (err, incomeRow) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      // Assign total income to the summary object; default to 0 if no income found
      summary.totalIncome = incomeRow.totalIncome || 0;
  
      // Get total expenses from the databas
      db.get(sqlExpense, [], (err, expenseRow) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        // Assign total expenses to the summary object; default to 0 if no expenses found
        summary.totalExpense = expenseRow.totalExpense || 0;
        // Calculate the balance by subtracting total expenses from total income
        summary.balance = summary.totalIncome - summary.totalExpense;
  
        // Respond with the summary object containing total income, total expenses, and balance
        res.json(summary);
      });
    });
});









  
  