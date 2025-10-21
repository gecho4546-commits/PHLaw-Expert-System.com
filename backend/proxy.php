<?php
// backend/proxy.php

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed', 'details' => 'Only POST requests are accepted']);
    exit();
}

// Get and validate input
$input = file_get_contents('php://input');
if (empty($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'Empty request body', 'details' => 'No data received']);
    exit();
}

$requestData = json_decode($input, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON', 'details' => json_last_error_msg()]);
    exit();
}

if (!isset($requestData['contents'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required field', 'details' => 'Contents field is required']);
    exit();
}

// Gemini API configuration
$geminiApiKey = 'AIzaSyC5ytNLxK0XC182FJNXHYzm57AUWlLAjEw';
$geminiApiUrl = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=$geminiApiKey";

// Prepare request data for Gemini
$postData = json_encode([
    'contents' => $requestData['contents'],
    'generationConfig' => [
        'temperature' => 0.7,
        'topK' => 40,
        'topP' => 0.95,
        'maxOutputTokens' => 8192,
    ]
]);

// Initialize cURL
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $geminiApiUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $postData,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
    ],
    CURLOPT_TIMEOUT => 60,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_USERAGENT => 'PhilLaw-Chat/1.0'
]);

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
$curlErrno = curl_errno($ch);
curl_close($ch);

// Handle cURL errors
if ($curlErrno) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Network Error', 
        'details' => $curlError,
        'code' => $curlErrno
    ]);
    exit();
}

// Handle HTTP errors from Gemini API
if ($httpCode >= 400) {
    $errorInfo = json_decode($response, true);
    $errorMessage = 'Gemini API Error';
    
    if (isset($errorInfo['error']['message'])) {
        $errorMessage = $errorInfo['error']['message'];
    } elseif (isset($errorInfo['error']['status'])) {
        $errorMessage = $errorInfo['error']['status'];
    }
    
    http_response_code($httpCode);
    echo json_encode([
        'error' => 'AI Service Error',
        'details' => $errorMessage,
        'http_code' => $httpCode
    ]);
    exit();
}

// Success - return Gemini response directly
echo $response;
?>
