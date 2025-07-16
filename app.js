const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Bug 1: SQL Injection vulnerability - FIXED
function getUserData(username) {
    // FIXED: Input validation and parameterized query
    if (!username || typeof username !== 'string') {
        throw new Error('Invalid username provided');
    }
    
    // Sanitize input to prevent SQL injection
    const sanitizedUsername = username.replace(/[;'"\\]/g, '');
    
    // Use parameterized query (example with a database library)
    const query = "SELECT * FROM users WHERE username = ?";
    const params = [sanitizedUsername];
    
    console.log("Executing safe query:", query, "with params:", params);
    return { query, params };
}

// Bug 2: Memory leak - FIXED
let intervalId;
let dataCollectionCount = 0;
const MAX_COLLECTION_COUNT = 10; // Limit data collection

function startDataCollection() {
    intervalId = setInterval(() => {
        console.log("Collecting data...");
        dataCollectionCount++;
        
        // FIXED: Clear interval after certain number of executions
        if (dataCollectionCount >= MAX_COLLECTION_COUNT) {
            clearInterval(intervalId);
            console.log("Data collection completed and interval cleared");
        }
    }, 1000);
}

// FIXED: Add cleanup function
function stopDataCollection() {
    if (intervalId) {
        clearInterval(intervalId);
        console.log("Data collection stopped");
    }
}

// Bug 3: Race condition - async operations without proper handling
let userCount = 0;
async function incrementUserCount() {
    // RACE CONDITION: Multiple concurrent calls can cause incorrect counting
    const currentCount = userCount;
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation
    userCount = currentCount + 1;
    return userCount;
}

// Bug 4: Insecure password hashing
function hashPassword(password) {
    // VULNERABLE: Using weak MD5 hash
    return crypto.createHash('md5').update(password).digest('hex');
}

// Bug 5: Path traversal vulnerability
app.get('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    // VULNERABLE: No path validation allows directory traversal
    const filePath = path.join(__dirname, 'uploads', filename);
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(404).send('File not found');
        } else {
            res.send(data);
        }
    });
});

// Bug 6: XSS vulnerability - FIXED
app.get('/search', (req, res) => {
    const query = req.query.q;
    
    // FIXED: Sanitize input to prevent XSS
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

// Bug 7: Unhandled promise rejection
app.get('/api/data', async (req, res) => {
    try {
        const data = await fetchDataFromExternalAPI();
        res.json(data);
    } catch (error) {
        // BUG: Promise rejection not properly handled
        console.log("Error occurred");
        // Should send error response to client
    }
});

function fetchDataFromExternalAPI() {
    return new Promise((resolve, reject) => {
        // Simulate external API call
        setTimeout(() => {
            reject(new Error("API unavailable"));
        }, 1000);
    });
}

// Bug 8: Inefficient algorithm - O(n²) when O(n) is possible
function findDuplicates(arr) {
    const duplicates = [];
    for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] === arr[j] && !duplicates.includes(arr[i])) {
                duplicates.push(arr[i]);
            }
        }
    }
    return duplicates;
}

// Bug 9: Resource exhaustion - no input validation
app.post('/upload', (req, res) => {
    const data = req.body;
    // VULNERABLE: No size limit on data processing
    const processedData = processLargeData(data);
    res.json({ success: true, data: processedData });
});

function processLargeData(data) {
    // Simulate expensive processing
    return data.map(item => item * 2);
}

// Bug 10: Improper error handling
app.get('/divide', (req, res) => {
    const a = parseInt(req.query.a);
    const b = parseInt(req.query.b);
    
    // BUG: No validation for division by zero
    const result = a / b;
    res.json({ result });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startDataCollection(); // This will cause memory leak
});

module.exports = app;