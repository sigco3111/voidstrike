'use client';

import { useGameStore } from '@/store/gameStore';
import { BaseModal } from './BaseModal';

interface ShortcutCategory {
  name: string;
  shortcuts: { key: string; description: string }[];
}

const SHORTCUTS: ShortcutCategory[] = [
  {
    name: '카메라',
    shortcuts: [
      { key: 'W A S D / Arrow Keys', description: '카메라 이동' },
      { key: 'Q / E', description: '카메라 회전' },
      { key: 'Mouse Wheel', description: '확대/축소' },
      { key: 'Edge of Screen', description: '화면 가장자리로 이동' },
      { key: 'F5-F8', description: '저장된 위치로 점프' },
      { key: 'Ctrl + F5-F8', description: '카메라 위치 저장' },
    ],
  },
  {
    name: '선택',
    shortcuts: [
      { key: 'Left Click', description: '유닛/건물 선택' },
      { key: 'Left Drag', description: '유닛 박스 선택' },
      { key: 'Shift + Click', description: '선택에 추가/제거' },
      { key: 'Ctrl + Click', description: '화면상 같은 타입 모두 선택' },
      { key: 'Ctrl + 1-9', description: '제어 그룹 생성' },
      { key: '1-9', description: '제어 그룹 선택' },
      { key: 'Double-tap 1-9', description: '그룹에 카메라 중심 맞추기' },
      { key: 'Tab', description: '선택 내 하위 그룹 순환' },
    ],
  },
  {
    name: '명령',
    shortcuts: [
      { key: 'Right Click', description: '이동 / 공격 이동 / 채집' },
      { key: 'A + Click', description: '공격 이동 명령' },
      { key: 'M + Click', description: '이동 명령' },
      { key: 'P + Click', description: '위치 순찰' },
      { key: 'S', description: '모든 행동 정지' },
      { key: 'H', description: '위치 유지' },
      { key: 'Shift + Command', description: '명령 대기열 추가' },
    ],
  },
  {
    name: '생산',
    shortcuts: [
      { key: 'B', description: '기본 건물 건설' },
      { key: 'V', description: '고급 건물 건설' },
      { key: 'Q W E R', description: '유닛 훈련 (슬롯 1-4)' },
      { key: 'Escape / Right-Click', description: '현재 행동 취소' },
    ],
  },
  {
    name: '인터페이스',
    shortcuts: [
      { key: 'F1', description: '대기 중인 일꾼 선택' },
      { key: 'T', description: '기술 트리 열기' },
      { key: 'Space', description: '마지막 경보에 중심 맞추기' },
      { key: 'Pause', description: '게임 일시정지' },
      { key: '?', description: '도움말 패널 토글' },
    ],
  },
];

/**
 * Keyboard shortcuts help panel
 * NOTE: Edge scrolling is now controlled centrally by HUD.tsx via isAnyMenuOpen selector
 */
export function KeyboardShortcutsPanel() {
  const { showKeyboardShortcuts, setShowKeyboardShortcuts } = useGameStore();

  const handleClose = () => setShowKeyboardShortcuts(false);

  return (
    <BaseModal
      title="키보드 단축키"
      isOpen={showKeyboardShortcuts}
      onClose={handleClose}
      width="auto"
      maxWidth="64rem"
      maxHeight="90vh"
      backdropOpacity={0.8}
      closeKeys={['?']}
      closeHint="Press ? or Esc to close"
      className="bg-void-950 border-void-700"
      testId="keyboard-shortcuts-panel"
    >
      {/* Content */}
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SHORTCUTS.map((category) => (
            <div key={category.name}>
              <h3 className="font-display text-lg text-void-300 mb-3 border-b border-void-800 pb-2">
                {category.name}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <kbd className="bg-void-800 text-void-200 px-2 py-1 rounded text-xs font-mono min-w-[80px] text-center shrink-0">
                      {shortcut.key}
                    </kbd>
                    <span className="text-void-400 text-sm">{shortcut.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="mt-6 pt-4 border-t border-void-800 text-center text-void-500 text-sm">
          Press <kbd className="bg-void-800 px-2 py-0.5 rounded">?</kbd> or{' '}
          <kbd className="bg-void-800 px-2 py-0.5 rounded">Esc</kbd> to close
        </div>
      </div>
    </BaseModal>
  );
}
