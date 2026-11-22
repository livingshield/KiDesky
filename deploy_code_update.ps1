param(
    [switch]$AllAssets = $false,
    [string[]]$AssetFolders = @(),
    [switch]$IncludeMedia = $false,
    [switch]$DryRun = $false,
    [switch]$SkipPreCheck = $false
)

$ErrorActionPreference = "Stop"

$localBase = $PSScriptRoot
if (-not $localBase) { $localBase = (Get-Location).Path }

$remoteBases = @("/www/apps/KiDesky/", "/www/wwwroot/apps/KiDesky/")

function Assert-NoExePath {
    param([string]$FilePath)
    if ($FilePath -match '\.exe($|\.)') {
        throw "CRITICAL VIOLATION (ASPONE policy): Refusing .exe file in deployment set: $FilePath"
    }
}

function Get-RelativeUnixPath {
    param([string]$BaseDir, [string]$FullPath)
    $baseNorm = [System.IO.Path]::GetFullPath($BaseDir).TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
    $fullNorm = [System.IO.Path]::GetFullPath($FullPath)
    if (-not $fullNorm.StartsWith($baseNorm, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Path outside project root: $FullPath"
    }
    return $fullNorm.Substring($baseNorm.Length).Replace('\', '/')
}

function Add-AllowedFile {
    param(
        [System.Collections.Generic.List[string]]$TargetList,
        [System.Collections.Generic.HashSet[string]]$SeenSet,
        [string]$FullPath
    )
    if (-not (Test-Path -LiteralPath $FullPath -PathType Leaf)) { return }
    $rel = Get-RelativeUnixPath -BaseDir $localBase -FullPath $FullPath
    Assert-NoExePath $rel
    if ($SeenSet.Add($rel)) {
        [void]$TargetList.Add($rel)
    }
}

function Collect-MatchingFiles {
    param(
        [System.Collections.Generic.List[string]]$TargetList,
        [System.Collections.Generic.HashSet[string]]$SeenSet,
        [string]$DirPath,
        [string[]]$AllowedExtensions,
        [string[]]$ExcludeTopSubdirs = @()
    )
    if (-not (Test-Path -LiteralPath $DirPath -PathType Container)) { return }
    $baseDirFull = [System.IO.Path]::GetFullPath($DirPath).TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
    $items = Get-ChildItem -LiteralPath $DirPath -Recurse -File
    foreach ($item in $items) {
        Assert-NoExePath $item.FullName
        $subRel = $item.FullName.Substring($baseDirFull.Length).Replace('\', '/')
        $firstSegment = ($subRel -split '/')[0]
        if ($ExcludeTopSubdirs -contains $firstSegment) { continue }
        $ext = $item.Extension.ToLowerInvariant()
        if ($AllowedExtensions -contains $ext) {
            Add-AllowedFile -TargetList $TargetList -SeenSet $SeenSet -FullPath $item.FullName
        }
    }
}

# 1. Pre-deploy verification check
if (-not $SkipPreCheck) {
    $preCheckScript = Join-Path $localBase "tools\predeploy-check.js"
    if (-not (Test-Path -LiteralPath $preCheckScript)) {
        Write-Error "Pre-deploy check script missing: $preCheckScript"
        exit 1
    }
    Write-Host "Running pre-deploy check..." -ForegroundColor Cyan
    & node $preCheckScript
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Pre-deploy check failed (exit code $LASTEXITCODE). Deployment aborted."
        exit 1
    }
} else {
    Write-Warning "Skipping pre-deploy check (-SkipPreCheck)."
}

# 2. Dynamically assemble code & asset file lists
$codeFiles = New-Object 'System.Collections.Generic.List[string]'
$codeSeen = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)

$allowedRootFiles = @(
    "index.html",
    "manifest.json",
    "service-worker.js",
    "web.config",
    "appsettings.json",
    "appsettings.Production.json"
)
foreach ($rf in $allowedRootFiles) {
    Add-AllowedFile -TargetList $codeFiles -SeenSet $codeSeen -FullPath (Join-Path $localBase $rf)
}

$ashxFiles = Get-ChildItem -LiteralPath $localBase -Filter "api*.ashx" -File
foreach ($af in $ashxFiles) {
    Add-AllowedFile -TargetList $codeFiles -SeenSet $codeSeen -FullPath $af.FullName
}

Collect-MatchingFiles -TargetList $codeFiles -SeenSet $codeSeen -DirPath (Join-Path $localBase "css") -AllowedExtensions @(".css")
Collect-MatchingFiles -TargetList $codeFiles -SeenSet $codeSeen -DirPath (Join-Path $localBase "js") -AllowedExtensions @(".js", ".json")
Collect-MatchingFiles -TargetList $codeFiles -SeenSet $codeSeen -DirPath (Join-Path $localBase "App_Code") -AllowedExtensions @(".cs")
Collect-MatchingFiles -TargetList $codeFiles -SeenSet $codeSeen -DirPath (Join-Path $localBase "backend") -AllowedExtensions @(".cs", ".config")

$iconsDir = Join-Path $localBase "assets\icons"
if (Test-Path -LiteralPath $iconsDir -PathType Container) {
    $iconItems = Get-ChildItem -LiteralPath $iconsDir -File
    foreach ($ii in $iconItems) {
        Assert-NoExePath $ii.FullName
        if (@(".png", ".svg", ".webp") -contains $ii.Extension.ToLowerInvariant()) {
            Add-AllowedFile -TargetList $codeFiles -SeenSet $codeSeen -FullPath $ii.FullName
        }
    }
}
Add-AllowedFile -TargetList $codeFiles -SeenSet $codeSeen -FullPath (Join-Path $localBase "assets\web.config")

$assetFiles = New-Object 'System.Collections.Generic.List[string]'
$assetSeen = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)

