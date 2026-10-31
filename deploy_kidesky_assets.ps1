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

$createdDirs = @{}

function Ensure-FtpDirHierarchy {
    param($baseUri, $relativePath)
    $parts = $relativePath.Split('/')
    $currentUri = $baseUri.TrimEnd('/')
    for ($i = 0; $i -lt ($parts.Length - 1); $i++) {
        $part = $parts[$i]
        if (-not $part) { continue }
        $currentUri = "$currentUri/$part"
        if ($createdDirs.ContainsKey($currentUri)) { continue }
        try {
            $req = [System.Net.FtpWebRequest]::Create($currentUri)
            $req.Credentials = $credentials
            $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
            $req.KeepAlive = $false
            $req.EnableSsl = $false
            $resp = $req.GetResponse()
            $resp.Close()
            Write-Host "Created FTP dir: $currentUri" -ForegroundColor Cyan
        } catch {
            # Directory likely exists
        }
        $createdDirs[$currentUri] = $true
    }
}

function Upload-FtpFile {
    param($localFilePath, $remoteFileUri)
    # STRICT SAFETY CHECK: Poskytovatel hostingu ASPONE zakazuje *.exe soubory
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

$assetFiles = Get-ChildItem (Join-Path $localBase "assets") -Recurse -File | Where-Object { $_.FullName -notmatch '\.exe($|\.)' }

foreach ($rb in $remoteBases) {
    Write-Host "=== Deploying assets to $rb ===" -ForegroundColor Yellow
    $baseUri = "ftp://$FtpServer$rb"
    foreach ($file in $assetFiles) {
        $rel = $file.FullName.Substring($localBase.Length).TrimStart('\', '/').Replace('\', '/')
        Ensure-FtpDirHierarchy $baseUri $rel
        $remoteF = "$baseUri$rel"
        Upload-FtpFile $file.FullName $remoteF
    }
}
Write-Host "Asset deployment completed!" -ForegroundColor Green
