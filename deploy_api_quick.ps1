param()

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

$credentials = New-Object System.Net.NetworkCredential($FtpUsername, $FtpPassword)
$remoteBases = @("/www/apps/KiDesky/", "/www/wwwroot/apps/KiDesky/")

$filesToDeploy = @("index.html", "js/app-hud.js", "js/game-engine.js")

foreach ($relPath in $filesToDeploy) {
    if ($relPath -like "*.exe*") { continue }
    $localFile = Join-Path $localBase ($relPath -replace "/", "\")
    if (-not (Test-Path $localFile)) {
        Write-Warning "$relPath not found!"
        continue
    }
    $fileBytes = [System.IO.File]::ReadAllBytes($localFile)
    foreach ($rb in $remoteBases) {
        $remoteUri = "ftp://$FtpServer$($rb)$relPath"
        try {
            $req = [System.Net.FtpWebRequest]::Create($remoteUri)
            $req.Credentials = $credentials
            $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
            $req.UseBinary = $true
            $req.KeepAlive = $false
            $req.EnableSsl = $false
            $req.ContentLength = $fileBytes.Length
            $stream = $req.GetRequestStream()
            $stream.Write($fileBytes, 0, $fileBytes.Length)
            $stream.Close()
            $resp = $req.GetResponse()
            $resp.Close()
            Write-Host "Uploaded $relPath -> $remoteUri" -ForegroundColor Green
        } catch {
            Write-Warning "Failed uploading $relPath to $remoteUri : $_"
        }
    }
}
Write-Host "All files deployed to both roots successfully!" -ForegroundColor Green
