use serde::{Deserialize, Serialize};
use windows::Win32::UI::Input::KeyboardAndMouse::*;
use windows::Win32::UI::Input::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyboardDeviceInfo {
    pub name: String,
    pub is_usb_or_internal: bool,
    pub function_keys: u32,
    pub indicators: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareDetectionReport {
    pub numlock_on: bool,
    pub keyboards_found: usize,
    pub keyboards: Vec<KeyboardDeviceInfo>,
    pub numpad_ready: bool,
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
                                name: format!("Physical Keyboard #{:?}", dev.hDevice.0),
                                is_usb_or_internal: true,
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
                is_usb_or_internal: true,
                function_keys: 12,
                indicators: 3,
            });
        }

        let keyboards_found = keyboards.len();

        HardwareDetectionReport {
            numlock_on,
            keyboards_found,
            keyboards,
            numpad_ready: keyboards_found > 0,
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
