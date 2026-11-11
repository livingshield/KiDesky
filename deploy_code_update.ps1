param(
    [switch]$AllAssets = $false
)

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

function Upload-FtpFile {
    param($localFilePath, $remoteFileUri)
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

function Ensure-FtpDirectory {
    param($remoteDirUri)
    try {
        $req = [System.Net.FtpWebRequest]::Create($remoteDirUri)
        $req.Credentials = $credentials
        $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $req.KeepAlive = $false
        $req.EnableSsl = $false
        $resp = $req.GetResponse()
        $resp.Close()
        Write-Host "Created FTP dir: $remoteDirUri" -ForegroundColor Cyan
    } catch {
        # Directory probably already exists
    }
}

$codeFiles = @(
    "index.html",
    "manifest.json",
    "service-worker.js",
    "web.config",
    "api.ashx",
    "appsettings.Production.json",
    "appsettings.json",
    "css/main.css",
    "css/board.css",
    "css/modals.css",
    "css/mobile.css",
    "js/game-data.js",
    "js/game-boards.js",
    "js/game-engine.js",
    "js/game-combat-ai.js",
    "js/app-audio.js",
    "js/app.js",
    "js/app-board.js",
    "js/app-hud.js",
    "js/app-modals.js",
    "js/app-online.js",
    "js/app-saves.js",
    "js/app-map-editor.js",
    "js/app-dialog.js",
    "js/app-catalog.js",
    "js/app-admin.js",
    "js/app-musicwidget.js",
    "assets/icons/icon-192.png",
    "assets/icons/icon-512.png"
)

foreach ($rb in $remoteBases) {
    Write-Host "=== Deploying code files to $rb ===" -ForegroundColor Yellow
    Ensure-FtpDirectory "ftp://$FtpServer$($rb)css"
    Ensure-FtpDirectory "ftp://$FtpServer$($rb)js"
    Ensure-FtpDirectory "ftp://$FtpServer$($rb)assets"
    Ensure-FtpDirectory "ftp://$FtpServer$($rb)assets/icons"
    Ensure-FtpDirectory "ftp://$FtpServer$($rb)assets/monsters"
    Ensure-FtpDirectory "ftp://$FtpServer$($rb)assets/tiles"
    Ensure-FtpDirectory "ftp://$FtpServer$($rb)assets/pawns"
    foreach ($rel in $codeFiles) {
        $localF = Join-Path $localBase $rel.Replace('/', '\')
        if (Test-Path $localF) {
            $remoteF = "ftp://$FtpServer$rb$rel"
            Upload-FtpFile $localF $remoteF
        } else {
            Write-Warning "Local file not found: $localF"
        }
    }

    if ($AllAssets) {
        # Deploy pawns if any
        $pawnsDir = Join-Path $localBase "assets\pawns"
        if (Test-Path $pawnsDir) {
            $pawnFiles = Get-ChildItem -Path $pawnsDir -Filter "*.png"
            foreach ($pf in $pawnFiles) {
                $remoteF = "ftp://$FtpServer$($rb)assets/pawns/$($pf.Name)"
                Upload-FtpFile $pf.FullName $remoteF
            }
        }

        # Deploy monsters if any
        $monstersDir = Join-Path $localBase "assets\monsters"
        if (Test-Path $monstersDir) {
            $monsterFiles = Get-ChildItem -Path $monstersDir -Filter "*.png"
            foreach ($mf in $monsterFiles) {
                $remoteF = "ftp://$FtpServer$($rb)assets/monsters/$($mf.Name)"
                Upload-FtpFile $mf.FullName $remoteF
            }
        }

        # Deploy tiles if any
        $tilesDir = Join-Path $localBase "assets\tiles"
        if (Test-Path $tilesDir) {
            $tileFiles = Get-ChildItem -Path $tilesDir -Include "*.png","*.jpg" -Recurse
            foreach ($tf in $tileFiles) {
                $remoteF = "ftp://$FtpServer$($rb)assets/tiles/$($tf.Name)"
                Upload-FtpFile $tf.FullName $remoteF
            }
        }
    }
}
Write-Host "All code files deployed successfully to FTP!" -ForegroundColor Green
