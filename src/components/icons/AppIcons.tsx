import React from 'react';

interface AppIconProps {
  size?: number;
  className?: string;
}

// 1. Google Chrome
export const ChromeIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="24" r="20" fill="#EA4335" />
    <path d="M24 12A12 12 0 0 1 36 24H24V12Z" fill="#4285F4" opacity="0.1"/>
    <path d="M24 4C30.3 4 35.8 7.3 39 12.3L28.6 30.3C27.2 29.5 25.7 29 24 29C19.6 29 16 32.6 16 37H4.3C4.1 36 4 35 4 34C4 23 12.9 14.1 24 14.1V4Z" fill="#EA4335"/>
    <path d="M43.7 34C41.3 40.5 35.2 45.1 28 45.9L17.6 27.9C18.4 27.3 19.4 27 20.5 27C24.4 27 27.6 29.8 28.3 33.5L43.7 34Z" fill="#FBBC05"/>
    <path d="M4.3 37C6.8 42.5 12.2 46.4 18.5 46.9L29 28.9C28.2 29.6 27.2 30 26 30C22.7 30 20 27.3 20 24C20 22.3 20.7 20.8 21.8 19.7L8.2 12C5.6 16.3 4 21.4 4 27C4 30.5 4.8 33.9 6.2 37H4.3Z" fill="#34A853"/>
    <circle cx="24" cy="24" r="9" fill="#FFFFFF" />
    <circle cx="24" cy="24" r="7" fill="#4285F4" />
  </svg>
);

// 2. Microsoft Edge
export const EdgeIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M23.5 4C12.7 4 4 12.7 4 23.5C4 28.6 6 33.2 9.2 36.6C8.7 33.6 9.4 30.2 11.5 27.8C14.2 24.8 18.8 24.2 22.6 26.2C27.4 28.7 29.8 33.8 28.2 38.8C27 42.4 23.7 44.8 19.9 44.9C33.8 45.9 44 34.6 44 23.5C44 12.7 34.8 4 23.5 4Z" fill="#0078D7"/>
    <path d="M23.5 4C17.5 4 12.2 6.7 8.8 11C11.5 10.3 15.6 10.8 18.5 12.5C22.6 14.9 24.2 19.7 22.2 24C28 20 31.8 13.5 23.5 4Z" fill="#00BCF2"/>
    <path d="M11.5 27.8C8 31.7 8 37.6 11.6 41.5C14 44 17.5 44.8 19.9 44.9C15.8 44.8 12.2 41.5 12.2 37.2C12.2 33.4 14.8 30.8 17.8 29.5C15.5 28.2 13.2 27.7 11.5 27.8Z" fill="#2B88D8"/>
  </svg>
);

// 3. Mozilla Firefox
export const FirefoxIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="24" r="19" fill="#3B1C54" />
    <path d="M42 22C41.5 14 35 6 26 4C29 8 30 13 27 17C24.5 14 20.5 12 17 13C12 14.5 9 19.5 9.5 25C10 31 15 36 21 36C27 36 32 31 32 25C32 23 31.5 21 30.5 19.5C34 20.5 36.5 23.5 36.5 27C36.5 32 32.5 36 27.5 36.5C36 36.5 42.5 30 42 22Z" fill="#FF7139"/>
    <path d="M38 18C36 11 30.5 6 24 5C26.5 8 27.5 12 25 15C22 13 18 13 15 15C18 19 23 20 27 18C29 21 28 25 25 27C28 27 32 24 33 20C35 22 36 25 35 28C38 25 39 21 38 18Z" fill="#FF9400"/>
    <circle cx="24" cy="24" r="12" fill="#004D99" opacity="0.3"/>
  </svg>
);

