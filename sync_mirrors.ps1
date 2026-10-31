$ErrorActionPreference = "Stop"
$projectDir = "c:\Users\janky\.gemini\antigravity\scratch\KiDesky"
$targets = @(
    "c:\Users\janky\.gemini\antigravity\scratch\KikiAI\KikiAI\wwwroot\apps\KiDesky",
    "c:\Users\janky\.gemini\antigravity\scratch\KikiAI\KikiAI\publish\wwwroot\apps\KiDesky"
)

foreach ($target in $targets) {
    if (-not (Test-Path $target)) {
        New-Item -ItemType Directory -Path $target -Force | Out-Null
    }
    
    # 1. HTML & JS
    Copy-Item "$projectDir\index.html" "$target\index.html" -Force
    if (-not (Test-Path "$target\js")) { New-Item -ItemType Directory -Path "$target\js" -Force | Out-Null }
    Get-ChildItem "$projectDir\js\*.js" | ForEach-Object {
        Copy-Item $_.FullName "$target\js\$($_.Name)" -Force
    }

    # 2. Assets (castles, dragons, landmarks, tiles)
    $assetDirs = @("castles", "dragons", "landmarks", "tiles")
    foreach ($ad in $assetDirs) {
        $srcDir = "$projectDir\assets\$ad"
        $dstDir = "$target\assets\$ad"
        if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
        if (Test-Path $srcDir) {
            Get-ChildItem "$srcDir\*.jpg" | ForEach-Object {
                Copy-Item $_.FullName "$dstDir\$($_.Name)" -Force
            }
        }
    }

    Write-Host "Synchronized to mirror: $target" -ForegroundColor Green
}
