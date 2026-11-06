param()
$localBase = $PSScriptRoot
if (-not $localBase) { $localBase = (Get-Location).Path }
$cfg = Get-Content (Join-Path $localBase "appsettings.local.json") -Raw | ConvertFrom-Json
$FtpServer = $cfg.FTP.Host
$credentials = New-Object System.Net.NetworkCredential($cfg.FTP.Username, $cfg.FTP.Password)
$remoteBases = @("/www/apps/KiDesky/", "/www/wwwroot/apps/KiDesky/")

# local relative path -> remote relative path (audio soubory dostanou ASCII nazvy)
$map = [ordered]@{
  "index.html" = "index.html"; "web.config" = "web.config"; "api.ashx" = "api.ashx"
  "js/app-audio.js" = "js/app-audio.js"; "js/app.js" = "js/app.js"; "js/app-admin.js" = "js/app-admin.js"
}
$audioMap = @{
  "Flight_of_the_High_Queen.mp3" = "Flight_of_the_High_Queen.mp3"
  "Army Of Light*" = "army_of_light.mp3"
  "Heavenly Warrior*" = "heavenly_warrior.mp3"
  "We Fight As One*" = "we_fight_as_one.mp3"
  "Together*" = "together.mp3"
  "Tomorrow is Here*" = "tomorrow_is_here.mp3"
  "I WILL DO EVERYTHING*" = "i_will_do_everything.mp3"
  "Adventure Fantasy Music*" = "adventure_fantasy_music.mp3"
}
$jobs = @()
foreach ($k in $map.Keys) { $jobs += ,@((Join-Path $localBase ($k -replace "/","\")), $map[$k]) }
foreach ($k in $audioMap.Keys) {
  $f = Get-ChildItem (Join-Path $localBase "assets\audio") -File -Filter $k | Select-Object -First 1
  if ($f) { $jobs += ,@($f.FullName, ("assets/audio/" + $audioMap[$k])) } else { Write-Warning "Missing local audio: $k" }
}

function Ensure-Dir($uri) {
  try { $r=[System.Net.FtpWebRequest]::Create($uri); $r.Credentials=$credentials; $r.Method=[System.Net.WebRequestMethods+Ftp]::MakeDirectory; $r.GetResponse().Close() } catch {}
}

foreach ($rb in $remoteBases) { Ensure-Dir "ftp://$FtpServer$($rb)assets"; Ensure-Dir "ftp://$FtpServer$($rb)assets/audio" }

foreach ($j in $jobs) {
  $local = $j[0]; $rel = $j[1]
  if ($rel -like "*.exe*") { continue }
  foreach ($rb in $remoteBases) {
    $uri = "ftp://$FtpServer$rb$rel"
    try {
      $req = [System.Net.FtpWebRequest]::Create($uri)
      $req.Credentials = $credentials
      $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
      $req.UseBinary = $true; $req.KeepAlive = $false; $req.EnableSsl = $false
      $req.Timeout = 600000; $req.ReadWriteTimeout = 600000
      $in = [System.IO.File]::OpenRead($local)
      $req.ContentLength = $in.Length
      $out = $req.GetRequestStream()
      $in.CopyTo($out, 65536)
      $out.Close(); $in.Close()
      $req.GetResponse().Close()
      Write-Host "OK  $rel -> $rb" -ForegroundColor Green
    } catch { Write-Warning "FAIL $rel -> $rb : $_" }
  }
}
Write-Host "Done."