# Avoid adding files to assetFiles if already scheduled in codeFiles
foreach ($cf in $codeFiles) {
    [void]$assetSeen.Add($cf)
}

$imageExts = @(".png", ".jpg", ".jpeg", ".webp", ".svg")
$assetAllowedExts = @(".png", ".jpg", ".jpeg", ".webp", ".svg", ".mp3", ".ogg", ".m4a", ".mp4", ".webm")

if ($AssetFolders -and $AssetFolders.Count -gt 0) {
    $normalizedFolders = @()
    foreach ($entry in $AssetFolders) {
        if ([string]::IsNullOrWhiteSpace($entry)) { continue }
        foreach ($part in ($entry -split ',')) {
            $trimmed = $part.Trim().Trim('\', '/')
            if ($trimmed) { $normalizedFolders += $trimmed }
        }
    }
    $assetsRootFull = [System.IO.Path]::GetFullPath((Join-Path $localBase "assets"))
    foreach ($folder in $normalizedFolders) {
        if ($folder -match '\.\.') {
            throw "Invalid AssetFolders entry: $folder"
        }
        $targetFolder = [System.IO.Path]::GetFullPath((Join-Path $assetsRootFull $folder))
        if (-not $targetFolder.StartsWith($assetsRootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Asset folder escapes assets directory: $folder"
        }
        if (-not (Test-Path -LiteralPath $targetFolder -PathType Container)) {
            Write-Warning "Asset folder not found: assets/$folder"
            continue
        }
        Collect-MatchingFiles -TargetList $assetFiles -SeenSet $assetSeen -DirPath $targetFolder -AllowedExtensions $assetAllowedExts
    }
}

if ($AllAssets) {
    Collect-MatchingFiles -TargetList $assetFiles -SeenSet $assetSeen -DirPath (Join-Path $localBase "assets") -AllowedExtensions $imageExts -ExcludeTopSubdirs @("audio", "video")
}

if ($IncludeMedia) {
    Collect-MatchingFiles -TargetList $assetFiles -SeenSet $assetSeen -DirPath (Join-Path $localBase "assets\audio") -AllowedExtensions $assetAllowedExts
    Collect-MatchingFiles -TargetList $assetFiles -SeenSet $assetSeen -DirPath (Join-Path $localBase "assets\video") -AllowedExtensions $assetAllowedExts
}

$allDeployFiles = New-Object 'System.Collections.Generic.List[string]'
foreach ($f in $codeFiles) { [void]$allDeployFiles.Add($f) }
foreach ($f in $assetFiles) { [void]$allDeployFiles.Add($f) }

# Final strict safety check across all scheduled files
$exeMatches = @($allDeployFiles | Where-Object { $_ -match '\.exe($|\.)' })
if ($exeMatches.Count -gt 0) {
    throw "CRITICAL VIOLATION: .exe files detected in deployment manifest: $($exeMatches -join ', ')"
}

if ($DryRun) {
    Write-Host ""
    Write-Host "=== DRY RUN DEPLOYMENT MANIFEST ===" -ForegroundColor Yellow
    Write-Host "Target FTP roots: $($remoteBases -join ', ')" -ForegroundColor Cyan
    Write-Host "Code files ($($codeFiles.Count)):" -ForegroundColor Green
    foreach ($f in $codeFiles) { Write-Host "  [CODE]  $f" }
    Write-Host "Asset files ($($assetFiles.Count)):" -ForegroundColor Green
    if ($assetFiles.Count -eq 0) {
        Write-Host "  (none; pass -AllAssets, -AssetFolders, or -IncludeMedia)" -ForegroundColor DarkGray
    } else {
        foreach ($f in $assetFiles) { Write-Host "  [ASSET] $f" }
    }
    Write-Host "Safety check: 0 .exe files | Total scheduled: $($allDeployFiles.Count) files per mirror." -ForegroundColor Cyan
    exit 0
}

# 3. Load FTP credentials only for real deployment
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

$configPath = Join-Path $localBase "appsettings.local.json"
if (Test-Path -LiteralPath $configPath) {
    $cfg = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
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
$createdDirsCache = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)

function Ensure-FtpDirectory {
    param([string]$remoteDirUri)
    if ($createdDirsCache.Contains($remoteDirUri)) { return }
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
        # Directory likely already exists on FTP
    }
    [void]$createdDirsCache.Add($remoteDirUri)
}

function Ensure-FtpDirectoryTree {
    param(
        [string]$ftpHost,
        [string]$remoteBase,
        [string]$relFilePath
    )
    $dirPart = [System.IO.Path]::GetDirectoryName($relFilePath)
    if ([string]::IsNullOrEmpty($dirPart)) { return }
    $segments = $dirPart.Replace('\', '/').Split('/', [System.StringSplitOptions]::RemoveEmptyEntries)
    $accum = ""
    foreach ($seg in $segments) {
        $accum = if ($accum) { "$accum/$seg" } else { $seg }
        $uri = "ftp://$ftpHost$remoteBase$accum"
        Ensure-FtpDirectory $uri
    }
}

function Upload-FtpFile {
    param(
        [string]$localFilePath,
        [string]$remoteFileUri
    )
    if ($localFilePath -match '\.exe($|\.)' -or $remoteFileUri -match '\.exe($|\.)') {
        Write-Error "CRITICAL VIOLATION: Refusing to upload .exe file: $localFilePath"
        return $false
    }
    $maxAttempts = 3
    $fileLen = (Get-Item -LiteralPath $localFilePath).Length
    $bufSize = 65536
    $buffer = New-Object byte[] $bufSize
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        $fs = $null
        $reqStream = $null
        $resp = $null
        try {
            $req = [System.Net.FtpWebRequest]::Create($remoteFileUri)
            $req.Credentials = $credentials
            $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
            $req.UseBinary = $true
            $req.KeepAlive = $false
            $req.EnableSsl = $false
            $req.Timeout = 600000
            $req.ReadWriteTimeout = 600000
            $req.ContentLength = $fileLen

            $fs = [System.IO.File]::OpenRead($localFilePath)
            $reqStream = $req.GetRequestStream()
            while (($bytesRead = $fs.Read($buffer, 0, $bufSize)) -gt 0) {
                $reqStream.Write($buffer, 0, $bytesRead)
            }
            $reqStream.Close(); $reqStream = $null
            $fs.Close(); $fs = $null
            $resp = $req.GetResponse()
            $resp.Close(); $resp = $null
            Write-Host "Uploaded: $localFilePath -> $remoteFileUri" -ForegroundColor Green
            return $true
        } catch {
            if ($reqStream) { try { $reqStream.Dispose() } catch {} }
            if ($fs) { try { $fs.Dispose() } catch {} }
            if ($resp) { try { $resp.Close() } catch {} }
            if ($attempt -lt $maxAttempts) {
                Write-Warning "Retry $attempt/$maxAttempts failed uploading $localFilePath to $remoteFileUri : $_"
                Start-Sleep -Milliseconds 1500
            } else {
                Write-Warning "Failed uploading $localFilePath to $remoteFileUri after $maxAttempts attempts: $_"
                return $false
            }
        }
    }
    return $false
}

$uploadedCount = 0
$failedCount = 0

foreach ($rb in $remoteBases) {
    Write-Host "=== Deploying $($allDeployFiles.Count) files to $rb ===" -ForegroundColor Yellow
    foreach ($rel in $allDeployFiles) {
        Ensure-FtpDirectoryTree -ftpHost $FtpServer -remoteBase $rb -relFilePath $rel
        $localF = Join-Path $localBase ($rel.Replace('/', '\'))
        $remoteF = "ftp://$FtpServer$rb$rel"
        if (Upload-FtpFile -localFilePath $localF -remoteFileUri $remoteF) {
            $uploadedCount++
        } else {
            $failedCount++
        }
    }
}

Write-Host "=== Deployment summary: $uploadedCount succeeded, $failedCount failed ===" -ForegroundColor $(if ($failedCount -gt 0) { "Red" } else { "Green" })
if ($failedCount -gt 0) {
    exit 1
}
exit 0
