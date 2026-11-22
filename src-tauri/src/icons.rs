use std::process::Command;

/// Open native Windows OpenFileDialog to browse for an .exe file
#[cfg(target_os = "windows")]
pub fn browse_executable() -> Result<Option<String>, String> {
    let script = r#"
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Filter = "Applications (*.exe)|*.exe|All Files (*.*)|*.*"
$dialog.Title = "Select Application Executable"
if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
    Write-Output $dialog.FileName
}
"#;

    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command", script])
        .output()
        .map_err(|e| format!("Failed to open file dialog: {}", e))?;

    let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if path.is_empty() {
        Ok(None)
    } else {
        Ok(Some(path))
    }
}

/// Open native Linux file chooser dialog
#[cfg(target_os = "linux")]
pub fn browse_executable() -> Result<Option<String>, String> {
    if let Ok(output) = Command::new("zenity")
        .args(["--file-selection", "--title=Select Application Executable"])
        .output()
    {
        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !path.is_empty() {
            return Ok(Some(path));
        }
    }
    if let Ok(output) = Command::new("kdialog")
        .args(["--getopenfilename"])
        .output()
    {
        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !path.is_empty() {
            return Ok(Some(path));
        }
    }
    Ok(None)
}

/// Extract Windows icon from an executable and return a base64 PNG data URL
#[cfg(target_os = "windows")]
pub fn extract_icon_base64(exe_path: &str) -> Result<String, String> {
    let script = format!(
        r#"
Add-Type -AssemblyName System.Drawing
$p = '{}'
if (Test-Path $p) {{
    $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($p)
    if ($icon) {{
        $ms = New-Object System.IO.MemoryStream
        $bmp = $icon.ToBitmap()
        $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $b64 = [Convert]::ToBase64String($ms.ToArray())
        $bmp.Dispose()
        $ms.Dispose()
        Write-Output "data:image/png;base64,$b64"
    }}
}}
"#,
        exe_path.replace('\'', "''")
    );

    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command", &script])
        .output()
        .map_err(|e| format!("Failed to extract icon: {}", e))?;

    let result = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if result.starts_with("data:image/png;base64,") {
        Ok(result)
    } else {
        Err(format!("Could not extract icon from '{}'", exe_path))
    }
}

/// Linux fallback for icon extraction
#[cfg(target_os = "linux")]
pub fn extract_icon_base64(_exe_path: &str) -> Result<String, String> {
    Err("Direct binary icon extraction is not supported on Linux yet".to_string())
}