// 4. Discord
export const DiscordIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect width="48" height="48" rx="12" fill="#5865F2"/>
    <path d="M34.8 14.5C32.7 13.5 30.4 12.8 28 12.5C27.7 13 27.4 13.7 27.1 14.3C24.5 13.9 21.9 13.9 19.4 14.3C19.1 13.7 18.8 13 18.5 12.5C16.1 12.8 13.8 13.5 11.7 14.5C7.5 20.7 6.4 26.8 7 32.7C9.7 34.7 12.4 36 15 36.8C15.6 35.9 16.2 35 16.7 34C15.8 33.6 14.9 33.2 14 32.6C14.2 32.4 14.4 32.2 14.7 32C20 34.5 26.5 34.5 31.8 32C32.1 32.2 32.3 32.4 32.5 32.6C31.6 33.2 30.7 33.6 29.8 34C30.3 35 30.9 35.9 31.5 36.8C34.1 36 36.8 34.7 39.5 32.7C40.2 25.8 38.3 19.8 34.8 14.5ZM18.5 28.5C16.9 28.5 15.6 27.1 15.6 25.4C15.6 23.7 16.9 22.3 18.5 22.3C20.1 22.3 21.4 23.7 21.4 25.4C21.4 27.1 20.1 28.5 18.5 28.5ZM28 28.5C26.4 28.5 25.1 27.1 25.1 25.4C25.1 23.7 26.4 22.3 28 22.3C29.6 22.3 30.9 23.7 30.9 25.4C30.9 27.1 29.6 28.5 28 28.5Z" fill="#FFFFFF"/>
  </svg>
);

// 5. Spotify
export const SpotifyIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="24" r="22" fill="#1DB954" />
    <path d="M33.8 31.2C33.4 31.8 32.6 32 32 31.6C26.5 28.2 19.6 27.5 11.5 29.3C10.8 29.5 10.1 29 10 28.3C9.8 27.6 10.3 26.9 11 26.8C19.9 24.8 27.5 25.6 33.7 29.4C34.2 29.7 34.3 30.5 33.8 31.2ZM36.6 25.4C36.1 26.2 35 26.5 34.2 26C28 22.2 18.5 21.1 11.1 23.3C10.2 23.6 9.2 23 8.9 22.1C8.6 21.2 9.2 20.2 10.1 19.9C18.6 17.3 29.1 18.6 36.2 23C37 23.4 37.2 24.5 36.6 25.4ZM37 19.3C29.5 14.8 17.1 14.4 10 16.6C8.8 17 7.6 16.3 7.2 15.2C6.8 14 7.5 12.8 8.7 12.4C16.9 9.9 30.5 10.4 39.1 15.5C40.2 16.1 40.5 17.6 39.8 18.6C39.2 19.6 37.9 20 37 19.3Z" fill="#121212"/>
  </svg>
);

// 6. Visual Studio Code
export const VSCodeIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M36.7 4.1C35.8 3.7 34.7 3.9 34 4.5L14.7 20.8L8.6 16.1C7.8 15.5 6.7 15.6 6 16.2L2.5 19.4C1.8 20 1.8 21.1 2.4 21.7L7.3 25.8L2.4 29.9C1.8 30.5 1.8 31.6 2.5 32.2L6 35.4C6.7 36 7.8 36.1 8.6 35.5L14.7 30.8L34 47.1C34.7 47.7 35.8 47.9 36.7 47.5C37.6 47.1 38.2 46.2 38.2 45.2V6.4C38.2 5.4 37.6 4.5 36.7 4.1Z" fill="#007ACC"/>
    <path d="M38.2 14.5L25.8 24L38.2 33.5V14.5Z" fill="#1F9CF0"/>
    <path d="M14.7 20.8L34 4.5C34.7 3.9 35.8 3.7 36.7 4.1L19.4 24.5L14.7 20.8Z" fill="#0065A9"/>
  </svg>
);

// 7. Visual Studio (IDE)
export const VisualStudioIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M35.5 3.5C34.7 3.1 33.7 3.3 33.1 3.9L15.2 19.2L9.6 14.8C8.8 14.2 7.7 14.3 7.1 14.9L3.5 18.2C2.8 18.8 2.8 19.9 3.4 20.5L7.8 24L3.4 27.5C2.8 28.1 2.8 29.2 3.5 29.8L7.1 33.1C7.7 33.7 8.8 33.8 9.6 33.2L15.2 28.8L33.1 44.1C33.7 44.7 34.7 44.9 35.5 44.5C36.3 44.1 36.8 43.3 36.8 42.4V5.6C36.8 4.7 36.3 3.9 35.5 3.5Z" fill="#5C2D91"/>
    <path d="M36.8 14.5L23.5 24L36.8 33.5V14.5Z" fill="#865FC5"/>
  </svg>
);

