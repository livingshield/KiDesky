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
    Write-Error "Chybi prihlasovaci udaje k FTP."
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
        Write-Host "Created dir: $remoteUri" -ForegroundColor Cyan
    } catch {
        # Directory likely exists
    }
}

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
        Write-Host "Uploaded: $(Split-Path $localFilePath -Leaf)" -ForegroundColor Green
    } catch {
        Write-Warning "Failed: $localFilePath -> $remoteFileUri : $_"
    }
}

$decorFiles = Get-ChildItem (Join-Path $localBase "assets\decorations\*.png")

foreach ($rb in $remoteBases) {
    Write-Host "=== Deploying decorations to $rb ===" -ForegroundColor Yellow
    Ensure-FtpDir "ftp://$FtpServer$rbassets"
    Ensure-FtpDir "ftp://$FtpServer$rbassets/decorations"
    
    $idx = 0
    foreach ($file in $decorFiles) {
        $idx++
        $remoteF = "ftp://$FtpServer$($rb)assets/decorations/$($file.Name)"
        Upload-FtpFile $file.FullName $remoteF
    }
}

Write-Host "Finished uploading $($decorFiles.Count) decoration files to both targets!" -ForegroundColor Green
