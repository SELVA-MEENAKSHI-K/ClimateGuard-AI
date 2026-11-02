$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$artifactDir = 'C:\Users\kanna\.gemini\antigravity\brain\16178239-8b89-4c2e-a3bc-0a4b1dd22ae2'

Write-Host "Capturing Home 1440px..."
& $chrome --headless=new --screenshot="$artifactDir\home_1440.png" --window-size=1440,950 --hide-scrollbars --virtual-time-budget=4000 'http://127.0.0.1:5173/#home'

Write-Host "Capturing Home 390px..."
& $chrome --headless=new --screenshot="$artifactDir\home_390.png" --window-size=390,844 --hide-scrollbars --virtual-time-budget=4000 'http://127.0.0.1:5173/#home'

Write-Host "Capturing Irrigation 1440px..."
& $chrome --headless=new --screenshot="$artifactDir\irrigation_1440.png" --window-size=1440,950 --hide-scrollbars --virtual-time-budget=4000 'http://127.0.0.1:5173/#irrigation'

Write-Host "Capturing Irrigation 390px..."
& $chrome --headless=new --screenshot="$artifactDir\irrigation_390.png" --window-size=390,844 --hide-scrollbars --virtual-time-budget=4000 'http://127.0.0.1:5173/#irrigation'

Write-Host "Done! Verifying files in artifact dir:"
Get-ChildItem -Path $artifactDir -Filter '*_1440.png' | Select-Object Name, Length
Get-ChildItem -Path $artifactDir -Filter '*_390.png' | Select-Object Name, Length
