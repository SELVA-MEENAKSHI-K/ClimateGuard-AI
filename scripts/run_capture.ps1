$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$tempProfile = 'C:\Users\kanna\AppData\Local\Temp\chrome_snap_data_' + (Get-Random)

Write-Host "Starting headless Chrome with remote debugging on port 9222..."
$pChrome = Start-Process -FilePath $chrome -ArgumentList '--headless=new', "--user-data-dir=$tempProfile", '--remote-debugging-port=9222', '--remote-allow-origins=*' -PassThru -NoNewWindow

# Wait up to 10 seconds for port 9222 to open
$started = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 500
    try {
        $res = Invoke-RestMethod -Uri "http://127.0.0.1:9222/json/version" -TimeoutSec 1 -ErrorAction Stop
        if ($res) {
            $started = $true
            Write-Host "Chrome remote debugging is ready!"
            break
        }
    } catch {
        # Keep waiting
    }
}

if (-not $started) {
    Write-Error "Chrome failed to bind remote debugging port 9222."
    Stop-Process -Id $pChrome.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

try {
    node scripts/capture_cdp.js
} finally {
    Stop-Process -Id $pChrome.Id -Force -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force $tempProfile -ErrorAction SilentlyContinue
}
