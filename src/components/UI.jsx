"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "../hooks/useGame";
import { ArenaGameService } from "../lib/arenaService";
import { ArenaMonitor } from "./ArenaMonitor";

export const UI = () => {
  const startGame = useGame((state) => state.startGame);
  const balloonsHit = useGame((state) => state.balloonsHit);
  const targetHit = useGame((state) => state.targetHit);
  const throws = useGame((state) => state.throws);
  const firstGame = useGame((state) => state.firstGame);
  const [showGameOver, setShowGameOver] = useState(false);

  // Arena monitoring state
  const arenaServiceRef = useRef(null);
  const [monitorEvents, setMonitorEvents] = useState([]);
  const [showMonitor, setShowMonitor] = useState(false);
  const [arenaStatus, setArenaStatus] = useState("disconnected");
  const [countdown, setCountdown] = useState(null);
  const [arenaInitialized, setArenaInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState(null);
  const [showInitDialog, setShowInitDialog] = useState(true);

  // Get wallet and authToken from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wallet = params.get("wallet");
    const authToken = params.get("authToken");

    console.log("Wallet:", wallet);
    console.log("Auth Token:", authToken);

    if (wallet) {
      localStorage.setItem("userId", wallet);
    }

    if (authToken) {
      localStorage.setItem("authToken", authToken);
    }
  }, []);

  // Manual initialization function
  const initializeArena = async () => {
    try {
      setIsInitializing(true);
      setInitError(null);

      const walletAddress =
        new URLSearchParams(window.location.search).get("wallet") ||
        localStorage.getItem("userId");
      const authToken =
        new URLSearchParams(window.location.search).get("authToken") ||
        localStorage.getItem("authToken");

      if (!authToken) {
        setInitError(
          "Auth token not found. Please provide authToken in URL params."
        );
        setIsInitializing(false);
        return;
      }

      // Create arena service instance
      const arena = new ArenaGameService();
      arenaServiceRef.current = arena;

      // Get streamUrl from URL params
      const streamUrl = "https://twitch.tv/empireofbits";

      if (!streamUrl) {
        setInitError(
          "Stream URL not found. Please provide streamUrl in URL params."
        );
        setIsInitializing(false);
        return;
      }

      console.log("Initializing arena service...", {
        wallet: walletAddress,
        hasToken: !!authToken,
        streamUrl,
      });

      // Initialize game
      const initResult = await arena.initializeGame(streamUrl, authToken);

      if (initResult.success) {
        console.log("✅ Arena service initialized:", initResult.data);
        setArenaStatus("connected");
        setArenaInitialized(true);
        setShowInitDialog(false);
      } else {
        console.error("❌ Failed to initialize arena:", initResult.error);
        setArenaStatus("error");
        setInitError(initResult.error || "Failed to initialize arena");
      }
    } catch (error) {
      console.error("Error initializing arena service:", error);
      setArenaStatus("error");
      setInitError(error.message || "Error initializing arena service");
    } finally {
      setIsInitializing(false);
    }
  };

  // Set up arena event listeners (runs after initialization)
  useEffect(() => {
    if (!arenaInitialized) return;

    const arena = arenaServiceRef.current;
    if (!arena) return;

    console.log("Attaching arena events to arenaServiceRef", arena);

    // Arena countdown started
    arena.onArenaCountdownStarted = (data) => {
      console.log("Arena countdown started:", data);
      setArenaStatus("countdown");
      setCountdown(data.secondsRemaining || data.countdown || 60);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "arena_countdown_started", data, timestamp: new Date() },
      ]);
    };

    // Countdown update
    arena.onCountdownUpdate = (data) => {
      console.log("Countdown update:", data);
      const secondsRemaining = data.secondsRemaining || data.countdown;
      setCountdown(secondsRemaining);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "countdown_update", data, timestamp: new Date() },
      ]);
    };

    // Arena begins
    arena.onArenaBegins = (data) => {
      console.log("Arena begins:", data);
      setArenaStatus("live");
      setMonitorEvents((prev) => [
        ...prev,
        { type: "arena_begins", data, timestamp: new Date() },
      ]);
      // Auto-open monitor when arena goes live
      setShowMonitor(true);
    };

    // Player boost activated
    arena.onPlayerBoostActivated = (data) => {
      console.log("Player boost activated:", data);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "player_boost_activated", data, timestamp: new Date() },
      ]);
    };

    // Boost cycle update
    arena.onBoostCycleUpdate = (data) => {
      console.log("Boost cycle update:", data);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "boost_cycle_update", data, timestamp: new Date() },
      ]);
    };

    // Boost cycle complete
    arena.onBoostCycleComplete = (data) => {
      console.log("Boost cycle complete:", data);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "boost_cycle_complete", data, timestamp: new Date() },
      ]);
    };

    // Package drop
    arena.onPackageDrop = (data) => {
      console.log("Package drop:", data);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "package_drop", data, timestamp: new Date() },
      ]);
    };

    // Immediate item drop
    arena.onImmediateItemDrop = (data) => {
      console.log("Immediate item drop:", data);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "immediate_item_drop", data, timestamp: new Date() },
      ]);
    };

    // Event triggered
    arena.onEventTriggered = (data) => {
      console.log("Event triggered:", data);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "event_triggered", data, timestamp: new Date() },
      ]);
    };

    // Player joined
    arena.onPlayerJoined = (data) => {
      console.log("Player joined:", data);
      setMonitorEvents((prev) => [
        ...prev,
        { type: "player_joined", data, timestamp: new Date() },
      ]);
    };

    // Game completed
    arena.onGameCompleted = (data) => {
      console.log("Game completed:", data);
      setArenaStatus("completed");
      setMonitorEvents((prev) => [
        ...prev,
        { type: "game_completed", data, timestamp: new Date() },
      ]);
    };

    // Game stopped
    arena.onGameStopped = (data) => {
      console.log("Game stopped:", data);
      setArenaStatus("stopped");
      setMonitorEvents((prev) => [
        ...prev,
        { type: "game_stopped", data, timestamp: new Date() },
      ]);
    };

    // Cleanup
    return () => {
      if (arena) {
        arena.onArenaCountdownStarted = null;
        arena.onCountdownUpdate = null;
        arena.onArenaBegins = null;
        arena.onPlayerBoostActivated = null;
        arena.onBoostCycleUpdate = null;
        arena.onBoostCycleComplete = null;
        arena.onPackageDrop = null;
        arena.onImmediateItemDrop = null;
        arena.onEventTriggered = null;
        arena.onPlayerJoined = null;
        arena.onGameCompleted = null;
        arena.onGameStopped = null;
      }
    };
  }, [arenaInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (arenaServiceRef.current) {
        arenaServiceRef.current.disconnect();
        arenaServiceRef.current = null;
      }
    };
  }, []);

  // Check if game is over
  useEffect(() => {
    if (throws === 0 && !firstGame) {
      // Small delay to show the game over dialog
      const timer = setTimeout(() => {
        setShowGameOver(true);
        // Make API call to deduct points
        deductUserPoints();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [throws, firstGame]);

  // Function to deduct points from user
  const deductUserPoints = async () => {
    try {
      // Get userId from URL params or localStorage
      const walletAddress =
        new URLSearchParams(window.location.search).get("wallet") ||
        localStorage.getItem("userId");

      console.log("User ID:", walletAddress);

      if (!walletAddress) {
        console.error("User ID not found");
        return;
      }

      // Calculate points to deduct (you can adjust this logic)
      const actualScore = balloonsHit * 10 + targetHit * 50;

      const response = await fetch(
        `http://localhost:3001/api/v1/walletUser/${walletAddress}/points`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletAddress,
            points: actualScore,
            operation: "add",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to deduct points");
      }

      const data = await response.json();
      console.log("Points deducted successfully:", data);

      // Wait a bit before redirecting
      setTimeout(() => {
        window.location.href = `http://localhost:3000/?gameWon=true&gameName=AxeAscend&pointsEarned=${actualScore}`;
      }, 3000);
    } catch (error) {
      console.error("Error deducting points:", error);
    }
  };

  return (
    <section className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
      <div className="absolute top-4 left-4 md:top-8 md:left-14 opacity-0 animate-fade-in-down animation-delay-200 pointer-events-auto">
        <a target="_blank">
          <img
            src="/images/logoEmpire.jpg"
            alt="Wawa Sensei logo"
            className="w-20 h-20 object-contain"
          />
        </a>
      </div>
      <div className="absolute left-4 md:left-15 -translate-x-1/2 -rotate-90 flex items-center gap-4 animation-delay-1500 animate-fade-in-down opacity-0">
        <div className="w-20 h-px bg-white/60"></div>
        <p className="text-white/60 text-xs">Break the curse</p>
      </div>

      {/* Initialization Dialog */}
      {showInitDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-30 pointer-events-auto bg-black/90 backdrop-blur-md">
          <div className="bg-gradient-to-br from-purple-900/95 to-pink-900/95 backdrop-blur-xl p-8 rounded-2xl border-2 border-purple-400/50 max-w-lg w-full mx-4 shadow-2xl animate-fade-in-up">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4 animate-bounce">🎮</div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Initialize Arena
              </h2>
              <p className="text-white/70 text-sm">
                Connect to the arena server to start playing
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-black/40 p-4 rounded-lg border border-purple-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80 text-sm font-medium">
                    Status:
                  </span>
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      arenaStatus === "connected"
                        ? "text-green-300 bg-green-500/20"
                        : arenaStatus === "error"
                        ? "text-red-300 bg-red-500/20"
                        : "text-yellow-300 bg-yellow-500/20"
                    }`}
                  >
                    {arenaStatus === "connected"
                      ? "✓ Connected"
                      : arenaStatus === "error"
                      ? "✗ Error"
                      : "○ Not Connected"}
                  </span>
                </div>
                {initError && (
                  <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-xs animate-shake">
                    {initError}
                  </div>
                )}
                {arenaInitialized && (
                  <div className="mt-3 p-3 bg-green-500/20 border border-green-500/50 rounded text-green-300 text-xs">
                    ✓ Arena service connected successfully!
                  </div>
                )}
              </div>

              {/* Connection Info */}
              <div className="bg-black/30 p-3 rounded-lg border border-purple-400/20">
                <p className="text-white/60 text-xs mb-1">Requirements:</p>
                <ul className="text-white/50 text-xs space-y-1">
                  <li>
                    • Auth Token:{" "}
                    {localStorage.getItem("authToken")
                      ? "✓ Found"
                      : "✗ Missing"}
                  </li>
                  <li>
                    • Stream URL:{" "}
                    {new URLSearchParams(window.location.search).get(
                      "streamUrl"
                    )
                      ? "✓ Found"
                      : "✗ Missing"}
                  </li>
                  <li>
                    • Wallet:{" "}
                    {localStorage.getItem("userId") ||
                    new URLSearchParams(window.location.search).get("wallet")
                      ? "✓ Found"
                      : "✗ Missing"}
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={initializeArena}
                disabled={isInitializing || arenaInitialized}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
              >
                {isInitializing ? (
                  <>
                    <span className="animate-spin text-2xl">⚙️</span>
                    <span>Initializing...</span>
                  </>
                ) : arenaInitialized ? (
                  <>
                    <span className="text-2xl">✅</span>
                    <span>Connected</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">🚀</span>
                    <span>Initialize Arena</span>
                  </>
                )}
              </button>

              <div className="flex gap-3">
                {arenaInitialized && (
                  <button
                    onClick={() => {
                      setShowInitDialog(false);
                    }}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-3 text-lg"
                  >
                    <span className="text-2xl">🎯</span>
                    <span>Continue to Game</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowInitDialog(false);
                  }}
                  className={`${
                    arenaInitialized ? "flex-1" : "w-full"
                  } bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-3 text-lg`}
                >
                  <span>Skip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={`p-4 flex flex-col items-center gap-2 md:gap-4 mt-[50vh] animate-fade-in-up opacity-0 animation-delay-1000`}
      >
        {throws === 0 && firstGame && !showInitDialog && (
          <>
            <h1 className="bold text-white/80 text-4xl md:text-5xl font-extrabold text-center">
              🪓 Playing Ground
            </h1>
            <p className="text-white/70 text-sm text-center max-w-md">
              Become an axe master and break the curse of the temple by
              exploding balloons. 🎈 <br />
              {arenaInitialized ? (
                <span className="text-green-400 font-semibold mt-2 block">
                  ✓ Arena Connected - Ready to Play!
                </span>
              ) : (
                <button
                  onClick={() => setShowInitDialog(true)}
                  className="text-purple-400 hover:text-purple-300 font-medium mt-2 underline text-xs"
                >
                  Initialize Arena (Optional)
                </button>
              )}
            </p>
            <button
              className="bg-gradient-to-r from-white/90 to-white/80 text-black font-bold px-6 py-3 rounded-lg shadow-lg hover:from-white hover:to-white transition-all duration-200 pointer-events-auto cursor-pointer transform hover:scale-105"
              onClick={startGame}
            >
              Start Game
            </button>
          </>
        )}
      </div>
      <div className="absolute right-4 top-4 flex flex-col items-end justify-center gap-4">
        <div className="flex flex-col items-center gap-2 saturate-0">
          <p className="">
            {Array(throws)
              .fill(0)
              .map((_, index) => (
                <span key={index} className="text-white text-6xl">
                  🪓
                </span>
              ))}
          </p>
        </div>
        {!firstGame && (
          <>
            <div className="text-right">
              <p className="text-sm font-medium text-white">SCORE</p>
              <p className="text-6xl text-white font-bold">
                {balloonsHit * 5 + targetHit * 50}
              </p>
            </div>
            <p className="text-3xl text-white font-bold">🎈 {balloonsHit}</p>
            <p className="text-3xl text-white font-bold">🎯 {targetHit}</p>
          </>
        )}
      </div>

      {/* Game Over Dialog */}
      {showGameOver && (
        <div className="fixed inset-0 flex items-center justify-center z-20 pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-md p-8 rounded-xl border border-white/20 max-w-md w-full shadow-2xl animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white/90 text-center mb-4">
              🏆 Game Over!
            </h2>
            <div className="space-y-4 mb-6">
              <p className="text-white/80 text-center text-xl">
                Congratulations, Axe Master!
              </p>
              <div className="bg-white/10 p-4 rounded-lg">
                <h3 className="text-white/70 text-center mb-2">Final Score</h3>
                <p className="text-5xl text-white font-bold text-center">
                  {balloonsHit * 5 + targetHit * 50}
                </p>
                <div className="flex justify-center gap-8 mt-4">
                  <div className="text-center">
                    <p className="text-2xl">🎈</p>
                    <p className="text-white/90">{balloonsHit}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl">🎯</p>
                    <p className="text-white/90">{targetHit}</p>
                  </div>
                </div>
              </div>
              <p className="text-white/60 text-center text-sm">
                Redirecting to home page in a few seconds...
              </p>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() =>
                  (window.location.href =
                    "http://localhost:3000/?gameWon=true&gameName=AxeAscend&pointsEarned=100")
                }
                className="bg-white/80 text-black font-bold px-6 py-2 rounded-lg shadow-md hover:bg-white/100 transition duration-200 cursor-pointer"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Arena Status Indicator */}
      {arenaStatus !== "disconnected" && !showInitDialog && (
        <div className="absolute top-20 left-4 pointer-events-auto z-20">
          <div className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 backdrop-blur-md px-4 py-2 rounded-lg border-2 border-purple-400/50 flex items-center gap-3 shadow-lg">
            <div
              className={`w-3 h-3 rounded-full ${
                arenaStatus === "connected" || arenaStatus === "live"
                  ? "bg-green-400 animate-pulse"
                  : arenaStatus === "countdown"
                  ? "bg-yellow-400 animate-pulse"
                  : arenaStatus === "error"
                  ? "bg-red-400"
                  : "bg-gray-400"
              }`}
            />
            <span className="text-white font-semibold text-sm">
              {arenaStatus === "connected"
                ? "Arena Connected"
                : arenaStatus === "countdown"
                ? `Countdown: ${countdown}s`
                : arenaStatus === "live"
                ? "Arena Live"
                : arenaStatus === "completed"
                ? "Arena Completed"
                : arenaStatus === "stopped"
                ? "Arena Stopped"
                : "Arena Error"}
            </span>
          </div>
        </div>
      )}

      {/* Arena Monitor */}
      {arenaInitialized && (
        <ArenaMonitor
          events={monitorEvents}
          isOpen={showMonitor}
          onToggle={() => setShowMonitor(!showMonitor)}
          arenaStatus={arenaStatus}
          countdown={countdown}
        />
      )}
    </section>
  );
};
