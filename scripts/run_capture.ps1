$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$tempProfile = 'C:\Users\kanna\AppData\Local\Temp\chrome_snap_data_' + (Get-Random)

Write-Host "Starting headless Chrome with remote debugging on port 9222..."
$pChrome = Start-Process -FilePath $chrome -ArgumentList '--headless=new', "--user-data-dir=$tempProfile", '--remote-debugging-port=9222' -PassThru -NoNewWindow

Start-Sleep -Seconds 2

try {
  node scripts/capture_cdp.js
} finally {
  Stop-Process -Id $pChrome.Id -Force -ErrorAction SilentlyContinue
  Remove-Item -Recurse -Force $tempProfile -ErrorAction SilentlyContinue
}