// 8. Steam
export const SteamIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="24" r="22" fill="#171A21" stroke="#252C39" stroke-width="2"/>
    <path d="M24 6C15.2 6 7.9 12.3 6.3 20.7L15.8 24.6C16.8 23.6 18.3 23 20 23C23.3 23 26 25.7 26 29C26 29.4 25.9 29.8 25.8 30.2L33.9 34.3C37.6 31.9 40 27.7 40 23C40 13.6 32.8 6 24 6Z" fill="#1999D4"/>
    <circle cx="34" cy="23" r="5" fill="#171A21" stroke="#FFFFFF" stroke-width="2.5"/>
    <circle cx="20" cy="29" r="4" fill="#171A21" stroke="#FFFFFF" stroke-width="2"/>
  </svg>
);

// 9. OBS Studio
export const OBSIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="24" r="22" fill="#1E232B" stroke="#303846" stroke-width="2"/>
    <path d="M24 10C16.3 10 10 16.3 10 24C10 28.5 12.2 32.5 15.6 35L20.8 26C20.3 25.4 20 24.7 20 24C20 21.8 21.8 20 24 20C24.8 20 25.6 20.3 26.2 20.8L35.2 15.6C32.5 12.2 28.5 10 24 10Z" fill="#FFFFFF"/>
    <path d="M38 24C38 19.5 35.8 15.5 32.4 13L27.2 22C27.7 22.6 28 23.3 28 24C28 26.2 26.2 28 24 28C23.2 28 22.4 27.7 21.8 27.2L12.8 32.4C15.5 35.8 19.5 38 24 38C31.7 38 38 31.7 38 24Z" fill="#929CAC"/>
  </svg>
);

// 10. Windows File Explorer
export const ExplorerIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M6 12C6 9.8 7.8 8 10 8H19L24 13H38C40.2 13 42 14.8 42 17V36C42 38.2 40.2 40 38 40H10C7.8 40 6 38.2 6 36V12Z" fill="#FFA000"/>
    <path d="M6 18H42V36C42 38.2 40.2 40 38 40H10C7.8 40 6 38.2 6 36V18Z" fill="#FFCA28"/>
    <rect x="10" y="14" width="16" height="4" rx="2" fill="#42A5F5"/>
  </svg>
);

// 11. Windows Notepad
export const NotepadIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="8" y="6" width="32" height="36" rx="4" fill="#0078D7"/>
    <rect x="12" y="10" width="24" height="28" rx="2" fill="#F4F6FA"/>
    <line x1="16" y1="16" x2="32" y2="16" stroke="#0078D7" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="16" y1="22" x2="28" y2="22" stroke="#929CAC" stroke-width="2" stroke-linecap="round"/>
    <line x1="16" y1="28" x2="30" y2="28" stroke="#929CAC" stroke-width="2" stroke-linecap="round"/>
    <line x1="16" y1="34" x2="24" y2="34" stroke="#929CAC" stroke-width="2" stroke-linecap="round"/>
  </svg>
);

// 12. Windows Terminal
export const WindowsTerminalIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect width="48" height="48" rx="10" fill="#12151C" stroke="#252C39" stroke-width="2"/>
    <path d="M14 16L22 24L14 32" stroke="#4EC9B0" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="26" y1="32" x2="34" y2="32" stroke="#F4F6FA" stroke-width="3.5" stroke-linecap="round"/>
  </svg>
);

// 13. VLC Media Player
export const VLCIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M21.5 6L14 36H34L26.5 6H21.5Z" fill="#FF7800"/>
    <path d="M18.8 17H29.2L27.7 23H20.3L18.8 17Z" fill="#FFFFFF"/>
    <path d="M16.5 26H31.5L29.8 33H18.2L16.5 26Z" fill="#FFFFFF"/>
    <ellipse cx="24" cy="38" rx="16" ry="4" fill="#FF7800"/>
  </svg>
);

