# Simple static file server for The Cinephile Vault
# Run: powershell -ExecutionPolicy Bypass -File serve.ps1

$port   = 5500
$root   = $PSScriptRoot
$prefix = "http://localhost:$port/"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host ""
Write-Host "  The Cinephile Vault is running." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Open in browser: http://localhost:$port" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press Ctrl+C to stop." -ForegroundColor DarkGray
Write-Host ""

# Open browser automatically
Start-Process "http://localhost:$port"

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".json" = "application/json"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".gif"  = "image/gif"
  ".svg"  = "image/svg+xml"
  ".ico"  = "image/x-icon"
  ".woff2"= "font/woff2"
  ".woff" = "font/woff"
  ".ttf"  = "font/ttf"
}

while ($listener.IsListening) {
  $context  = $listener.GetContext()
  $request  = $context.Request
  $response = $context.Response

  $urlPath  = $request.Url.LocalPath
  if ($urlPath -eq "/") { $urlPath = "/index.html" }

  $filePath = Join-Path $root $urlPath.TrimStart("/").Replace("/", "\")

  if (Test-Path $filePath -PathType Leaf) {
    $ext      = [System.IO.Path]::GetExtension($filePath).ToLower()
    $mime     = if ($mimeTypes[$ext]) { $mimeTypes[$ext] } else { "application/octet-stream" }
    $bytes    = [System.IO.File]::ReadAllBytes($filePath)

    $response.ContentType   = $mime
    $response.ContentLength64 = $bytes.Length
    $response.StatusCode    = 200
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $response.StatusCode = 404
    $msg   = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
    $response.ContentType = "text/plain"
    $response.ContentLength64 = $msg.Length
    $response.OutputStream.Write($msg, 0, $msg.Length)
  }

  $response.OutputStream.Close()
}
