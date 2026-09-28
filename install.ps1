$desktop = [Environment]::GetFolderPath('Desktop')
$appDir = $PSScriptRoot
$shortcutPath = Join-Path $desktop "Digital Evidence Timeline Analyzer.lnk"
$pythonw = "C:\Users\shamy\AppData\Local\Programs\Python\Python313\pythonw.exe"
$script = Join-Path $appDir "launch.py"

$ws = New-Object -ComObject WScript.Shell
$s = $ws.CreateShortcut($shortcutPath)
$s.TargetPath = $pythonw
$s.Arguments = "`"$script`""
$s.WorkingDirectory = $appDir
$s.Description = "Digital Evidence Timeline Analyzer"
$icoPath = Join-Path $appDir "app.ico"
if (Test-Path $icoPath) {
    $s.IconLocation = "$icoPath,0"
}
$s.Save()

Write-Host "[SUCCESS] Digital Evidence Timeline Analyzer has been installed on your Desktop!"
Write-Host "Shortcut location: $shortcutPath"