// 14. Adobe Photoshop
export const PhotoshopIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect width="48" height="48" rx="10" fill="#001E36" stroke="#31A8FF" stroke-width="2"/>
    <text x="11" y="32" fill="#31A8FF" font-family="'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="bold">Ps</text>
  </svg>
);

// 15. Adobe Premiere Pro
export const PremiereIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect width="48" height="48" rx="10" fill="#250036" stroke="#EA77FF" stroke-width="2"/>
    <text x="11" y="32" fill="#EA77FF" font-family="'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="bold">Pr</text>
  </svg>
);

// 16. Blender
export const BlenderIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect width="48" height="48" rx="10" fill="#222A35" stroke="#303846" stroke-width="2"/>
    <path d="M24 16L34 26C36.5 28.5 36.5 32.5 34 35C31.5 37.5 27.5 37.5 25 35L17 27" stroke="#EA7600" stroke-width="4" stroke-linecap="round"/>
    <circle cx="24" cy="27" r="7" fill="#EA7600"/>
    <circle cx="24" cy="27" r="3.5" fill="#2277DD"/>
    <line x1="24" y1="12" x2="24" y2="18" stroke="#EA7600" stroke-width="4" stroke-linecap="round"/>
    <line x1="14" y1="18" x2="19" y2="22" stroke="#EA7600" stroke-width="4" stroke-linecap="round"/>
  </svg>
);

// 17. Microsoft Excel
export const ExcelIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect width="48" height="48" rx="10" fill="#107C41" />
    <path d="M14 14L34 34M34 14L14 34" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
  </svg>
);

// 18. Microsoft Word
export const WordIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect width="48" height="48" rx="10" fill="#185ABD" />
    <path d="M12 16L18 32L24 19L30 32L36 16" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
);

// 19. Microsoft Teams
export const TeamsIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect width="48" height="48" rx="10" fill="#6264A7" />
    <circle cx="31" cy="18" r="4.5" fill="#FFFFFF"/>
    <path d="M26 27C26 24.5 28.2 22.5 31 22.5C33.8 22.5 36 24.5 36 27V32H26V27Z" fill="#FFFFFF"/>
    <circle cx="19" cy="20" r="5.5" fill="#FFFFFF"/>
    <path d="M12 31C12 28 15 25.5 19 25.5C23 25.5 26 28 26 31V35H12V31Z" fill="#FFFFFF"/>
  </svg>
);

// 20. Slack
export const SlackIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect width="48" height="48" rx="10" fill="#4A154B" />
    <circle cx="16" cy="21" r="3" fill="#36C5F0"/>
    <rect x="21" y="18" width="11" height="6" rx="3" fill="#2EB67D"/>
    <circle cx="27" cy="16" r="3" fill="#2EB67D"/>
    <rect x="18" y="21" width="6" height="11" rx="3" fill="#ECB22E"/>
    <circle cx="32" cy="27" r="3" fill="#E01E5A"/>
    <rect x="16" y="24" width="11" height="6" rx="3" fill="#36C5F0"/>
  </svg>
);

// 21. YouTube
export const YouTubeIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect width="48" height="48" rx="10" fill="#FF0000" />
    <path d="M38 17.5C37.6 15.5 36.1 14 34.1 13.5C31.5 13 24 13 24 13C24 13 16.5 13 13.9 13.5C11.9 14 10.4 15.5 10 17.5C9.5 20.5 9.5 24 9.5 24C9.5 24 9.5 27.5 10 30.5C10.4 32.5 11.9 34 13.9 34.5C16.5 35 24 35 24 35C24 35 31.5 35 34.1 34.5C36.1 34 37.6 32.5 38 30.5C38.5 27.5 38.5 24 38.5 24C38.5 24 38.5 20.5 38 17.5Z" fill="#FFFFFF"/>
    <polygon points="21,19 21,29 30,24" fill="#FF0000" />
  </svg>
);

