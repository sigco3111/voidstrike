'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ALL_MAPS } from '@/data/maps';
import { useGameSetupStore, type PlayerSlot } from '@/store/gameSetupStore';
import { InstallAppButton } from '@/components/pwa/InstallPrompt';
import { LobbyBrowser } from '@/components/lobby/LobbyBrowser';
import { getStartGameButtonState } from './getStartGameButtonState';

// Extracted components
import { MapPreview, PlayerSlotRow, SettingSelect, JoinLobbyModal } from '@/components/game-setup';

// Extracted hooks
import { useGameSetupMusic } from '@/hooks/useGameSetupMusic';
import { useLobbySync } from '@/hooks/useLobbySync';
import { useGameStart } from '@/hooks/useGameStart';

export default function GameSetupPage() {
  const router = useRouter();

  // UI state
  const [isHydrated, setIsHydrated] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLobbyBrowser, setShowLobbyBrowser] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('플레이어');
  const [codeCopied, setCodeCopied] = useState(false);
  const [isPublicLobby, setIsPublicLobby] = useState(false);
  const [mapSearch, setMapSearch] = useState('');

  // Music and fullscreen
  const { musicEnabled, isFullscreen, handleMusicToggle, toggleFullscreen } = useGameSetupMusic();

  // Lobby sync (multiplayer)
  const {
    displayPlayerSlots,
    displayMapId,
    displayStartingResources,
    displayGameSpeed,
    displayFogOfWar,
    displayActivePlayerCount,
    isGuestMode,
    isHost,
    lobbyStatus,
    lobbyCode,
    lobbyError,
    guests,
    hasOpenSlot,
    hasGuests,
    guestSlotCount,
    connectedGuestCount,
    mySlotId,
    joinLobby,
    leaveLobby,
    kickGuest,
    sendGameStart,
  } = useLobbySync({ playerName, isPublicLobby });

  // Game start handling
  const { startGameError, handleStartGame } = useGameStart({
    guestSlotCount,
    connectedGuestCount,
    sendGameStart,
  });

  // Game setup store (for host controls)
  const {
    selectedMapId,
    startingResources,
    gameSpeed,
    fogOfWar,
    playerSlots,
    setSelectedMap,
    setStartingResources,
    setGameSpeed,
    setFogOfWar,
    setPlayerSlotType,
    setPlayerSlotFaction,
    setPlayerSlotColor,
    setPlayerSlotAIDifficulty,
    setPlayerSlotTeam,
    setPlayerSlotName,
    addPlayerSlot,
    removePlayerSlot,
  } = useGameSetupStore();

  // Map filtering
  const allMaps = Object.values(ALL_MAPS);
  const lobbyMaps = allMaps.filter((map) => !map.isSpecialMode);
  const maps = lobbyMaps.filter(
    (map) =>
      map.name.toLowerCase().includes(mapSearch.toLowerCase()) ||
      map.biome?.toLowerCase().includes(mapSearch.toLowerCase())
  );
  const selectedMap = ALL_MAPS[selectedMapId] || lobbyMaps[0];
  const displayMap = ALL_MAPS[displayMapId] || lobbyMaps[0];

  // Get used colors for duplicate prevention
  const usedColors = new Set(
    playerSlots
      .filter((s: PlayerSlot) => s.type === 'human' || s.type === 'ai')
      .map((s: PlayerSlot) => s.colorId)
  );

  // Count active players
  const activePlayerCount = playerSlots.filter(
    (s: PlayerSlot) => s.type === 'human' || s.type === 'ai'
  ).length;

  // Player slot limits
  const maxPlayersForMap = selectedMap.maxPlayers;
  const canAddPlayer = playerSlots.length < maxPlayersForMap && playerSlots.length < 8;
  const canRemovePlayer = playerSlots.length > 2;
  const startGameButtonState = getStartGameButtonState({
    activePlayerCount,
    connectedGuestCount,
    guestSlotCount,
    isHydrated,
  });

  // Handle map selection - trim excess players if new map has fewer slots
  const handleMapSelect = (mapId: string) => {
    const newMap = ALL_MAPS[mapId];
    if (newMap) {
      setSelectedMap(mapId);
      let currentSlots = useGameSetupStore.getState().playerSlots;
      while (currentSlots.length > newMap.maxPlayers) {
        const lastSlot = currentSlots[currentSlots.length - 1];
        if (lastSlot) {
          removePlayerSlot(lastSlot.id);
          currentSlots = useGameSetupStore.getState().playerSlots;
        } else {
          break;
        }
      }
    }
  };

  const handleJoinLobby = async () => {
    if (joinCode.length === 4) {
      await joinLobby(joinCode, playerName);
    }
  };

  // Close join modal when connected
  useEffect(() => {
    setIsHydrated(true); // eslint-disable-line react-hooks/set-state-in-effect -- hydration gate keeps initial lobby clicks from being dropped before client interactivity
  }, []);

  useEffect(() => {
    if (lobbyStatus === 'connected' && showJoinModal) {
      setShowJoinModal(false); // eslint-disable-line react-hooks/set-state-in-effect -- closing modal in response to connection status change
    }
  }, [lobbyStatus, showJoinModal]);

  // Sync player name with first slot
  const firstSlotId = playerSlots[0]?.id;
  const firstSlotName = playerSlots[0]?.name;
  useEffect(() => {
    if (firstSlotId && !isGuestMode && playerName !== firstSlotName) {
      setPlayerSlotName(firstSlotId, playerName);
    }
  }, [playerName, firstSlotId, firstSlotName, isGuestMode, setPlayerSlotName]);

  return (
    <main className="h-screen bg-black overflow-hidden flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-void-950/50 via-black to-black" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(132,61,255,0.1),transparent_70%)]" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        <div className="max-w-6xl w-full mx-auto px-6 py-3 flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <div>
              <Link
                href="/"
                className="text-void-400 hover:text-void-300 text-sm mb-0.5 inline-block"
              >
                ← 메뉴로 돌아가기
              </Link>
              <h1 className="font-display text-xl text-white">
                {isGuestMode ? '로비 참가 중' : '게임 설정'}
              </h1>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-3">
              {!isGuestMode && (
                <>
                  <button
                    onClick={() => setShowLobbyBrowser(true)}
                    disabled={lobbyStatus === 'joining'}
                    className="px-4 py-2 bg-plasma-700 hover:bg-plasma-600 text-white text-sm rounded-lg
                               border border-plasma-600 transition-colors disabled:opacity-50
                               disabled:cursor-not-allowed"
                  >
                    로비 찾아보기
                  </button>
                  <button
                    onClick={() => setShowJoinModal(true)}
                    disabled={lobbyStatus === 'joining'}
                    className="px-4 py-2 bg-void-700 hover:bg-void-600 text-white text-sm rounded-lg
                               border border-void-600 transition-colors disabled:opacity-50
                               disabled:cursor-not-allowed"
                  >
                    게임 참가
                  </button>
                </>
              )}

              {isGuestMode && (
                <button
                  onClick={leaveLobby}
                  className="px-4 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-300 text-sm rounded-lg
                             border border-red-700/50 transition-colors"
                >
                  로비 나가기
                </button>
              )}

              <button
                onClick={handleMusicToggle}
                className="w-9 h-9 rounded-full flex items-center justify-center
                         bg-white/5 hover:bg-white/10 border border-white/10
                         transition-all duration-200 hover:scale-105 hover:border-void-500/50"
                title={musicEnabled ? '음악 끄기' : '음악 켜기'}
              >
                <span className="text-sm">{musicEnabled ? '🔊' : '🔇'}</span>
              </button>
              <button
                onClick={toggleFullscreen}
                className="w-9 h-9 rounded-full flex items-center justify-center
                         bg-white/5 hover:bg-white/10 border border-white/10
                         transition-all duration-200 hover:scale-105 hover:border-void-500/50"
                title={isFullscreen ? '전체화면 나가기' : '전체화면으로'}
              >
                <span className="text-sm">{isFullscreen ? '⛶' : '⛶'}</span>
              </button>
              <InstallAppButton
                className="w-9 h-9 rounded-full flex items-center justify-center
                         bg-white/5 hover:bg-white/10 border border-white/10
                         transition-all duration-200 hover:scale-105 hover:border-void-500/50"
                iconClassName="w-4 h-4"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
            {/* Players Section */}
            <div className="lg:col-span-2 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <h2 className="font-display text-base text-white">
                  플레이어 ({displayActivePlayerCount}/{displayMap.maxPlayers})
                </h2>
                {!isGuestMode && (
                  <button
                    onClick={addPlayerSlot}
                    disabled={!canAddPlayer}
                    className={`text-xs px-2 py-1 rounded border transition-colors
                      ${
                        canAddPlayer
                          ? 'text-void-400 hover:text-void-300 border-void-700 hover:border-void-500'
                          : 'text-void-600 border-void-800 cursor-not-allowed opacity-50'
                      }`}
                  >
                    + 플레이어 추가
                  </button>
                )}
              </div>
              <div className="space-y-1.5 overflow-y-auto flex-1 min-h-0 pr-1">
                {displayPlayerSlots.map((slot, index) => (
                  <PlayerSlotRow
                    key={slot.id}
                    slot={slot}
                    index={index}
                    usedColors={usedColors}
                    onTypeChange={(type) => setPlayerSlotType(slot.id, type)}
                    onFactionChange={(faction) => setPlayerSlotFaction(slot.id, faction)}
                    onColorChange={(colorId) => setPlayerSlotColor(slot.id, colorId)}
                    onDifficultyChange={(diff) => setPlayerSlotAIDifficulty(slot.id, diff)}
                    onTeamChange={(team) => setPlayerSlotTeam(slot.id, team)}
                    onRemove={() => {
                      if (slot.isGuest) {
                        const guest = guests.find((g) => g.slotId === slot.id);
                        if (guest) kickGuest(guest.pubkey);
                      } else {
                        removePlayerSlot(slot.id);
                      }
                    }}
                    canRemove={canRemovePlayer && !isGuestMode}
                    isLocalPlayer={isGuestMode ? slot.id === mySlotId : false}
                  />
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-3 min-h-0">
              {/* Multiplayer Section (host only) */}
              {isHost && (
                <div className="bg-void-900/50 rounded-lg border border-void-800/50 p-3 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-display text-base text-white">멀티플레이어</h2>
                    {lobbyStatus === 'initializing' && (
                      <span className="text-void-500 text-xs">...</span>
                    )}
                    {lobbyStatus === 'hosting' && lobbyCode && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(lobbyCode);
                          setCodeCopied(true);
                          setTimeout(() => setCodeCopied(false), 1500);
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 bg-void-700 hover:bg-void-600 rounded transition group relative"
                        title="클릭하여 복사"
                      >
                        <span className="font-mono text-base text-white tracking-wider">
                          {lobbyCode}
                        </span>
                        {codeCopied ? (
                          <span className="text-green-400 text-[10px] animate-pulse">복사됨!</span>
                        ) : (
                          <span className="text-void-400 group-hover:text-void-300 text-[10px]">
                            📋
                          </span>
                        )}
                      </button>
                    )}
                    {lobbyStatus === 'error' && <span className="text-red-400 text-xs">오류</span>}
                  </div>

                  <div className="mb-2">
                    <label className="block text-void-400 text-[10px] mb-0.5">이름</label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="이름을 입력하세요"
                      className="w-full bg-void-800 border border-void-700 rounded px-2 py-1 text-white text-sm
                                 focus:outline-none focus:border-void-500"
                    />
                  </div>

                  <div className="mb-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={isPublicLobby}
                        onChange={(e) => setIsPublicLobby(e.target.checked)}
                        className="w-4 h-4 rounded border-void-600 bg-void-800 text-plasma-500
                                   focus:ring-plasma-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-void-300 text-xs group-hover:text-void-200 transition-colors">
                        로비를 공개로 만들기
                      </span>
                    </label>
                    {isPublicLobby && (
                      <p className="text-plasma-400/70 text-[10px] mt-0.5 ml-6">
                        로비가 공개 목록에 표시됩니다
                      </p>
                    )}
                  </div>

                  <p className="text-void-500 text-[10px]">
                    친구에게 코드를 공유하세요. 슬롯을 "열림"으로 설정하면 참가할 수 있습니다.
                  </p>

                  {hasOpenSlot && (
                    <p className="text-green-400/70 text-[10px] mt-0.5">플레이어 대기 중...</p>
                  )}
                  {hasGuests && (
                    <p className="text-green-400 text-[10px] mt-0.5">
                      {guests.length}명의 플레이어가 연결됨
                    </p>
                  )}
                </div>
              )}

              {/* Guest mode indicator */}
              {isGuestMode && (
                <div className="flex flex-col gap-3">
                  <div className="bg-green-900/30 rounded-lg border border-green-700/50 p-3 flex-shrink-0">
                    <h2 className="font-display text-base text-green-300 mb-0.5">
                      로비 연결됨
                    </h2>
                    <p className="text-green-400/70 text-[10px]">
                      호스트가 게임을 시작하기를 기다리는 중...
                    </p>
                  </div>

                  {/* Map display for guest (read-only) */}
                  <div className="flex-shrink-0">
                    <h2 className="font-display text-base text-white mb-1">맵</h2>
                    <div className="p-2 bg-void-900/50 rounded-lg border border-void-800/50">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-display text-xs text-white">{displayMap.name}</h3>
                        <span className="text-void-400 text-[10px]">
                          {displayMap.width}x{displayMap.height} • {displayMap.maxPlayers}P
                        </span>
                      </div>
                      <p className="text-void-400 text-[10px] line-clamp-1">
                        {displayMap.description}
                      </p>
                    </div>
                  </div>

                  {/* Settings display for guest (read-only) */}
                  <div className="flex-shrink-0">
                    <h2 className="font-display text-base text-white mb-1">게임 설정</h2>
                    <div className="bg-void-900/50 rounded-lg border border-void-800/50 p-2 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-void-300">
                        <span>시작 자원</span>
                        <span className="text-white capitalize">{displayStartingResources}</span>
                      </div>
                      <div className="flex items-center justify-between text-void-300">
                        <span>게임 속도</span>
                        <span className="text-white capitalize">{displayGameSpeed}</span>
                      </div>
                      <div className="flex items-center justify-between text-void-300">
                        <span>전장의 안개</span>
                        <span className="text-white">{displayFogOfWar ? '켜짐' : '꺼짐'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Map Selection (host only) */}
              {!isGuestMode && (
                <div className="flex-1 flex flex-col min-h-0">
                  <h2 className="font-display text-base text-white mb-1 flex-shrink-0">
                    맵 선택
                  </h2>
                  <input
                    type="text"
                    value={mapSearch}
                    onChange={(e) => setMapSearch(e.target.value)}
                    placeholder="맵 검색..."
                    className="w-full bg-void-900 border border-void-700 rounded px-2 py-1 text-white text-xs
                               placeholder:text-void-500 focus:outline-none focus:border-void-500 mb-1 flex-shrink-0"
                  />
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="grid grid-cols-2 gap-1">
                      {maps.map((map) => (
                        <MapPreview
                          key={map.id}
                          map={map}
                          isSelected={selectedMapId === map.id}
                          onSelect={() => handleMapSelect(map.id)}
                          onEdit={() => router.push(`/game/setup/editor?map=${map.id}`)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-1 p-1.5 bg-void-900/50 rounded-lg border border-void-800/50 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xs text-white">{selectedMap.name}</h3>
                      <span className="text-void-400 text-[10px]">
                        {selectedMap.width}x{selectedMap.height} • {selectedMap.maxPlayers}P
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Game Settings (host only) */}
              {!isGuestMode && (
                <div className="flex-shrink-0">
                  <h2 className="font-display text-base text-white mb-1">게임 설정</h2>
                  <div className="bg-void-900/50 rounded-lg border border-void-800/50 p-2">
                    <SettingSelect
                      label="시작 자원"
                      value={startingResources}
                      options={[
                        { value: 'normal', label: '보통' },
                        { value: 'high', label: '풍부' },
                        { value: 'insane', label: '엄청난' },
                      ]}
                      onChange={setStartingResources}
                    />

                    <SettingSelect
                      label="게임 속도"
                      value={gameSpeed}
                      options={[
                        { value: 'slower', label: '0.5x' },
                        { value: 'normal', label: '1x' },
                        { value: 'faster', label: '1.5x' },
                        { value: 'fastest', label: '2x' },
                      ]}
                      onChange={setGameSpeed}
                    />

                    <div className="flex items-center justify-between py-1">
                      <span className="text-void-300 text-xs">전장의 안개</span>
                      <button
                        onClick={() => setFogOfWar(!fogOfWar)}
                        className={`w-10 h-5 rounded-full transition-all duration-200 relative
                          ${fogOfWar ? 'bg-void-500' : 'bg-void-800'}`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200
                          ${fogOfWar ? 'left-5' : 'left-0.5'}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Start Game Button (host only) */}
              {!isGuestMode && (
                <div className="flex-shrink-0">
                  <button
                    onClick={handleStartGame}
                    disabled={startGameButtonState.disabled}
                    className="w-full game-button-primary text-base px-6 py-2 font-display disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    게임 시작
                  </button>

                  {startGameButtonState.reason === 'hydrating' && (
                    <p className="text-center text-void-400 text-[10px] mt-1">로비 준비 중...</p>
                  )}
                  {startGameButtonState.reason === 'not-enough-players' && (
                    <p className="text-center text-red-400 text-[10px] mt-1">
                      최소 2명의 플레이어가 필요합니다
                    </p>
                  )}
                  {startGameButtonState.reason === 'waiting-for-guests' && (
                    <p className="text-center text-yellow-400 text-[10px] mt-1">
                      {guestSlotCount - connectedGuestCount}명의 게스트 연결 대기 중...
                    </p>
                  )}
                  {startGameError && (
                    <p className="text-center text-red-400 text-[10px] mt-1">{startGameError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Join Lobby Modal */}
      {showJoinModal && (
        <JoinLobbyModal
          playerName={playerName}
          onPlayerNameChange={setPlayerName}
          joinCode={joinCode}
          onJoinCodeChange={setJoinCode}
          lobbyStatus={lobbyStatus}
          lobbyError={lobbyError}
          onJoin={handleJoinLobby}
          onClose={() => setShowJoinModal(false)}
        />
      )}

      {/* Lobby Browser Modal */}
      {showLobbyBrowser && (
        <LobbyBrowser
          onJoin={(code) => {
            setJoinCode(code);
            setShowLobbyBrowser(false);
            setShowJoinModal(true);
          }}
          onClose={() => setShowLobbyBrowser(false)}
          playerName={playerName}
        />
      )}
    </main>
  );
}
