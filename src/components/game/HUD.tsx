'use client';

import { useCallback, useEffect, memo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useUIStore, isAnyMenuOpen, GameOverlayType } from '@/store/uiStore';
import { useGameSetupStore, isMultiplayerMode } from '@/store/gameSetupStore';
import { setEdgeScrollEnabled } from '@/store/cameraStore';
import { Minimap } from './Minimap';
import { ResourcePanel } from './ResourcePanel';
import { SelectionPanel } from './SelectionPanel';
import { CommandCard } from './CommandCard';
import { TechTreePanel } from './TechTreePanel';
import { IdleWorkerButton } from './IdleWorkerButton';
import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';
import { PlayerStatusPanel } from './PlayerStatusPanel';
import { SoundOptionsPanel } from './SoundOptionsPanel';
import { PerformancePanel } from './PerformancePanel';
import { BattleSimulatorPanel } from './BattleSimulatorPanel';
import { ConsolePanel } from './ConsolePanel';

// Legend configuration for each overlay type
const OVERLAY_LEGENDS: Record<Exclude<GameOverlayType, 'none'>, { title: string; items: Array<{ color: string; label: string }> }> = {
  elevation: {
    title: '고도 오버레이',
    items: [
      { color: 'bg-yellow-400', label: '고지대' },
      { color: 'bg-blue-400', label: '중간 지대' },
      { color: 'bg-green-700', label: '저지대' },
    ],
  },
  threat: {
    title: '위협 오버레이',
    items: [
      { color: 'bg-red-600', label: '적 공격 범위' },
      { color: 'bg-red-900', label: '다중 위협' },
    ],
  },
  navmesh: {
    title: '내비mesh 오버레이',
    items: [
      { color: 'bg-green-500', label: '연결됨 (이동 가능)' },
      { color: 'bg-cyan-400', label: '연결된 램프' },
      { color: 'bg-yellow-500', label: '분리된 영역' },
      { color: 'bg-fuchsia-500', label: '분리된 램프' },
      { color: 'bg-red-500', label: '내비mesh 외부' },
      { color: 'bg-gray-600', label: '이동 불가' },
    ],
  },
  resource: {
    title: '자원 오버레이',
    items: [
      { color: 'bg-blue-400', label: '미네랄' },
      { color: 'bg-green-400', label: '가스' },
    ],
  },
  buildable: {
    title: '건설 가능 오버레이',
    items: [
      { color: 'bg-green-500', label: '건설 가능' },
      { color: 'bg-red-500', label: '건설 불가' },
    ],
  },
};

