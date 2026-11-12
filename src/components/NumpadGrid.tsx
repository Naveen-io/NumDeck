import React from 'react';
import {
  NumpadKey,
  ButtonConfig,
  NUMPAD_KEY_LABELS,
  Profile,
  DeckState,
} from '../types';
import { IconRenderer } from './IconRenderer';
import { CornerUpLeft, Plus, Folder } from 'lucide-react';

interface NumpadGridProps {
  deckState: DeckState;
  activeProfile: Profile;
  selectedKey: NumpadKey | null;
  onSelectKey: (key: NumpadKey) => void;
  physicallyPressedKey: NumpadKey | null;
  onNavigateFolder: (folderId: string | null) => void;
}

export const NumpadGrid: React.FC<NumpadGridProps> = ({
  deckState,
  activeProfile,
  selectedKey,
  onSelectKey,
  physicallyPressedKey,
  onNavigateFolder,
}) => {
  const activeFolderId = deckState.active_folder_id;
  const activeFolder = activeProfile.folders.find((f) => f.id === activeFolderId);
  const layoutType = deckState.settings.layout_type || 'standard_17';
  const cornerRadius = deckState.settings.button_corner_radius || 12;
  const showLabels = deckState.settings.show_labels;

  // Active keys mapping (folder or root keys)
  const currentKeys: Record<NumpadKey, ButtonConfig> = activeFolder
    ? activeFolder.keys
    : activeProfile.root_keys;

  const renderKeyTile = (
    key: NumpadKey,
    style?: React.CSSProperties,
    extraClass?: string
  ) => {
    const config = currentKeys[key] || {
      title: '',
      icon: '',
      accent_color: null,
      action: { type: 'none' },
      enabled: true,
    };

    const isConfigured = config.action.type !== 'none' || Boolean(config.title) || Boolean(config.icon);
    const isSelected = selectedKey === key;
    const isPhysicallyDown = physicallyPressedKey === key;
    const labelInfo = NUMPAD_KEY_LABELS[key];

    // Determine badge text
    let badgeText = '';
    switch (config.action.type) {
      case 'launch_app':
        badgeText = 'APP';
        break;
      case 'open_url':
        badgeText = 'URL';
        break;
      case 'open_file_folder':
        badgeText = 'FILE';
        break;
      case 'send_hotkey':
        badgeText = 'KEYS';
        break;
      case 'type_text':
        badgeText = 'TEXT';
        break;
      case 'system_media':
        badgeText = 'MEDIA';
        break;
      case 'navigate_folder':
        badgeText = config.action.payload.folder_id === '__BACK__' ? 'BACK' : 'DIR';
        break;
      case 'switch_profile':
        badgeText = 'PROF';
        break;
      case 'multi_action':
        badgeText = 'MULTI';
        break;
      default:
        badgeText = '';
    }

    const accentColor = config.accent_color || labelInfo.defaultColor;

    return (
      <div
        key={key}
        className={`numpad-key-tile ${isSelected ? 'selected' : ''} ${
          isPhysicallyDown ? 'key-physically-down' : ''
        } ${extraClass || ''}`}
        style={{
          borderRadius: `${cornerRadius}px`,
          position: 'relative',
          ...style,
        }}
        onClick={() => onSelectKey(key)}
      >
        {/* Accent Glow Pill at top of button */}
        {isConfigured && (
          <div
            className="key-glow-pill"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 8px ${accentColor}`,
            }}
          />
        )}

        {/* Physical Key Marker in upper-left corner */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '10px',
            fontSize: '11px',
            fontWeight: 700,
            color: isSelected ? '#60A5FA' : '#475569',
            letterSpacing: '0.04em',
          }}
        >
          {labelInfo.symbol}
        </div>

        {/* Action Type Badge in upper-right corner */}
        {badgeText && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              fontSize: '9px',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '3px',
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              color: accentColor,
              border: `1px solid ${accentColor}40`,
            }}
          >
            {badgeText}
          </div>
        )}

        {/* Button Content (Icon & Title) */}
        {isConfigured ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              zIndex: 2,
              padding: '6px',
              maxWidth: '92%',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: accentColor,
              }}
            >
              <IconRenderer name={config.icon} size={20} color={accentColor} />
            </div>
            {showLabels && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#F1F5F9',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {config.title || labelInfo.name}
              </span>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              opacity: 0.35,
            }}
          >
            <Plus size={18} color="#64748B" />
            <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 500 }}>Empty</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#0B0D12',
        overflow: 'hidden',
      }}
    >
      {/* Workspace Header with Breadcrumb and Folder Indicator */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #1A1F2B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: activeProfile.color || '#3B82F6',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>
              {activeProfile.name}
            </span>
            {activeFolder && (
              <>
                <span style={{ color: '#475569' }}>/</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Folder size={16} color="#F97316" />
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#F97316' }}>
                    {activeFolder.name}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {activeFolder ? (
          <button
            onClick={() => onNavigateFolder(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              color: '#F8FAFC',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <CornerUpLeft size={14} />
            <span>Back to Root Deck</span>
          </button>
        ) : (
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            Laptop Physical Numeric Keypad (17-Key Grid)
          </div>
        )}
      </div>

      {/* Grid Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            background: '#11141B',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #1E2330',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}
        >
          {layoutType === 'standard_17' ? (
            /* Standard 17-Key Physical Numpad Layout with tall Plus/Enter & wide Zero */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 96px)',
                gridTemplateRows: 'repeat(5, 96px)',
                gap: '12px',
              }}
            >
              {/* Row 1 */}
              {renderKeyTile('num_lock', { gridColumn: '1 / 2', gridRow: '1 / 2' })}
              {renderKeyTile('divide', { gridColumn: '2 / 3', gridRow: '1 / 2' })}
              {renderKeyTile('multiply', { gridColumn: '3 / 4', gridRow: '1 / 2' })}
              {renderKeyTile('subtract', { gridColumn: '4 / 5', gridRow: '1 / 2' })}

              {/* Row 2 */}
              {renderKeyTile('num7', { gridColumn: '1 / 2', gridRow: '2 / 3' })}
              {renderKeyTile('num8', { gridColumn: '2 / 3', gridRow: '2 / 3' })}
              {renderKeyTile('num9', { gridColumn: '3 / 4', gridRow: '2 / 3' })}
              {/* Plus: Spans Rows 2 and 3 */}
              {renderKeyTile('plus', { gridColumn: '4 / 5', gridRow: '2 / 4' })}

              {/* Row 3 */}
              {renderKeyTile('num4', { gridColumn: '1 / 2', gridRow: '3 / 4' })}
              {renderKeyTile('num5', { gridColumn: '2 / 3', gridRow: '3 / 4' })}
              {renderKeyTile('num6', { gridColumn: '3 / 4', gridRow: '3 / 4' })}

              {/* Row 4 */}
              {renderKeyTile('num1', { gridColumn: '1 / 2', gridRow: '4 / 5' })}
              {renderKeyTile('num2', { gridColumn: '2 / 3', gridRow: '4 / 5' })}
              {renderKeyTile('num3', { gridColumn: '3 / 4', gridRow: '4 / 5' })}
              {/* Enter: Spans Rows 4 and 5 */}
              {renderKeyTile('enter', { gridColumn: '4 / 5', gridRow: '4 / 6' })}

              {/* Row 5 */}
              {/* Zero: Spans Columns 1 and 2 */}
              {renderKeyTile('num0', { gridColumn: '1 / 3', gridRow: '5 / 6' })}
              {renderKeyTile('decimal', { gridColumn: '3 / 4', gridRow: '5 / 6' })}
            </div>
          ) : (
            /* Compact 18-Key Grid Layout */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 96px)',
                gridTemplateRows: 'repeat(5, 96px)',
                gap: '12px',
              }}
            >
              {renderKeyTile('num_lock')}
              {renderKeyTile('divide')}
              {renderKeyTile('multiply')}
              {renderKeyTile('subtract')}

              {renderKeyTile('num7')}
              {renderKeyTile('num8')}
              {renderKeyTile('num9')}
              {renderKeyTile('plus')}

              {renderKeyTile('num4')}
              {renderKeyTile('num5')}
              {renderKeyTile('num6')}
              {renderKeyTile('enter')}

              {renderKeyTile('num1')}
              {renderKeyTile('num2')}
              {renderKeyTile('num3')}
              {renderKeyTile('decimal')}

              {renderKeyTile('num0', { gridColumn: '1 / 3' })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info Strip */}
      <div
        style={{
          padding: '12px 24px',
          borderTop: '1px solid #1A1F2B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#64748B',
        }}
      >
        <div>
          Click any key to edit its command • Press physical numpad key to trigger or test
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>NumLock Independent</span>
          <span>•</span>
          <span>Zero-Lag Hook</span>
        </div>
      </div>
    </div>
  );
};
