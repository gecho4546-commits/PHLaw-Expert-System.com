<?php
// backend/proxy.php

// Set the Content-Type header to ensure browsers expect JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Be more specific in production, e.g., 'http://localhost:8000'
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Ensure it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Method Not Allowed. Only POST requests are accepted.']);
    exit();
}

// Get the raw POST data
$input = file_get_contents('php://input');
$requestData = json_decode($input, true); // Decode as associative array

// Basic validation for requestData structure
if (json_last_error() !== JSON_ERROR_NONE || !isset($requestData['contents'])) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Invalid JSON input or missing "contents" in request body.']);
    exit();
}

// --- Configuration ---
$geminiApiKey = 'AIzaSyC5ytNLxK0XC182FJNXHYzm57AUWlLAjEw';
$geminiApiUrl = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=$geminiApiKey";



// Prepare data for the Gemini API call
$postData = json_encode([
    'contents' => $requestData['contents'],
    // You can add other parameters here if needed, like generationConfig, safetySettings
]);

// Use cURL for making the HTTP request to Gemini API
$ch = curl_init($geminiApiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // Return the response as a string
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST'); // Set request method to POST
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData); // Set the POST body
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Content-Length: ' . strlen($postData)
]);

$geminiResponse = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// Error handling for cURL
if ($curlError) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['error' => 'cURL error: ' . $curlError]);
    exit();
}

// Check if Gemini API returned a successful HTTP code
if ($httpCode >= 400) {
    http_response_code($httpCode); // Propagate Gemini's error code
    $geminiError = json_decode($geminiResponse, true);
    if (json_last_error() === JSON_ERROR_NONE && isset($geminiError['error'])) {
        echo json_encode(['error' => 'Gemini API Error: ' . $geminiError['error']['message']]);
    } else {
        echo json_encode(['error' => 'Gemini API returned an error (' . $httpCode . '). Raw response: ' . $geminiResponse]);
    }
    exit();
}

// If everything is successful, return Gemini's response
echo $geminiResponse;

?>