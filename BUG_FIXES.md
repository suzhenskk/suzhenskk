# Bug Fixes Documentation

This document details 3 critical bugs found in the codebase and their fixes.

## Bug 1: SQL Injection Vulnerability

### Problem
The `getUserData` function was vulnerable to SQL injection attacks due to direct string concatenation when building SQL queries.

**Vulnerable Code:**
```javascript
function getUserData(username) {
    const query = "SELECT * FROM users WHERE username = '" + username + "'";
    return query;
}
```

**Attack Vector:**
An attacker could input `'; DROP TABLE users; --` as the username, which would result in:
```sql
SELECT * FROM users WHERE username = ''; DROP TABLE users; --'
```

### Fix
- Added input validation to ensure username is a valid string
- Implemented input sanitization to remove dangerous characters
- Used parameterized queries to prevent SQL injection

**Fixed Code:**
```javascript
function getUserData(username) {
    if (!username || typeof username !== 'string') {
        throw new Error('Invalid username provided');
    }
    
    const sanitizedUsername = username.replace(/[;'"\\]/g, '');
    const query = "SELECT * FROM users WHERE username = ?";
    const params = [sanitizedUsername];
    
    return { query, params };
}
```

## Bug 2: Memory Leak

### Problem
The `startDataCollection` function created an interval that never got cleared, causing a memory leak as the interval continued running indefinitely.

**Vulnerable Code:**
```javascript
function startDataCollection() {
    intervalId = setInterval(() => {
        console.log("Collecting data...");
        // This interval is never cleared, causing memory leak
    }, 1000);
}
```

### Fix
- Added a counter to track the number of executions
- Implemented automatic cleanup after a maximum number of executions
- Added a manual cleanup function for explicit control

**Fixed Code:**
```javascript
let dataCollectionCount = 0;
const MAX_COLLECTION_COUNT = 10;

function startDataCollection() {
    intervalId = setInterval(() => {
        console.log("Collecting data...");
        dataCollectionCount++;
        
        if (dataCollectionCount >= MAX_COLLECTION_COUNT) {
            clearInterval(intervalId);
            console.log("Data collection completed and interval cleared");
        }
    }, 1000);
}

function stopDataCollection() {
    if (intervalId) {
        clearInterval(intervalId);
        console.log("Data collection stopped");
    }
}
```

## Bug 3: Cross-Site Scripting (XSS) Vulnerability

### Problem
The `/search` endpoint directly output user input without sanitization, allowing attackers to inject malicious JavaScript code.

**Vulnerable Code:**
```javascript
app.get('/search', (req, res) => {
    const query = req.query.q;
    res.send(`<h1>Search results for: ${query}</h1>`);
});
```

**Attack Vector:**
An attacker could input `<script>alert('XSS')</script>` as the query parameter, which would execute JavaScript in the browser.

### Fix
- Implemented HTML entity encoding to escape dangerous characters
- Added a sanitization function that converts special characters to their HTML entity equivalents

**Fixed Code:**
```javascript
app.get('/search', (req, res) => {
    const query = req.query.q;
    
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
    
    const sanitizedQuery = escapeHtml(query || '');
    res.send(`<h1>Search results for: ${sanitizedQuery}</h1>`);
});
```

## Additional Bugs Identified

The codebase contains several other bugs that should be addressed:

4. **Insecure Password Hashing**: Using MD5 instead of bcrypt or Argon2
5. **Path Traversal**: No validation on file paths
6. **Unhandled Promise Rejection**: Missing error responses
7. **Race Condition**: Async operations without proper synchronization
8. **Inefficient Algorithm**: O(n²) duplicate finding algorithm
9. **Resource Exhaustion**: No input size limits
10. **Division by Zero**: Missing validation

## Security Best Practices Applied

1. **Input Validation**: Always validate and sanitize user inputs
2. **Parameterized Queries**: Use prepared statements for database operations
3. **Output Encoding**: Encode output to prevent XSS attacks
4. **Resource Management**: Properly clean up resources to prevent memory leaks
5. **Error Handling**: Implement proper error handling and logging