// 22. Twitch
export const TwitchIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect width="48" height="48" rx="10" fill="#9146FF" />
    <path d="M12 9L9 16V35H17V39H21L25 35H31L39 27V9H12ZM35 25L30 30H24L20 34V30H15V14H35V25Z" fill="#FFFFFF"/>
    <rect x="23" y="19" width="3" height="6" fill="#9146FF"/>
    <rect x="30" y="19" width="3" height="6" fill="#9146FF"/>
  </svg>
);

// 23. GitHub
export const GitHubIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="24" r="22" fill="#24292F" />
    <path fillRule="evenodd" clipRule="evenodd" d="M24 8C15.16 8 8 15.16 8 24C8 31.07 12.59 37.07 18.96 39.19C19.76 39.34 20.05 38.84 20.05 38.42C20.05 38.04 20.04 36.78 20.03 35.43C15.58 36.4 14.64 33.51 14.64 33.51C13.91 31.66 12.87 31.17 12.87 31.17C11.42 30.18 12.98 30.2 12.98 30.2C14.59 30.31 15.43 31.85 15.43 31.85C16.86 34.3 19.18 33.6 20.09 33.19C20.24 32.15 20.65 31.45 21.11 31.05C17.56 30.65 13.82 29.28 13.82 23.16C13.82 21.42 14.44 19.99 15.46 18.87C15.3 18.47 14.75 16.84 15.62 14.64C15.62 14.64 16.96 14.21 20.01 16.27C21.28 15.92 22.64 15.74 24 15.74C25.36 15.74 26.72 15.92 27.99 16.27C31.04 14.21 32.38 14.64 32.38 14.64C33.25 16.84 32.7 18.47 32.54 18.87C33.56 19.99 34.18 21.42 34.18 23.16C34.18 29.3 30.43 30.64 26.87 31.04C27.44 31.54 27.95 32.51 27.95 34C27.95 36.16 27.93 37.89 27.93 38.42C27.93 38.84 28.22 39.35 29.03 39.19C35.4 37.06 40 31.07 40 24C40 15.16 32.84 8 24 8Z" fill="#FFFFFF"/>
  </svg>
);

// 24. Notion
export const NotionIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect width="48" height="48" rx="10" fill="#191919" stroke="#333333" strokeWidth="2"/>
    <path d="M14 13L30 11L34 15V35L29 36L19 22V35L14 36V13Z" fill="#FFFFFF"/>
    <path d="M20 14L32 12.5V16L24 27L20 22V14Z" fill="#E2E8F0"/>
  </svg>
);

// 25. Gmail / Email
export const GmailIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect width="48" height="48" rx="10" fill="#FFFFFF" />
    <path d="M10 14C8.9 14 8 14.9 8 16V32C8 33.1 8.9 34 10 34H14V21.5L24 29L34 21.5V34H38C39.1 34 40 33.1 40 32V16C40 14.9 39.1 14 38 14H36L24 23L12 14H10Z" fill="#EA4335"/>
    <polygon points="8,16 8,24 18,17 18,14" fill="#4285F4"/>
    <polygon points="40,16 40,24 30,17 30,14" fill="#34A853"/>
    <polygon points="34,21.5 40,26 40,32 34,34" fill="#FBBC05"/>
  </svg>
);

// 26. Google Calendar
export const GoogleCalendarIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect width="48" height="48" rx="10" fill="#FFFFFF" />
    <path d="M10 12H38V16H10V12Z" fill="#4285F4"/>
    <path d="M10 16H38V36C38 37.1 37.1 38 36 38H12C10.9 38 10 37.1 10 36V16Z" fill="#F8FAFC"/>
    <text x="24" y="32" fill="#1E293B" fontFamily="'Segoe UI', Roboto, sans-serif" fontSize="16" fontWeight="bold" textAnchor="middle">31</text>
  </svg>
);

// 27. Google Drive
export const GoogleDriveIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect width="48" height="48" rx="10" fill="#181E29" />
    <path d="M19 12L10 27L14.5 35L23.5 20L19 12Z" fill="#0F9D58"/>
    <path d="M29 12H19L23.5 20H33.5L29 12Z" fill="#FFBB00"/>
    <path d="M23.5 20L14.5 35H34.5L38 29L33.5 20H23.5Z" fill="#4285F4"/>
  </svg>
);

