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

$dragonNames = @("dragon_water", "dragon_wind", "dragon_black", "dragon_ice", "dragon_gold", "dragon_crystal")
$dragonFiles = Get-ChildItem (Join-Path $localBase "assets\dragons") | Where-Object {
    foreach ($d in $dragonNames) {
        if ($_.Name -like "$d*") { return $true }
    }
    return $false
}

Write-Host "Found $($dragonFiles.Count) dragon files to upload." -ForegroundColor Cyan

foreach ($rb in $remoteBases) {
    Write-Host "=== Deploying updated dragons to $rb ===" -ForegroundColor Yellow
    foreach ($file in $dragonFiles) {
        $remoteF = "ftp://$FtpServer$($rb)assets/dragons/$($file.Name)"
        Upload-FtpFile $file.FullName $remoteF
    }
}

Write-Host "All updated dragons deployed successfully!" -ForegroundColor Green
