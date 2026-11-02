$urls = @(
    'https://www.ekobio.org/apps/KiDesky/',
    'https://www.ekobio.org/apps/KiDesky/index.html',
    'https://www.ekobio.org/apps/KiDesky/js/app.js?v=202611021400',
    'https://www.ekobio.org/apps/KiDesky/css/board.css?v=202611021400',
    'https://www.ekobio.org/apps/KiDesky/assets/decorations/dragon_cave.png',
    'https://www.ekobio.org/apps/KiDesky/assets/decorations/watermill.png'
)

foreach ($u in $urls) {
    try {
        $res = Invoke-WebRequest -Uri $u -Method Head -UseBasicParsing -TimeoutSec 15
        Write-Host "OK $($res.StatusCode): $u" -ForegroundColor Green
    } catch {
        Write-Host "ERR $($_.Exception.Message): $u" -ForegroundColor Red
    }
}
