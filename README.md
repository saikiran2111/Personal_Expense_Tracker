# Personal Finance Tracker API

A RESTful API for managing personal financial records. Users can track their income and expenses, retrieve transaction history, and view financial summaries.

## Table of Contents
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Transaction Endpoints](#transaction-endpoints)
  - [Summary Endpoints](#summary-endpoints)
- [API Testing Screenshots](#api-testing-screenshots)

## Technologies Used
- Node.js
- Express.js (v4.21.1)
- SQLite3 (v5.1.7)
- JSON Web Token (v9.0.2)
- bcrypt (v5.1.1)
- Joi (v17.13.3)
- body-parser (v1.20.3)

## Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd personal-finance-tracker
```

2. Install dependencies
```bash
npm install
```

3. Set up the database
```bash
# The database will be automatically created when you start the application
# Initial tables will be created using the initialization scripts in database.js
```

## Running the Application

1. Start the server
```bash
node server.js
```

2. The server will start running at `http://localhost:3000`

## API Documentation

### Authentication Endpoints

#### Register User
- **URL**: `/register`
- **Method**: `POST`
- **Request Body**:
```json
{
    "username": "saikiran",
    "password": "password"
}
```
- **Success Response**: `201 Created`
```json
{
    "message": "User registered successfully",
    "userId": 1
}
```

#### Login
- **URL**: `/login`
- **Method**: `POST`
- **Request Body**:
```json
{
    "username": "saikiran",
    "password": "password"
}
```
- **Success Response**: `200 OK`
```json
{
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Transaction Endpoints

#### Create Transaction
- **URL**: `/transactions`
- **Method**: `POST`
- **Authentication**: Required (Bearer Token), which has been recieved using LOGIN
- **Request Body**:
```json
{
    "type": "income",
    "category": "salary",
    "amount": 5000,
    "date": "2024-03-15",
    "description": "Monthly salary"
}
```
- **Success Response**: `201 Created`
```json
{
    "message": "Transaction added successfully",
    "transactionId": 1
}
```

#### Get All Transactions
- **URL**: `/transactions`
- **Method**: `GET`
- **Authentication**: Required (Bearer Token), which has been recieved using LOGIN 
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)
  - `type` (optional): Filter by type (income/expense)
  - `category` (optional): Filter by category
  - `startDate` (optional): Filter by start date
  - `endDate` (optional): Filter by end date
- **Success Response**: `200 OK`
```json
{
    "transactions": [...],
    "currentPage": 1,
    "totalPages": 5,
    "totalTransactions": 48
}
```

#### Get Transaction by ID
- **URL**: `/transactions/:id`
- **Method**: `GET`
- **Authentication**: Required (Bearer Token), which has been recieved using LOGIN
- **Success Response**: `200 OK`
```json
{
    "transaction": {
        "id": 1,
        "type": "income",
        "category": "salary",
        "amount": 5000,
        "date": "2024-03-15",
        "description": "Monthly salary"
    }
}
```

#### Update Transaction
- **URL**: `/transactions/:id`
- **Method**: `PUT`
- **Authentication**: Required (Bearer Token), which has been recieved using LOGIN
- **Request Body**:
```json
{
    "type": "income",
    "category": "salary",
    "amount": 5500,
    "date": "2024-03-15",
    "description": "Monthly salary with bonus"
}
```
- **Success Response**: `200 OK`
```json
{
    "message": "Transaction updated successfully"
}
```

#### Delete Transaction
- **URL**: `/transactions/:id`
- **Method**: `DELETE`
- **Authentication**: Required (Bearer Token), which has been recieved using LOGIN
- **Success Response**: `200 OK`
```json
{
    "message": "Transaction deleted successfully"
}
```

#### Batch Create Transactions
- **URL**: `/transactions/batch`
- **Method**: `POST`
- **Authentication**: Required (Bearer Token), which has been recieved using LOGIN
- **Request Body**:
```json
{
    "transactions": [
        {
            "type": "expense",
            "category": "groceries",
            "amount": 100,
            "date": "2024-03-15",
            "description": "Weekly groceries"
        },
        {
            "type": "expense",
            "category": "utilities",
            "amount": 200,
            "date": "2024-03-15",
            "description": "Electricity bill"
        }
    ]
}
```
- **Success Response**: `201 Created`
```json
{
    "message": "Transactions added successfully",
    "transactionIds": [2, 3]
}
```

### Summary Endpoints

#### Get Financial Summary
- **URL**: `/summary`
- **Method**: `GET`
- **Authentication**: Required (Bearer Token), which has been recieved using LOGIN
- **Success Response**: `200 OK`
```json
{
    "totalIncome": 5000,
    "totalExpense": 300,
    "balance": 4700
}
```

## API Testing Screenshots

### Authentication Flow
![Register User](Flow%20Images/register.png)
*Figure 1: User Registration*

![Login User](Flow%20Images/login.png)
*Figure 2: User Login*

### Transaction Operations
![Token Authentication](Flow%20Images/auth.png)
*Figure 3: Entering User Token for JWT Authentication*

![Create Transactions](Flow%20Images/body.png)
*Figure 4: Adding new transaction*

![Get all Transaction](Flow%20Images/get_transactions.png)
*Figure 5: Get all Transactions*

![Get Transaction by ID](Flow%20Images/get_transactions_by_id.png)
*Figure 6: Get Transactions by ID*

![Update Transaction](Flow%20Images/update.png)
*Figure 7: Updating a Transaction by ID*

![Delete Transaction](Flow%20Images/delete.png)
*Figure 8: Deleting a Transaction by ID*

### Summary View
![Get Summary](Flow%20Images/summary.png)
*Figure 9: Viewing Financial Summary*

## Error Handling

The API uses standard HTTP response codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

Error responses follow this format:
```json
{
    "error": "Error message describing what went wrong"
}
```

## Security Considerations

1. All endpoints (except registration and login) require JWT authentication
2. Passwords are hashed using bcrypt before storage
3. Input validation is performed using Joi schema validation
4. SQL injection protection is implemented using parameterized queries

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details