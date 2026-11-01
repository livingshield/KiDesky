[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

$localBase = $PSScriptRoot
if (-not $localBase) { $localBase = (Get-Location).Path }

$configPath = Join-Path $localBase "appsettings.local.json"
if (Test-Path $configPath) {
    $cfg = Get-Content $configPath -Raw | ConvertFrom-Json
    $FtpServer = $cfg.FTP.Host
    $FtpUsername = $cfg.FTP.Username
    $FtpPassword = $cfg.FTP.Password
} else {
    $FtpServer = if ($env:FTP_HOST) { $env:FTP_HOST } else { "windows11.aspone.cz" }
    $FtpUsername = if ($env:FTP_USER) { $env:FTP_USER } else { $env:FTP_USERNAME }
    $FtpPassword = if ($env:FTP_PASS) { $env:FTP_PASS } else { $env:FTP_PASSWORD }
}

if (-not $FtpUsername -or -not $FtpPassword) {
    Write-Error "Chybi prihlasovaci udaje k FTP. Vyplnte appsettings.local.json nebo nastavte promenne FTP_USER a FTP_PASS."
    exit 1
}

$credentials = New-Object System.Net.NetworkCredential($FtpUsername, $FtpPassword)

$remoteBases = @("/www/apps/KiDesky/", "/www/wwwroot/apps/KiDesky/")

function Ensure-FtpDir {
    param($remoteUri)
    try {
        $req = [System.Net.FtpWebRequest]::Create($remoteUri)
        $req.Credentials = $credentials
        $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $req.KeepAlive = $false
        $req.EnableSsl = $false
        $resp = $req.GetResponse()
        $resp.Close()
        Write-Host "Created FTP dir: $remoteUri" -ForegroundColor Cyan
    } catch {
        # Directory likely exists
    }
}

function Upload-FtpFile {
    param($localFilePath, $remoteFileUri)
    # PŘÍSNÝ BEZPEČNOSTNÍ ZÁKAZ .EXE
    if ($localFilePath -match '\.exe($|\.)' -or $remoteFileUri -match '\.exe($|\.)') {
        Write-Error "CRITICAL VIOLATION: Refusing to upload .exe file: $localFilePath"
        return
    }
    try {
        $req = [System.Net.FtpWebRequest]::Create($remoteFileUri)
        $req.Credentials = $credentials
        $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $req.UseBinary = $true
        $req.KeepAlive = $false
        $req.EnableSsl = $false

        $fileBytes = [System.IO.File]::ReadAllBytes($localFilePath)
        $req.ContentLength = $fileBytes.Length
        $stream = $req.GetRequestStream()
        $stream.Write($fileBytes, 0, $fileBytes.Length)
        $stream.Close()
        $resp = $req.GetResponse()
        $resp.Close()
        Write-Host "Uploaded: $(Split-Path $localFilePath -Leaf) -> $remoteFileUri" -ForegroundColor Green
    } catch {
        Write-Warning "Failed uploading $localFilePath to $remoteFileUri : $_"
    }
}

# Directories to ensure
$dirsToEnsure = @(
    "js",
    "assets",
    "assets/castles",
    "assets/dragons",
    "assets/landmarks",
    "assets/tiles"
)

# Files to upload
$filesToUpload = @(
    "index.html",
    "css/main.css",
    "css/board.css",
    "css/modals.css",
    "css/mobile.css",
    "js/app-audio.js",
    "js/app.js",
    "js/app-online.js",
    "js/app-catalog.js",
    "js/game-engine.js",
    "js/game-data.js",
    "assets/landmarks/royal_castle.jpg",
    "assets/landmarks/dragon.jpg",
    "assets/tiles/castle.jpg",
    "assets/tiles/u3_drak.jpg"
)

# Add all 10 castles
Get-ChildItem "$localBase\assets\castles\*.jpg" | ForEach-Object {
    $filesToUpload += "assets/castles/$($_.Name)"
}

# Add all 20 dragons
Get-ChildItem "$localBase\assets\dragons\*.jpg" | ForEach-Object {
    $filesToUpload += "assets/dragons/$($_.Name)"
}

foreach ($rb in $remoteBases) {
    Write-Host "=== Ensuring dirs and deploying to $rb ===" -ForegroundColor Yellow
    foreach ($d in $dirsToEnsure) {
        Ensure-FtpDir "ftp://$FtpServer$rb$d"
    }
    foreach ($rel in $filesToUpload) {
        $localF = Join-Path $localBase $rel.Replace('/', '\')
        if (Test-Path $localF) {
            $remoteF = "ftp://$FtpServer$rb$rel"
            Upload-FtpFile $localF $remoteF
        } else {
            Write-Warning "Local file not found: $localF"
        }
    }
}
Write-Host "All assets and code deployed successfully to ASPONE FTP!" -ForegroundColor Green
