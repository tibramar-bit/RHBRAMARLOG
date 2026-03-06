$key = "sb_publishable_FrXgKzxCCiym_0FneDENOQ_4H7jHjkk"
$projectRef = "ellbkstpbrtokrhwtsay"
$uri = "https://api.supabase.com/v1/projects/$projectRef/database/query"

$sql = Get-Content -Path "$PSScriptRoot\setup.sql" -Raw
$sql = $sql -replace '--[^\n]*', '' -replace '\s+', ' '

$body = @{ query = $sql } | ConvertTo-Json -Depth 5

$headers = @{
    "Authorization" = "Bearer $key"
    "Content-Type"  = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body
    Write-Host "Sucesso!" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $msg = $_.ErrorDetails.Message
    Write-Host "Erro $statusCode" -ForegroundColor Red
    Write-Host $msg
}
