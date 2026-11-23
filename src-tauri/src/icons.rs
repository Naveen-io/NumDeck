#[cfg(target_os = "linux")]
use std::process::Command;

#[cfg(target_os = "windows")]
use std::ffi::OsStr;
#[cfg(target_os = "windows")]
use std::os::windows::ffi::OsStrExt;
#[cfg(target_os = "windows")]
use windows_sys::Win32::Graphics::Gdi::*;
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::Controls::Dialogs::*;
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::Shell::ExtractIconExW;
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::WindowsAndMessaging::{
    DestroyIcon, GetIconInfo, HICON, ICONINFO,
};

/// Open native Windows OpenFileDialog to browse for an .exe file without invoking PowerShell
#[cfg(target_os = "windows")]
pub fn browse_executable() -> Result<Option<String>, String> {
    unsafe {
        let mut file_buf = [0u16; 1024];
        let filter: Vec<u16> = "Applications (*.exe)\0*.exe\0All Files (*.*)\0*.*\0\0"
            .encode_utf16()
            .collect();
        let title: Vec<u16> = "Select Application Executable\0".encode_utf16().collect();

        let mut ofn: OPENFILENAMEW = std::mem::zeroed();
        ofn.lStructSize = std::mem::size_of::<OPENFILENAMEW>() as u32;
        ofn.lpstrFilter = filter.as_ptr();
        ofn.lpstrFile = file_buf.as_mut_ptr();
        ofn.nMaxFile = file_buf.len() as u32;
        ofn.lpstrTitle = title.as_ptr();
        ofn.Flags = OFN_FILEMUSTEXIST | OFN_PATHMUSTEXIST;

        if GetOpenFileNameW(&mut ofn) != 0 {
            let len = file_buf.iter().position(|&c| c == 0).unwrap_or(file_buf.len());
            let path = String::from_utf16_lossy(&file_buf[..len]);
            if !path.is_empty() {
                return Ok(Some(path));
            }
        }
        Ok(None)
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

/// Helper function to encode raw byte slices into standard base64 strings
fn base64_encode(data: &[u8]) -> String {
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::with_capacity((data.len() + 2) / 3 * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0];
        let b1 = if chunk.len() > 1 { chunk[1] } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] } else { 0 };

        result.push(CHARSET[(b0 >> 2) as usize] as char);
        result.push(CHARSET[(((b0 & 0x03) << 4) | (b1 >> 4)) as usize] as char);
        if chunk.len() > 1 {
            result.push(CHARSET[(((b1 & 0x0F) << 2) | (b2 >> 6)) as usize] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(CHARSET[(b2 & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }
    result
}

/// Extract Windows icon from an executable using Win32 API natively (no PowerShell)
#[cfg(target_os = "windows")]
pub fn extract_icon_base64(exe_path: &str) -> Result<String, String> {
    let wide_path: Vec<u16> = OsStr::new(exe_path).encode_wide().chain(Some(0)).collect();
    unsafe {
        let mut large_icon: HICON = std::ptr::null_mut();
        let count = ExtractIconExW(wide_path.as_ptr(), 0, &mut large_icon, std::ptr::null_mut(), 1);
        if count == 0 || large_icon.is_null() {
            return Err(format!("No icon found in '{}'", exe_path));
        }

        let mut icon_info: ICONINFO = std::mem::zeroed();
        if GetIconInfo(large_icon, &mut icon_info) == 0 {
            DestroyIcon(large_icon);
            return Err("Failed to get icon info".to_string());
        }

        let hbm_color = icon_info.hbmColor;
        if hbm_color.is_null() {
            if !icon_info.hbmMask.is_null() {
                DeleteObject(icon_info.hbmMask as _);
            }
            DestroyIcon(large_icon);
            return Err("Icon has no color bitmap".to_string());
        }

        let mut bmp: BITMAP = std::mem::zeroed();
        GetObjectW(hbm_color as _, std::mem::size_of::<BITMAP>() as i32, &mut bmp as *mut _ as _);

        let width = bmp.bmWidth;
        let height = bmp.bmHeight;

        let hdc = CreateCompatibleDC(std::ptr::null_mut());
        let mut bi: BITMAPINFO = std::mem::zeroed();
        bi.bmiHeader.biSize = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
        bi.bmiHeader.biWidth = width;
        bi.bmiHeader.biHeight = height; // bottom-up DIB
        bi.bmiHeader.biPlanes = 1;
        bi.bmiHeader.biBitCount = 32;
        bi.bmiHeader.biCompression = BI_RGB;

        let pixel_bytes_count = (width * height * 4) as usize;
        let mut pixels = vec![0u8; pixel_bytes_count];

        let lines = GetDIBits(
            hdc,
            hbm_color,
            0,
            height as u32,
            pixels.as_mut_ptr() as _,
            &mut bi,
            DIB_RGB_COLORS,
        );

        DeleteDC(hdc);
        DeleteObject(hbm_color as _);
        if !icon_info.hbmMask.is_null() {
            DeleteObject(icon_info.hbmMask as _);
        }
        DestroyIcon(large_icon);

        if lines == 0 {
            return Err("Failed to read icon DIB bits".to_string());
        }

        // Create standard BMP in memory
        let file_header_size = 14u32;
        let info_header_size = 40u32;
        let total_file_size = file_header_size + info_header_size + (pixel_bytes_count as u32);
        let mut bmp_data = Vec::with_capacity(total_file_size as usize);

        // BITMAPFILEHEADER
        bmp_data.extend_from_slice(b"BM");
        bmp_data.extend_from_slice(&total_file_size.to_le_bytes());
        bmp_data.extend_from_slice(&0u32.to_le_bytes()); // reserved
        bmp_data.extend_from_slice(&(file_header_size + info_header_size).to_le_bytes()); // offset

        // BITMAPINFOHEADER
        bmp_data.extend_from_slice(&info_header_size.to_le_bytes());
        bmp_data.extend_from_slice(&width.to_le_bytes());
        bmp_data.extend_from_slice(&height.to_le_bytes());
        bmp_data.extend_from_slice(&1u16.to_le_bytes()); // planes
        bmp_data.extend_from_slice(&32u16.to_le_bytes()); // bit count
        bmp_data.extend_from_slice(&0u32.to_le_bytes()); // BI_RGB
        bmp_data.extend_from_slice(&(pixel_bytes_count as u32).to_le_bytes());
        bmp_data.extend_from_slice(&0u32.to_le_bytes()); // xpels
        bmp_data.extend_from_slice(&0u32.to_le_bytes()); // ypels
        bmp_data.extend_from_slice(&0u32.to_le_bytes()); // clr_used
        bmp_data.extend_from_slice(&0u32.to_le_bytes()); // clr_important

        // Pixel data
        bmp_data.extend_from_slice(&pixels);

        let b64 = base64_encode(&bmp_data);
        Ok(format!("data:image/bmp;base64,{}", b64))
    }
}

/// Linux fallback for icon extraction
#[cfg(target_os = "linux")]
pub fn extract_icon_base64(_exe_path: &str) -> Result<String, String> {
    Err("Direct binary icon extraction is not supported on Linux yet".to_string())
}
