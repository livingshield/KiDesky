# ==============================================================================
# KiDesky ("Princeznino srdce") - Nasazovací skript na FTP ASPONE (ekobio.org)
# PŘÍSNÝ ZÁKAZ NAHRÁVÁNÍ SOUBORŮ .EXE NA FTP ASPONE!
# ==============================================================================

$ErrorActionPreference = "Stop"

$projectDir = "c:\Users\janky\.gemini\antigravity\scratch\KiDesky"
$kikiPublishRoot = "c:\Users\janky\.gemini\antigravity\scratch\KikiAI\KikiAI\publish\wwwroot"
$configPath = Join-Path $projectDir "appsettings.local.json"

if (-not (Test-Path $configPath)) {
    throw "Chybí konfigurační soubor appsettings.local.json!"
}

$cfg = Get-Content $configPath -Raw | ConvertFrom-Json
$ftpHost = $cfg.FTP.Host
$ftpUser = $cfg.FTP.Username
$ftpPass = $cfg.FTP.Password
$sqlConn = $cfg.ConnectionStrings.ProductionConnection

function Ensure-FtpDirectory($remoteDir) {
    $uri = "ftp://$ftpHost$remoteDir"
    try {
        $req = [System.Net.FtpWebRequest]::Create($uri)
        $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $req.UseBinary = $true
        $req.KeepAlive = $false
        $resp = $req.GetResponse()
        $resp.Close()
    } catch {
        # Adresář již pravděpodobně existuje
    }
}

function Upload-FtpBytes($bytes, $remotePath) {
    # BEZPEČNOSTNÍ POJISTKA PROTI .EXE SOUBORŮM (Pravidlo ASPONE)
    if ($remotePath -match "\.exe(\.|$)") {
        throw "KRITICKÁ CHYBA: Pokus o nahrání zakázaného .exe souboru ($remotePath)!"
    }
    $uri = "ftp://$ftpHost$remotePath"
    $req = [System.Net.FtpWebRequest]::Create($uri)
    $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
    $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $req.UseBinary = $true
    $req.KeepAlive = $false
    $req.ContentLength = $bytes.Length
    $stream = $req.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
    $resp = $req.GetResponse()
    $resp.Close()
    Write-Host "Uploaded: $remotePath"
}

function Upload-FtpFile($localPath, $remotePath) {
    if ($localPath -match "\.exe(\.|$)" -or $remotePath -match "\.exe(\.|$)") {
        Write-Warning "Přeskakuji zakázaný .exe soubor: $localPath"
        return
    }
    $bytes = [System.IO.File]::ReadAllBytes($localPath)
    Upload-FtpBytes $bytes $remotePath
}

$roots = @("/www", "/www/wwwroot")

foreach ($r in $roots) {
    Ensure-FtpDirectory "$r/assets"
    Ensure-FtpDirectory "$r/apps"
    Ensure-FtpDirectory "$r/apps/KiDesky"
    Ensure-FtpDirectory "$r/apps/KiDesky/js"
    Ensure-FtpDirectory "$r/apps/KiDesky/assets"
    Ensure-FtpDirectory "$r/apps/KiDesky/assets/sketches"

    # 1. Aktualizace rozcestníku KikiAI (index.html + grafika karty KiDesky)
    Upload-FtpFile "$kikiPublishRoot\index.html" "$r/index.html"
    Upload-FtpFile "$projectDir\assets\kidesky-hero.png" "$r/assets/kidesky-hero.png"

    # 2. Nahrání souborů aplikace KiDesky (s vyloučením všech *.exe)
    Upload-FtpFile "$projectDir\index.html" "$r/apps/KiDesky/index.html"
    Upload-FtpFile "$projectDir\PRAVIDLA_PRINCEZNINO_SRDCE.md" "$r/apps/KiDesky/PRAVIDLA_PRINCEZNINO_SRDCE.md"
    Upload-FtpFile "$projectDir\assets\kidesky-hero.png" "$r/apps/KiDesky/assets/kidesky-hero.png"

    # JS soubory
    Get-ChildItem "$projectDir\js\*.js" | Where-Object { $_.Extension -ne ".exe" } | ForEach-Object {
        Upload-FtpFile $_.FullName "$r/apps/KiDesky/js/$($_.Name)"
    }

    # Nákresy
    Get-ChildItem "$projectDir\assets\sketches\*.jpg" | Where-Object { $_.Extension -ne ".exe" } | ForEach-Object {
        Upload-FtpFile $_.FullName "$r/apps/KiDesky/assets/sketches/$($_.Name)"
    }

    # 3. Nahrání api.ashx s vloženým DB connection stringem v paměti
    $ashxContent = [System.IO.File]::ReadAllText("$projectDir\api.ashx", [System.Text.Encoding]::UTF8)
    $ashxInjected = $ashxContent.Replace("__DB_CONN_STRING__", $sqlConn)
    $ashxBytes = [System.Text.Encoding]::UTF8.GetBytes($ashxInjected)
    Upload-FtpBytes $ashxBytes "$r/apps/KiDesky/api.ashx"
}

Write-Host "=== Nasazení KiDesky (Princeznino srdce) na ekobio.org dokončeno ==="