// 28. Instagram
export const InstagramIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <defs>
      <radialGradient id="igGrad" cx="20%" cy="100%" r="130%">
        <stop offset="0%" stopColor="#FFD600"/>
        <stop offset="25%" stopColor="#FF7A00"/>
        <stop offset="50%" stopColor="#FF0069"/>
        <stop offset="75%" stopColor="#D300C5"/>
        <stop offset="100%" stopColor="#7638FA"/>
      </radialGradient>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#igGrad)" />
    <rect x="12" y="12" width="24" height="24" rx="7" stroke="#FFFFFF" strokeWidth="3" fill="none"/>
    <circle cx="24" cy="24" r="6" stroke="#FFFFFF" strokeWidth="3" fill="none"/>
    <circle cx="31" cy="17" r="1.5" fill="#FFFFFF"/>
  </svg>
);

// 29. Twitter / X
export const TwitterXIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect width="48" height="48" rx="10" fill="#000000" />
    <path d="M14 13L22.5 24.5L14 35H16.5L23.6 26.1L29.6 35H35L26 22.8L33.8 13H31.3L24.8 21.2L19.4 13H14ZM17.8 15H20.4L31.2 33H28.6L17.8 15Z" fill="#FFFFFF"/>
  </svg>
);

// 30. Reddit
export const RedditIcon: React.FC<AppIconProps> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="24" r="22" fill="#FF4500" />
    <circle cx="24" cy="26" r="11" fill="#FFFFFF"/>
    <circle cx="14" cy="25" r="3.5" fill="#FFFFFF"/>
    <circle cx="34" cy="25" r="3.5" fill="#FFFFFF"/>
    <circle cx="19" cy="25" r="2.5" fill="#FF4500"/>
    <circle cx="29" cy="25" r="2.5" fill="#FF4500"/>
    <path d="M20 30C21.5 32 26.5 32 28 30" stroke="#FF4500" strokeWidth="2" strokeLinecap="round"/>
    <path d="M24 15L27 10L32 11" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="32" cy="11" r="2" fill="#FFFFFF"/>
  </svg>
);

// Registry of supported applications for fast lookup
export const KNOWN_APP_ICONS: Record<string, React.FC<AppIconProps>> = {
  chrome: ChromeIcon,
  googlechrome: ChromeIcon,
  edge: EdgeIcon,
  msedge: EdgeIcon,
  firefox: FirefoxIcon,
  discord: DiscordIcon,
  spotify: SpotifyIcon,
  vscode: VSCodeIcon,
  code: VSCodeIcon,
  visualstudio: VisualStudioIcon,
  devenv: VisualStudioIcon,
  steam: SteamIcon,
  obs: OBSIcon,
  obs64: OBSIcon,
  explorer: ExplorerIcon,
  notepad: NotepadIcon,
  terminal: WindowsTerminalIcon,
  wt: WindowsTerminalIcon,
  vlc: VLCIcon,
  photoshop: PhotoshopIcon,
  premiere: PremiereIcon,
  blender: BlenderIcon,
  excel: ExcelIcon,
  word: WordIcon,
  teams: TeamsIcon,
  msteams: TeamsIcon,
  slack: SlackIcon,
  youtube: YouTubeIcon,
  twitch: TwitchIcon,
  github: GitHubIcon,
  notion: NotionIcon,
  gmail: GmailIcon,
  mail: GmailIcon,
  calendar: GoogleCalendarIcon,
  googlecalendar: GoogleCalendarIcon,
  drive: GoogleDriveIcon,
  googledrive: GoogleDriveIcon,
  instagram: InstagramIcon,
  twitter: TwitterXIcon,
  x: TwitterXIcon,
  reddit: RedditIcon,
};

export const getAppIconComponent = (iconKey: string): React.FC<AppIconProps> | null => {
  const normalized = iconKey.toLowerCase().replace(/[\s\-_.]/g, '');
  return KNOWN_APP_ICONS[normalized] || null;
};
