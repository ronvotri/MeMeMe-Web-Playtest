param(
  [switch]$FinalMapPreview,
  [switch]$DraftDPreview,
  [switch]$DraftDFullMap
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootFull = [System.IO.Path]::GetFullPath($root)
$preferredPort = 4173
$maxPort = 4183
$listener = $null
$port = $preferredPort

function Get-ContentType([string]$path) {
  switch ([System.IO.Path]::GetExtension($path).ToLowerInvariant()) {
    '.html' { return 'text/html; charset=utf-8' }
    '.js'   { return 'text/javascript; charset=utf-8' }
    '.css'  { return 'text/css; charset=utf-8' }
    '.json' { return 'application/json; charset=utf-8' }
    '.txt'  { return 'text/plain; charset=utf-8' }
    '.png'  { return 'image/png' }
    '.jpg'  { return 'image/jpeg' }
    '.jpeg' { return 'image/jpeg' }
    '.webp' { return 'image/webp' }
    '.svg'  { return 'image/svg+xml' }
    '.ico'  { return 'image/x-icon' }
    default { return 'application/octet-stream' }
  }
}

for ($candidate = $preferredPort; $candidate -le $maxPort; $candidate++) {
  try {
    $test = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidate)
    $test.Start()
    $listener = $test
    $port = $candidate
    break
  } catch {
    if ($test) { $test.Stop() }
  }
}

if (-not $listener) {
  Write-Host 'Khong tim duoc cong local trong khoang 4173-4183.' -ForegroundColor Red
  exit 1
}

if ($DraftDFullMap) {
  $url = "http://127.0.0.1:$port/?finalmap=4"
} elseif ($DraftDPreview) {
  $url = "http://127.0.0.1:$port/?finalmap=3&seed=5454&branch=auto"
} elseif ($FinalMapPreview) {
  $url = "http://127.0.0.1:$port/?finalmap=1"
} else {
  $url = "http://127.0.0.1:$port/"
}

Write-Host "MeMeMe playtest dang chay tai $url" -ForegroundColor Green
Write-Host 'Giu cua so nay mo trong luc choi. Nhan Ctrl+C de dung server.' -ForegroundColor Yellow
Start-Process $url

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)
      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) { continue }

      while ($true) {
        $line = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($line)) { break }
      }

      $parts = $requestLine.Split(' ')
      if ($parts.Length -lt 2 -or $parts[0] -ne 'GET') {
        $body = [System.Text.Encoding]::UTF8.GetBytes('405 Method Not Allowed')
        $header = "HTTP/1.1 405 Method Not Allowed`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
        $stream.Write([System.Text.Encoding]::ASCII.GetBytes($header), 0, $header.Length)
        $stream.Write($body, 0, $body.Length)
        continue
      }

      $rawPath = $parts[1].Split('?')[0]
      $decoded = [System.Uri]::UnescapeDataString($rawPath).TrimStart('/')
      if ([System.String]::IsNullOrWhiteSpace($decoded)) { $decoded = 'index.html' }

      $relative = $decoded.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
      $candidatePath = [System.IO.Path]::GetFullPath((Join-Path $root $relative))

      if (-not $candidatePath.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes('403 Forbidden')
        $header = "HTTP/1.1 403 Forbidden`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
        $stream.Write([System.Text.Encoding]::ASCII.GetBytes($header), 0, $header.Length)
        $stream.Write($body, 0, $body.Length)
        continue
      }

      if (Test-Path $candidatePath -PathType Container) {
        $candidatePath = Join-Path $candidatePath 'index.html'
      }

      if (-not (Test-Path $candidatePath -PathType Leaf)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
        $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
        $stream.Write([System.Text.Encoding]::ASCII.GetBytes($header), 0, $header.Length)
        $stream.Write($body, 0, $body.Length)
        continue
      }

      $body = [System.IO.File]::ReadAllBytes($candidatePath)
      $contentType = Get-ContentType $candidatePath
      $header = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      $stream.Write($body, 0, $body.Length)
      $stream.Flush()
    } finally {
      $client.Close()
    }
  }
} finally {
  if ($listener) { $listener.Stop() }
}
