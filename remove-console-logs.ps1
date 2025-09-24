$frontendDir = "c:\Users\HP\Desktop\withoutplan-fx\frontend"

# Get all JS and JSX files
$files = Get-ChildItem -Path $frontendDir -Recurse -Include *.js,*.jsx,*.ts,*.tsx | Where-Object { 
    $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*.next*" 
}

$totalFiles = $files.Count
$modifiedFiles = 0

Write-Host "Found $totalFiles JavaScript/TypeScript files to process"

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $originalLength = $content.Length
    
    # Remove console.log statements
    $newContent = $content -replace "console\.log\s*\(\s*[^;]*\)\s*;?", ""
    
    if ($newContent.Length -ne $originalLength) {
        Set-Content -Path $file.FullName -Value $newContent
        $modifiedFiles++
        Write-Host "Removed console.logs from: $($file.FullName)"
    }
}

Write-Host "`nCompleted! Modified $modifiedFiles files."