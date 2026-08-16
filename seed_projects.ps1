# Seed demo projects into mock store
$cached = Get-Item 'hitecmedia_mock_db' -ErrorAction SilentlyContinue
$store = @{}

if ($cached) {
    $store = [System.Text.Json.JsonConvert]::DeserializeObject($cached.Content)
}

# Ensure projects array
if (-not $store.projects -or $store.projects.GetType().Name -ne 'Array') {
    $store.projects = @()
    Write-Host 'Initialized empty projects array'
}

# Ensure demo project doesn't exist yet
$existingDemo = $store.projects.Find($p => $p.id -eq 'proj_safety_demo_001' -or $p.created_by -eq 'demo@hitec.id')
if (-not $existingDemo) {
    Write-Host 'Adding safety demo project...'
    $seed = @{
        id = 'proj_safety_demo_001'
        name = 'ATEX Inspection Demo - Safety ID Plant 1'
        company_id = 'co_safety_id'
        company_name = 'PT Safety Indonesia Utama'
        city_name = 'Cilegon'
        created_at = (Get-Date).ToString()
        lastModified = (Get-Date).ToString()
        created_by = 'demo@hitec.id'
        userId = 'user_safety_demo'
        retention_days = 7
        expires_at = (Get-Date).AddDays(7).ToString()
        photos = @()
    }
    $store.projects += $seed
    Write-Host 'Demo project added. Total projects:' $store.projects.Count
} else {
    Write-Host 'Demo project already exists.'
}

# Save
$json = [System.Text.Json.JsonConvert]::SerializeObject($store -TypeName 'System.Object' -AsPlainText)
Set-Item -Path 'hitecmedia_mock_db' -Value $json -Force

Write-Host ''
Write-Host '=== FINAL STATE ==='
Write-Host 'Projects in store:' $store.projects.Count
if ($store.projects.Count -gt 0) {
    $store.projects | ForEach-Object { Write-Host ' -' $_.id ':' $_.name }
}
Write-Host 'Schema version:' ($store.schema_version ?? 'not set')