// Overlay Legend Component
const OverlayLegend = memo(function OverlayLegend({ overlayType }: { overlayType: Exclude<GameOverlayType, 'none'> }) {
  const legend = OVERLAY_LEGENDS[overlayType];
  if (!legend) return null;

  return (
    <div className="bg-void-900/90 border border-void-700 rounded-lg p-3 shadow-lg backdrop-blur-sm min-w-48">
      <h3 className="text-sm font-display text-void-200 mb-2 pb-1 border-b border-void-700">
        {legend.title}
      </h3>
      <div className="space-y-1">
        {legend.items.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-xs text-void-300">
            <div className={`w-3 h-3 rounded-sm ${item.color}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-1 border-t border-void-700 text-xs text-void-500">
        Press O to cycle
      </div>
    </div>
  );
});

// PERF: Wrap HUD in memo to prevent unnecessary re-renders when parent state changes
export const HUD = memo(function HUD() {
  const { isPaused, togglePause, setShowTechTree, setShowKeyboardShortcuts, showKeyboardShortcuts, showTechTree, isGameReady } = useGameStore();
  const {
    toggleGraphicsOptions, showGraphicsOptions,
    toggleSoundOptions, showSoundOptions,
    toggleDebugMenu, showDebugMenu,
    togglePerformancePanel, showPerformancePanel,
    isFullscreen, toggleFullscreen, setFullscreen,
    overlaySettings, toggleOverlay,
    // Centralized menu state
    showOptionsMenu, setShowOptionsMenu,
    showOverlayMenu, setShowOverlayMenu,
    showPlayerStatus, setShowPlayerStatus,
    // Debug console
    consoleEnabled, setConsoleEnabled, showConsole, toggleConsole,
  } = useUIStore();
  const isBattleSimulator = useGameSetupStore((state) => state.isBattleSimulator);
  const isEditorPreview = useGameSetupStore((state) => state.isEditorPreview);

  // Single source of truth for whether any menu is open (for edge scroll control)
  const anyMenuOpen = useUIStore(isAnyMenuOpen);
  const anyModalOpen = showKeyboardShortcuts || showTechTree;

  // Disable edge scrolling when mouse is over UI elements
  // IMPORTANT: All hooks must be called before any early returns to comply with React's rules of hooks
  const handleUIMouseEnter = useCallback(() => {
    setEdgeScrollEnabled(false);
  }, []);

  const handleUIMouseLeave = useCallback(() => {
    setEdgeScrollEnabled(true);
  }, []);

  // CENTRALIZED edge scroll control - single source of truth
  // Disable edge scrolling when game is paused OR any menu/modal is open
  useEffect(() => {
    const shouldDisableEdgeScroll = isPaused || anyMenuOpen || anyModalOpen;
    setEdgeScrollEnabled(!shouldDisableEdgeScroll);
  }, [isPaused, anyMenuOpen, anyModalOpen]);

  // Sync fullscreen state with browser
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    setFullscreen(!!document.fullscreenElement);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [setFullscreen]);

  // Don't render HUD until game is ready (prevents flash during loading)
  // This early return is placed AFTER all hooks to comply with React's rules of hooks
  if (!isGameReady) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-2 pointer-events-auto">
        {/* Resources (includes game time) - hidden in simulator mode */}
        {!isBattleSimulator && <ResourcePanel />}
        {isBattleSimulator && <div />}

        {/* Menu buttons */}
        <div
          className="flex gap-2"
          onMouseEnter={handleUIMouseEnter}
          onMouseLeave={handleUIMouseLeave}
        >
          <IdleWorkerButton />
          <div className="relative">
            <button
              onClick={() => {
                // Close any open option panels first
                if (showGraphicsOptions) toggleGraphicsOptions();
                if (showSoundOptions) toggleSoundOptions();
                if (showPerformancePanel) togglePerformancePanel();
                if (showDebugMenu) toggleDebugMenu();
                // Then toggle the main options menu
                setShowOptionsMenu(!showOptionsMenu);
                setShowOverlayMenu(false);
              }}
              className="game-button text-sm"
            >
              Options
            </button>
            {showOptionsMenu && (
              <div className="absolute right-0 top-full mt-1 bg-void-900 border border-void-700 rounded shadow-lg z-50 min-w-[160px]">
                {/* GAME section */}
                <div className="px-3 py-1 text-[10px] font-medium text-void-500 uppercase tracking-wider">게임</div>
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    togglePause();
                  }}
                  className="w-full px-4 py-1.5 text-left text-sm text-void-200 hover:bg-void-800 transition-colors"
                >
                  {isPaused ? '계속' : '일시정지'}
                </button>
                {isEditorPreview && (
                  <button
                    onClick={() => {
                      window.location.href = '/game/setup/editor';
                    }}
                    className="w-full px-4 py-1.5 text-left text-sm text-cyan-400 hover:bg-void-800 transition-colors"
                  >
                    Back to Editor
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm('Return to main menu? Progress will be lost.')) {
                      window.location.href = '/';
                    }
                  }}
                  className="w-full px-4 py-1.5 text-left text-sm text-red-400 hover:bg-void-800 transition-colors"
                >
                  Exit to Menu
                </button>

                {/* DISPLAY section */}
                <div className="border-t border-void-700 mt-1" />
                <div className="px-3 py-1 text-[10px] font-medium text-void-500 uppercase tracking-wider">디스플레이</div>
                <button
                  onClick={toggleFullscreen}
                  className="w-full px-4 py-1.5 text-left text-sm text-void-200 hover:bg-void-800 transition-colors flex justify-between items-center"
                >
                  <span>전체화면</span>
                  <span className={isFullscreen ? 'text-green-400' : 'text-void-500'}>{isFullscreen ? 'ON' : 'OFF'}</span>
                </button>
                <button
                  onClick={() => setShowPlayerStatus(!showPlayerStatus)}
                  className="w-full px-4 py-1.5 text-left text-sm text-void-200 hover:bg-void-800 transition-colors flex justify-between items-center"
                >
                  <span>플레이어</span>
                  <span className={showPlayerStatus ? 'text-green-400' : 'text-void-500'}>{showPlayerStatus ? 'ON' : 'OFF'}</span>
                </button>
                {/* Overlays submenu */}
                <div className="relative">
                  <button
                    onClick={() => setShowOverlayMenu(!showOverlayMenu)}
                    className="w-full px-4 py-1.5 text-left text-sm text-void-200 hover:bg-void-800 transition-colors flex justify-between items-center"
                  >
                    <span>오버레이</span>
                    <span className="flex items-center gap-1">
                      {overlaySettings.activeOverlay !== 'none' && (
                        <span className="text-green-400 text-xs px-1.5 py-0.5 bg-green-900/50 rounded">
                          {overlaySettings.activeOverlay === 'elevation' ? 'ELV' :
                           overlaySettings.activeOverlay === 'threat' ? 'THR' :
                           overlaySettings.activeOverlay === 'navmesh' ? 'NAV' :
                           overlaySettings.activeOverlay === 'resource' ? 'RES' :
                           overlaySettings.activeOverlay === 'buildable' ? 'BLD' : ''}
                        </span>
                      )}
                      <span className="text-void-500">▸</span>
                    </span>
                  </button>
                  {showOverlayMenu && (
                    <div className="absolute right-full top-0 mr-1 bg-void-900 border border-void-700 rounded shadow-lg z-50 min-w-[180px]">
                      <button
                        onClick={() => {
                          toggleOverlay('elevation');
                          setShowOverlayMenu(false);
                        }}
                        className={`w-full px-4 py-1.5 text-left text-sm hover:bg-void-800 transition-colors flex justify-between items-center ${
                          overlaySettings.activeOverlay === 'elevation' ? 'text-cyan-400' : 'text-void-200'
                        }`}
                      >
                        <span>고도</span>
                        {overlaySettings.activeOverlay === 'elevation' && <span>켜짐</span>}
                      </button>
                      <button
                        onClick={() => {
                          toggleOverlay('threat');
                          setShowOverlayMenu(false);
                        }}
                        className={`w-full px-4 py-1.5 text-left text-sm hover:bg-void-800 transition-colors flex justify-between items-center ${
                          overlaySettings.activeOverlay === 'threat' ? 'text-red-400' : 'text-void-200'
                        }`}
                      >
                        <span>위협</span>
                        {overlaySettings.activeOverlay === 'threat' && <span>켜짐</span>}
                      </button>
                      <button
                        onClick={() => {
                          toggleOverlay('navmesh');
                          setShowOverlayMenu(false);
                        }}
                        className={`w-full px-4 py-1.5 text-left text-sm hover:bg-void-800 transition-colors flex justify-between items-center ${
                          overlaySettings.activeOverlay === 'navmesh' ? 'text-purple-400' : 'text-void-200'
                        }`}
                      >
                        <span>내비mesh</span>
                        {overlaySettings.activeOverlay === 'navmesh' && <span>켜짐</span>}
                      </button>
                      <button
                        onClick={() => {
                          toggleOverlay('resource');
                          setShowOverlayMenu(false);
                        }}
                        className={`w-full px-4 py-1.5 text-left text-sm hover:bg-void-800 transition-colors flex justify-between items-center ${
                          overlaySettings.activeOverlay === 'resource' ? 'text-blue-400' : 'text-void-200'
                        }`}
                      >
                        <span>자원</span>
                        {overlaySettings.activeOverlay === 'resource' && <span>켜짐</span>}
                      </button>
                      <button
                        onClick={() => {
                          toggleOverlay('buildable');
                          setShowOverlayMenu(false);
                        }}
                        className={`w-full px-4 py-1.5 text-left text-sm hover:bg-void-800 transition-colors flex justify-between items-center ${
                          overlaySettings.activeOverlay === 'buildable' ? 'text-green-400' : 'text-void-200'
                        }`}
                      >
                        <span>건설 가능</span>
                        {overlaySettings.activeOverlay === 'buildable' && <span>켜짐</span>}
                      </button>
                      <div className="border-t border-void-700 my-1" />
                      <div className="px-4 py-1 text-xs text-void-500">
                        Press O to cycle
                      </div>
                    </div>
                  )}
                </div>

                {/* SETTINGS section */}
                <div className="border-t border-void-700 mt-1" />
                <div className="px-3 py-1 text-[10px] font-medium text-void-500 uppercase tracking-wider">설정</div>
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    toggleGraphicsOptions();
                  }}
                  className="w-full px-4 py-1.5 text-left text-sm text-void-200 hover:bg-void-800 transition-colors flex justify-between items-center"
                >
                  <span>그래픽</span>
                  <span className={showGraphicsOptions ? 'text-green-400' : 'text-void-500'}>{showGraphicsOptions ? '열림' : ''}</span>
                </button>
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    toggleSoundOptions();
                  }}
                  className="w-full px-4 py-1.5 text-left text-sm text-void-200 hover:bg-void-800 transition-colors flex justify-between items-center"
                >
                  <span>사운드</span>
                  <span className={showSoundOptions ? 'text-green-400' : 'text-void-500'}>{showSoundOptions ? '열림' : ''}</span>
                </button>

                {/* REFERENCE section */}
                <div className="border-t border-void-700 mt-1" />
                <div className="px-3 py-1 text-[10px] font-medium text-void-500 uppercase tracking-wider">참고</div>
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setShowKeyboardShortcuts(true);
                  }}
                  className="w-full px-4 py-1.5 text-left text-sm text-void-200 hover:bg-void-800 transition-colors"
                >
                  Controls
                </button>
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setShowTechTree(true);
                  }}
                  className="w-full px-4 py-1.5 text-left text-sm text-void-200 hover:bg-void-800 transition-colors"
                >
                  Tech Tree
                </button>

                {/* DEBUG section */}
                <div className="border-t border-void-700 mt-1" />
                <div className="px-3 py-1 text-[10px] font-medium text-void-500 uppercase tracking-wider">디버그</div>
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    togglePerformancePanel();
                  }}
                  className="w-full px-4 py-1.5 text-left text-sm text-void-200 hover:bg-void-800 transition-colors flex justify-between items-center"
                >
                  <span>성능</span>
                  <span className={showPerformancePanel ? 'text-green-400' : 'text-void-500'}>{showPerformancePanel ? '열림' : ''}</span>
                </button>
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    toggleDebugMenu();
                  }}
                  className="w-full px-4 py-1.5 text-left text-sm text-void-200 hover:bg-void-800 transition-colors flex justify-between items-center"
                >
                  <span>디버그 패널</span>
                  <span className={showDebugMenu ? 'text-green-400' : 'text-void-500'}>{showDebugMenu ? '열림' : ''}</span>
                </button>
                {/* Console - only available in single player */}
                {!isMultiplayerMode() && (
                  <button
                    onClick={() => {
                      if (!consoleEnabled) {
                        setConsoleEnabled(true);
                        toggleConsole();
                      } else {
                        toggleConsole();
                      }
                      setShowOptionsMenu(false);
                    }}
                    className="w-full px-4 py-1.5 text-left text-sm text-void-200 hover:bg-void-800 transition-colors flex justify-between items-center"
                  >
                    <span>콘솔</span>
                    <span className={showConsole ? 'text-green-400' : consoleEnabled ? 'text-yellow-400' : 'text-void-500'}>
                      {showConsole ? '열림' : consoleEnabled ? '켜짐' : ''}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar - pointer-events-none to allow drag selection through empty areas */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end p-2 pointer-events-none">
        {/* Minimap - disable edge scroll when hovering */}
        <div className="pointer-events-auto" onMouseEnter={handleUIMouseEnter} onMouseLeave={handleUIMouseLeave}>
          <Minimap />
        </div>

        {/* Selection panel - allow drag selection through but enable clicks on panel content */}
        <div className="flex-1 mx-4 pointer-events-auto">
          <SelectionPanel />
        </div>

        {/* Command card - disable edge scroll when hovering */}
        <div className="pointer-events-auto" onMouseEnter={handleUIMouseEnter} onMouseLeave={handleUIMouseLeave}>
          <CommandCard />
        </div>
      </div>

      {/* Player Status Panel - top right (toggleable) */}
      {showPlayerStatus && (
        <div className="absolute top-12 right-2 pointer-events-auto">
          <PlayerStatusPanel />
        </div>
      )}

      {/* Overlay Legend - shows when an overlay is active */}
      {overlaySettings.activeOverlay !== 'none' && (
        <div className="absolute top-12 left-2 pointer-events-auto">
          <OverlayLegend overlayType={overlaySettings.activeOverlay} />
        </div>
      )}

      {/* Battle Simulator Panel */}
      {isBattleSimulator && <BattleSimulatorPanel />}

      {/* Tech Tree Modal */}
      <TechTreePanel />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsPanel />

      {/* Sound Options Panel */}
      <SoundOptionsPanel />

      {/* Performance Panel */}
      <PerformancePanel />

      {/* Debug Console - only available in single player */}
      {!isMultiplayerMode() && consoleEnabled && <ConsolePanel />}

      {/* Pause overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-auto">
          <div className="text-center">
            <h2 className="font-display text-4xl text-void-300 mb-4">일시정지됨</h2>
            <button
              onClick={togglePause}
              className="game-button-primary text-lg px-8 py-3"
            >
              Resume Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
