$ErrorActionPreference = "Stop"
& node "$PSScriptRoot\tools\verify-live.js" @args
exit $LASTEXITCODE
