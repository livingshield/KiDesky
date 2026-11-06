$localBase = (Get-Location).Path
$cfg = Get-Content (Join-Path $localBase "appsettings.local.json") -Raw | ConvertFrom-Json
$cred = New-Object System.Net.NetworkCredential($cfg.FTP.Username, $cfg.FTP.Password)
$remoteBases = @("/www/apps/KiDesky/", "/www/wwwroot/apps/KiDesky/")
$map = [ordered]@{ "KINGDOM*" = "kingdom_majestic_fantasy_mix.mp3"; "Symphonic Rage*" = "symphonic_rage.mp3"; "The Beauty Of Epic*" = "beauty_of_epic_music_vol2.mp3" }
foreach ($k in $map.Keys) {
  $f = Get-ChildItem (Join-Path $localBase "assets\audio\big") -File -Filter $k | Select-Object -First 1
  if (-not $f) { Write-Warning "Missing $k"; continue }
  foreach ($rb in $remoteBases) {
    $uri = "ftp://$($cfg.FTP.Host)$($rb)assets/audio/$($map[$k])"
    try {
      $req = [System.Net.FtpWebRequest]::Create($uri); $req.Credentials=$cred
      $req.Method=[System.Net.WebRequestMethods+Ftp]::UploadFile; $req.UseBinary=$true; $req.KeepAlive=$false
      $req.Timeout=3600000; $req.ReadWriteTimeout=3600000
      $in=[IO.File]::OpenRead($f.FullName); $out=$req.GetRequestStream(); $in.CopyTo($out,65536); $out.Close(); $in.Close()
      $req.GetResponse().Close(); Write-Host "OK $($map[$k]) -> $rb"
    } catch { Write-Warning "FAIL $($map[$k]) -> $rb : $_" }
  }
}
Write-Host "Done."
