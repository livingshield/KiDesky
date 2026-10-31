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
    # STRICT SAFETY CHECK
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
$dirs = @(
    "assets",
    "assets/env",
    "assets/board",
    "assets/landmarks",
    "assets/tiles",
    "assets/audio",
    "assets/video",
    "js"
)

# Files to upload
$filesToUpload = @(
    "index.html",
    "PRAVIDLA_PRINCEZNINO_SRDCE.md",
    "api.ashx",
    "js/game-data.js",
    "js/game-engine.js",
    "js/app.js",
    "assets/web.config",
    "assets/video/RuzeProDanielku.mp4",
    "assets/audio/bgm_court.mp3",
    "assets/audio/bgm_tavern.mp3",
    "assets/audio/bgm_tournament.mp3",
    "assets/env/table_bg.jpg",
    "assets/board/parchment_board_bg.jpg",
    "assets/landmarks/royal_castle.jpg",
    "assets/landmarks/dragon.jpg",
    "assets/tiles/kun.jpg",
    "assets/tiles/pes.jpg",
    "assets/tiles/sokol.jpg",
    "assets/tiles/festival.jpg",
    "assets/tiles/u1_zver.jpg",
    "assets/tiles/u2_monstrum.jpg",
    "assets/tiles/u3_drak.jpg",
    "assets/tiles/village.jpg",
    "assets/tiles/town.jpg",
    "assets/tiles/castle.jpg",
    "assets/tiles/merchant.jpg",
    "assets/tiles/prison.jpg",
    "assets/tiles/hospital.jpg",
    "assets/tiles/tavern.jpg"
)

foreach ($rb in $remoteBases) {
    Write-Host "=== Deploying to $rb ===" -ForegroundColor Yellow
    foreach ($d in $dirs) {
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
Write-Host "Deployment completed!" -ForegroundColor Green
