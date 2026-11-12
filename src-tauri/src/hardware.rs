use serde::{Deserialize, Serialize};
use windows::Win32::UI::Input::KeyboardAndMouse::*;
use windows::Win32::UI::Input::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyboardDeviceInfo {
    pub name: String,
    pub device_id: String,
    pub is_internal: bool,
    pub function_keys: u32,
    pub indicators: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareDetectionReport {
    pub numlock_on: bool,
    pub keyboards_found: usize,
    pub keyboards: Vec<KeyboardDeviceInfo>,
    pub numpad_ready: bool,
    pub primary_device: String,
}

pub struct HardwareManager;

impl HardwareManager {
    pub fn detect_hardware() -> HardwareDetectionReport {
        let numlock_on = unsafe { (GetKeyState(VK_NUMLOCK.0 as i32) & 0x0001) != 0 };

        let mut devices_count: u32 = 0;
        let mut keyboards = Vec::new();

        unsafe {
            let res = GetRawInputDeviceList(
                None,
                &mut devices_count,
                std::mem::size_of::<RAWINPUTDEVICELIST>() as u32,
            );

            if res != u32::MAX && devices_count > 0 {
                let mut raw_list = vec![RAWINPUTDEVICELIST::default(); devices_count as usize];
                let fetched = GetRawInputDeviceList(
                    Some(raw_list.as_mut_ptr()),
                    &mut devices_count,
                    std::mem::size_of::<RAWINPUTDEVICELIST>() as u32,
                );

                if fetched != u32::MAX {
                    for dev in &raw_list[..fetched as usize] {
                        if dev.dwType == RIM_TYPEKEYBOARD {
                            // 1. Query device name via RIDI_DEVICENAME
                            let mut name_size: u32 = 0;
                            let _ = GetRawInputDeviceInfoW(dev.hDevice, RIDI_DEVICENAME, None, &mut name_size);
                            let raw_name = if name_size > 0 {
                                let mut buf = vec![0u16; name_size as usize];
                                let get_res = GetRawInputDeviceInfoW(
                                    dev.hDevice,
                                    RIDI_DEVICENAME,
                                    Some(buf.as_mut_ptr() as *mut _),
                                    &mut name_size,
                                );
                                if get_res != u32::MAX && get_res > 0 {
                                    String::from_utf16_lossy(&buf[..get_res as usize - 1])
                                } else {
                                    String::new()
                                }
                            } else {
                                String::new()
                            };

                            let is_internal = raw_name.to_uppercase().contains("ACPI")
                                || raw_name.to_uppercase().contains("PNP0303");

                            let clean_name = if is_internal {
                                "Integrated Laptop Keyboard (ACPI)".to_string()
                            } else if raw_name.to_uppercase().contains("HID") {
                                "Standard / HID Keyboard".to_string()
                            } else {
                                format!("Physical Keyboard ({})", dev.hDevice.0 as usize)
                            };

                            // 2. Query device info via RIDI_DEVICEINFO
                            let mut info = RID_DEVICE_INFO::default();
                            info.cbSize = std::mem::size_of::<RID_DEVICE_INFO>() as u32;
                            let mut info_size = info.cbSize;

                            let info_res = GetRawInputDeviceInfoW(
                                dev.hDevice,
                                RIDI_DEVICEINFO,
                                Some(&mut info as *mut _ as *mut _),
                                &mut info_size,
                            );

                            let (fn_keys, indicators) = if info_res != u32::MAX {
                                let kbd_info = info.Anonymous.keyboard;
                                (kbd_info.dwNumberOfFunctionKeys, kbd_info.dwNumberOfIndicators)
                            } else {
                                (12, 3)
                            };

                            keyboards.push(KeyboardDeviceInfo {
                                name: clean_name,
                                device_id: if raw_name.is_empty() {
                                    format!("KBD_{:?}", dev.hDevice.0)
                                } else {
                                    raw_name
                                },
                                is_internal,
                                function_keys: fn_keys,
                                indicators,
                            });
                        }
                    }
                }
            }
        }

        if keyboards.is_empty() {
            keyboards.push(KeyboardDeviceInfo {
                name: "Integrated Laptop / Standard PC Keyboard".into(),
                device_id: "ACPI\\DEFAULT_KEYBOARD".into(),
                is_internal: true,
                function_keys: 12,
                indicators: 3,
            });
        }

        let keyboards_found = keyboards.len();
        let primary_device = keyboards
            .iter()
            .find(|k| k.is_internal)
            .map(|k| k.name.clone())
            .unwrap_or_else(|| keyboards[0].name.clone());

        HardwareDetectionReport {
            numlock_on,
            keyboards_found,
            keyboards,
            numpad_ready: true, // Always ready to receive WH_KEYBOARD_LL input
            primary_device,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_hw() {
        let report = HardwareManager::detect_hardware();
        println!("Hardware Detection Report: {:#?}", report);
    }
}
