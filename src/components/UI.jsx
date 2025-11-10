"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "../hooks/useGame";
import { ArenaGameService } from "../lib/arenaService";
import { ArenaMonitor } from "./ArenaMonitor";
import { BoostNotificationManager } from "./BoostNotification";
import { ItemDropNotificationManager } from "./ItemDropNotification";

// Point Gain Effect Component
const PointGainEffect = ({ pointGain, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40 animate-point-gain">
      <div
        className={`text-6xl font-bold drop-shadow-2xl ${
          pointGain.amount > 50
            ? "text-yellow-300 animate-pulse-glow"
            : "text-yellow-400"
        }`}
      >
        +{pointGain.amount}
      </div>
    </div>
  );
};

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
  const [boostNotifications, setBoostNotifications] = useState([]);
  
  // Game state hooks
  const arenaPoints = useGame((state) => state.arenaPoints);
  const setMonitorOpen = useGame((state) => state.setMonitorOpen);
  const addArenaPoints = useGame((state) => state.addArenaPoints);
  const triggerSpecialEffect = useGame((state) => state.triggerSpecialEffect);
  const pointGainQueue = useGame((state) => state.pointGainQueue);
  const removePointGain = useGame((state) => state.removePointGain);
  const triggerBladefall = useGame((state) => state.triggerBladefall);
  const triggerCloneThrow = useGame((state) => state.triggerCloneThrow);
  const triggerSlowMotion = useGame((state) => state.triggerSlowMotion);
  const triggerBalloonStorm = useGame((state) => state.triggerBalloonStorm);
  const triggerGiantTarget = useGame((state) => state.triggerGiantTarget);
  const addThrow = useGame((state) => state.addThrow);
  const slowMotionActive = useGame((state) => state.slowMotionActive);
  const balloonStreak = useGame((state) => state.balloonStreak);
  const giantTargetActive = useGame((state) => state.giantTargetActive);
  const giantTargetMultiplier = useGame((state) => state.giantTargetMultiplier);
  const giantTargetTimeRemaining = useGame((state) => state.giantTargetTimeRemaining);
  const giantTargetHits = useGame((state) => state.giantTargetHits);
  const [itemDropNotifications, setItemDropNotifications] = useState([]);
  const [packageDropNotifications, setPackageDropNotifications] = useState([]);
  const [streamUrl, setStreamUrl] = useState("");

  // Get wallet, authToken, and streamUrl from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wallet = params.get("wallet");
    const authToken = params.get("authToken");
    const streamUrlParam = params.get("streamUrl");

    localStorage.setItem("userId", wallet);
    localStorage.setItem("authToken", authToken);

    console.log("Wallet:", wallet);
    console.log("Auth Token:", authToken);
    console.log("Stream URL:", streamUrlParam);

    if (wallet) {
      localStorage.setItem("userId", wallet);
    }

    if (authToken) {
      localStorage.setItem("authToken", authToken);
    }

    // Initialize streamUrl from URL params (decode if needed)
    if (streamUrlParam) {
      setStreamUrl(decodeURIComponent(streamUrlParam));
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
      const authToken = localStorage.getItem("authToken");
      console.log("Auth Token:", authToken);

      if (!authToken) {
        setInitError(
          "Auth token not found. Please provide authToken in URL params."
        );
        setIsInitializing(false);
        return;
      }

      // Validate streamUrl
      if (!streamUrl || streamUrl.trim() === "") {
        setInitError(
          "Stream URL is required. Please provide a stream URL."
        );
        setIsInitializing(false);
        return;
      }

      // Create arena service instance
      const arena = new ArenaGameService();
      arenaServiceRef.current = arena;

      console.log("Initializing arena service...", {
        // wallet: walletAddress,
        hasToken: !!authToken,
        streamUrl,
      });

      // Initialize game
      const initResult = await arena.initializeGame(streamUrl, authToken);
      console.log("Init Result:", initResult);

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
      
      const boostAmount =
        Number(data?.boostAmount) || Number(data?.currentCyclePoints) || 0;
      const boosterName = data?.boosterUsername || data?.playerName || "Viewer";

      // Always show notification for any boost
      const notificationId = Date.now() + Math.random();
      setBoostNotifications((prev) => [
        ...prev,
        { id: notificationId, amount: boostAmount, name: boosterName },
      ]);

      // Add points to game state
      if (boostAmount > 0) {
        addArenaPoints(boostAmount);

        // Trigger special effect if boost is > 50
        if (boostAmount > 50) {
          triggerSpecialEffect();
        }
      }

      setMonitorEvents((prev) => [
        ...prev,
        { type: "player_boost_activated", data, timestamp: new Date() },
      ]);

      // Remove notification after 1.3 seconds (1s display + 0.3s fade)
      setTimeout(() => {
        setBoostNotifications((prev) =>
          prev.filter((n) => n.id !== notificationId)
        );
      }, 1300);
    };

    // Boost cycle update
    arena.onBoostCycleUpdate = (data) => {
      console.log("Boost cycle update:", data);
      
      // Check if this cycle update contains boost amounts for the player
      const boostAmount =
        Number(data?.boostAmount) || Number(data?.currentCyclePoints) || 0;
      const boosterName = data?.boosterUsername || data?.playerName || "Viewer";

      // Show notification if there's a boost amount
      if (boostAmount > 0) {
        const notificationId = Date.now() + Math.random();
        setBoostNotifications((prev) => [
          ...prev,
          { id: notificationId, amount: boostAmount, name: boosterName },
        ]);

        addArenaPoints(boostAmount);

        if (boostAmount > 50) {
          triggerSpecialEffect();
        }

        setTimeout(() => {
          setBoostNotifications((prev) =>
            prev.filter((n) => n.id !== notificationId)
          );
        }, 1300);
      }

      setMonitorEvents((prev) => [
        ...prev,
        { type: "boost_cycle_update", data, timestamp: new Date() },
      ]);
    };

    // Boost cycle complete
    arena.onBoostCycleComplete = (data) => {
      console.log("Boost cycle complete:", data);
      
      // Check if cycle complete gives points
      const boostAmount =
        Number(data?.boostAmount) || Number(data?.totalPoints) || 0;
      const boosterName = data?.boosterUsername || data?.playerName || "Viewer";

      if (boostAmount > 0) {
        const notificationId = Date.now() + Math.random();
        setBoostNotifications((prev) => [
          ...prev,
          { id: notificationId, amount: boostAmount, name: boosterName },
        ]);

        addArenaPoints(boostAmount);

        if (boostAmount > 50) {
          triggerSpecialEffect();
        }

        setTimeout(() => {
          setBoostNotifications((prev) =>
            prev.filter((n) => n.id !== notificationId)
          );
        }, 1300);
      }

      setMonitorEvents((prev) => [
        ...prev,
        { type: "boost_cycle_complete", data, timestamp: new Date() },
      ]);
    };

    // Package drop
    arena.onPackageDrop = (data) => {
      console.log("Package drop:", data);
      
      // Extract package information from playerPackageDrops
      const playerPackageDrops = data?.playerPackageDrops || [];
      
      // Process each player's package drops
      playerPackageDrops.forEach((playerDrop) => {
        const eligiblePackages = playerDrop?.eligiblePackages || [];
        
        eligiblePackages.forEach((pkg) => {
          const packageName = pkg?.name || "Package";
          const packageCost = pkg?.cost || 0;
          const playerName = playerDrop?.playerName || "Player";
          const stats = pkg?.stats || [];
          
          // Check if this is a Balloon Storm / Balloon Rush package
          const isBalloonStorm = 
            packageName.toLowerCase().includes("balloon storm") ||
            packageName.toLowerCase().includes("balloon rush") ||
            stats.some(stat => stat.name === "Balloon Rush" || stat.name === "Balloon Storm");
          
          // Check if this is a Giant Target / Mega Target package
          const isGiantTarget = 
            packageName.toLowerCase().includes("giant target") ||
            packageName.toLowerCase().includes("mega target") ||
            stats.some(stat => stat.name === "Mega Target" || stat.name === "Giant Target");
          
          // Get duration from stats if available (default 8 seconds for storm, 10 for giant target)
          const stormDuration = stats.find(stat => 
            stat.name === "Balloon Rush" || stat.name === "Balloon Storm"
          )?.currentValue 
            ? Math.min(Math.max(stats.find(stat => stat.name === "Balloon Rush" || stat.name === "Balloon Storm").currentValue, 6), 10) // Clamp between 6-10 seconds
            : 8; // Default 8 seconds
          
          // Get balloon count from stats (default 30 balloons)
          const balloonCount = stats.find(stat => 
            stat.name === "Balloon Rush" || stat.name === "Balloon Storm"
          )?.currentValue 
            ? Math.min(Math.max(stats.find(stat => stat.name === "Balloon Rush" || stat.name === "Balloon Storm").currentValue * 2, 20), 50) // 20-50 balloons
            : 30; // Default 30 balloons
          
          // Get giant target duration and multiplier from stats
          const giantTargetStat = stats.find(stat => 
            stat.name === "Mega Target" || stat.name === "Giant Target"
          );
          const giantTargetDuration = giantTargetStat?.currentValue 
            ? Math.min(Math.max(giantTargetStat.currentValue, 8), 12) // Clamp between 8-12 seconds
            : 10; // Default 10 seconds
          // Multiplier: use stat value / 10, clamped between x2-x5
          const giantTargetMultiplier = giantTargetStat?.currentValue 
            ? Math.min(Math.max(Math.floor(giantTargetStat.currentValue / 10), 2), 5) // x2-x5 multiplier
            : 3; // Default x3 multiplier
          
          // Show notification (use same structure as item drop notifications)
          const notificationId = Date.now() + Math.random();
          setPackageDropNotifications((prev) => [
            ...prev,
            {
              id: notificationId,
              itemName: packageName, // Use itemName for compatibility with ItemDropNotification
              cost: packageCost,
              targetPlayerName: playerName, // Use targetPlayerName for compatibility
              stats,
            },
          ]);
          
          // Remove notification after 2.3 seconds
          setTimeout(() => {
            setPackageDropNotifications((prev) =>
              prev.filter((n) => n.id !== notificationId)
            );
          }, 2300);
          
          // Trigger Balloon Storm effect if applicable
          if (isBalloonStorm) {
            console.log("🎈 Balloon Storm effect triggered!");
            triggerBalloonStorm(stormDuration, balloonCount);
          }
          
          // Trigger Giant Target effect if applicable
          if (isGiantTarget) {
            console.log("🎯 Giant Target effect triggered!");
            triggerGiantTarget(giantTargetDuration, giantTargetMultiplier);
          }
        });
      });
      
      setMonitorEvents((prev) => [
        ...prev,
        { type: "package_drop", data, timestamp: new Date() },
      ]);
    };

    // Immediate item drop
    arena.onImmediateItemDrop = (data) => {
      console.log("Immediate item drop:", data);
      
      // Extract item information
      const itemName = data?.itemName || data?.item?.name || data?.package?.name || "Item";
      const cost = data?.cost || data?.price || null;
      const targetPlayerName = data?.targetPlayerName || "Player";
      const stats = data?.item?.stats || data?.package?.stats || data?.stats || [];
      
      // Check if this is a Bladefall item (Rain of Mini-Axes)
      const isBladefall = 
        itemName.toLowerCase().includes("rain of mini-axes") ||
        itemName.toLowerCase().includes("bladefall") ||
        stats.some(stat => stat.name === "Bladefall");

      // Check if this is a Clone Throw item
      const isCloneThrow = 
        itemName.toLowerCase().includes("clone throw") ||
        itemName.toLowerCase().includes("echo throw") ||
        stats.some(stat => stat.name === "Echo Throw" || stat.name === "Clone Throw");
      
      // Get throws count from stat value if available
      const cloneThrowCount = stats.find(stat => 
        stat.name === "Echo Throw" || stat.name === "Clone Throw"
      )?.currentValue || 3;

      // Check if this is a Slow-Motion Zone / Time Warp item
      const isSlowMotion = 
        itemName.toLowerCase().includes("slow-motion zone") ||
        itemName.toLowerCase().includes("slow motion") ||
        itemName.toLowerCase().includes("time warp") ||
        stats.some(stat => stat.name === "Time Warp" || stat.name === "Slow Motion");
      
      // Check if this is an Extra-Axe item
      const isExtraAxe = 
        itemName.toLowerCase().includes("extra-axe") ||
        itemName.toLowerCase().includes("extra axe") ||
        stats.some(stat => stat.name === "Plus One" || stat.name === "Extra Axe");
      
      // Get duration and time scale from stats if available
      const slowMotionDuration = stats.find(stat => 
        stat.name === "Time Warp" || stat.name === "Slow Motion"
      )?.currentValue 
        ? Math.min(Math.max(stats.find(stat => stat.name === "Time Warp" || stat.name === "Slow Motion").currentValue / 10, 4), 6) // Clamp between 4-6 seconds
        : 5; // Default 5 seconds
      
      // Time scale: 0.4-0.6x (default 0.5x = half speed)
      const slowMotionTimeScale = 0.5;

      // Show notification
      const notificationId = Date.now() + Math.random();
      setItemDropNotifications((prev) => [
        ...prev,
        {
          id: notificationId,
          itemName,
          cost,
          targetPlayerName,
          stats,
        },
      ]);

      // Remove notification after 2.3 seconds
      setTimeout(() => {
        setItemDropNotifications((prev) =>
          prev.filter((n) => n.id !== notificationId)
        );
      }, 2300);

      // Trigger Bladefall effect if applicable
      if (isBladefall) {
        console.log("⚔️ Bladefall effect triggered!");
        triggerBladefall();
      }

      // Trigger Clone Throw effect if applicable
      if (isCloneThrow) {
        console.log("👻 Clone Throw effect triggered!");
        triggerCloneThrow(cloneThrowCount);
      }

      // Trigger Slow Motion effect if applicable
      if (isSlowMotion) {
        console.log("⏱️ Slow Motion Zone effect triggered!");
        triggerSlowMotion(slowMotionDuration, slowMotionTimeScale);
      }

      // Trigger Extra-Axe effect if applicable (adds 1 extra axe)
      if (isExtraAxe) {
        console.log("🪓 Extra-Axe effect triggered! Adding 1 axe");
        addThrow(1); // Add 1 extra axe to throws count
      }

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

  // Handle monitor open/close state
  useEffect(() => {
    setMonitorOpen(showMonitor);
  }, [showMonitor, setMonitorOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (arenaServiceRef.current) {
        arenaServiceRef.current.disconnect();
        arenaServiceRef.current = null;
      }
      setMonitorOpen(false);
    };
  }, [setMonitorOpen]);

  // Disconnect function
  const handleDisconnect = () => {
    if (arenaServiceRef.current) {
      arenaServiceRef.current.disconnect();
      arenaServiceRef.current = null;
    }
    setArenaInitialized(false);
    setArenaStatus("disconnected");
    setShowMonitor(false);
    setMonitorEvents([]);
    setCountdown(null);
    setBoostNotifications([]);
    setItemDropNotifications([]);
    // Note: We keep arenaPoints in game state as they're part of the score
  };

  // Check if game is over and auto-disconnect
  useEffect(() => {
    if (throws === 0 && !firstGame) {
      // Small delay to show the game over dialog
      const timer = setTimeout(() => {
        setShowGameOver(true);
        // Make API call to deduct points
        deductUserPoints();
      }, 2000);

      // Auto-disconnect websocket after game over (6 seconds total)
      const disconnectTimer = setTimeout(() => {
        if (arenaServiceRef.current) {
          console.log("Auto-disconnecting arena service after game end");
          handleDisconnect();
        }
      }, 6000); // Disconnect 6 seconds after throws reach 0

      return () => {
        clearTimeout(timer);
        clearTimeout(disconnectTimer);
      };
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
      const actualScore = balloonsHit * 10 + targetHit * 50 + arenaPoints;

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
    <section
      className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none"
      data-ui-element
    >
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

              {/* Stream URL Input */}
              <div className="bg-black/40 p-4 rounded-lg border border-purple-400/30">
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Stream URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="https://twitch.tv/empireofbits"
                  className="w-full bg-black/60 border border-purple-400/50 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  disabled={isInitializing || arenaInitialized}
                />
                <p className="text-white/50 text-xs mt-2">
                  Enter the Twitch stream URL to connect to the arena
                </p>
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
                    {streamUrl && streamUrl.trim() !== ""
                      ? "✓ Provided"
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
                disabled={isInitializing || arenaInitialized || !streamUrl || streamUrl.trim() === ""}
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
                {balloonsHit * 5 + targetHit * 50 + arenaPoints}
              </p>
              {arenaPoints > 0 && (
                <p className="text-xs text-purple-300 mt-1">
                  +{arenaPoints} from arena
                </p>
              )}
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

      {/* Arena Status Indicator - Only show when countdown is not displayed (to avoid duplication) */}
      {arenaStatus !== "disconnected" && 
       arenaStatus !== "countdown" && 
       arenaStatus !== "live" && 
       !showInitDialog && (
        <div className="absolute top-20 left-4 pointer-events-auto z-20">
          <div className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 backdrop-blur-md px-4 py-2 rounded-lg border-2 border-purple-400/50 flex items-center gap-3 shadow-lg">
            <div
              className={`w-3 h-3 rounded-full ${
                arenaStatus === "connected"
                  ? "bg-green-400 animate-pulse"
                  : arenaStatus === "error"
                  ? "bg-red-400"
                  : "bg-gray-400"
              }`}
            />
            <span className="text-white font-semibold text-sm">
              {arenaStatus === "connected"
                ? "Arena Connected"
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
        <div data-ui-element>
          <ArenaMonitor
            events={monitorEvents}
            isOpen={showMonitor}
            onToggle={() => setShowMonitor(!showMonitor)}
            arenaStatus={arenaStatus}
            countdown={countdown}
            onDisconnect={handleDisconnect}
          />
        </div>
      )}

      {/* Boost Notifications */}
      <BoostNotificationManager
        notifications={boostNotifications}
        onRemove={(id) => {
          setBoostNotifications((prev) => prev.filter((n) => n.id !== id));
        }}
      />

      {/* Item Drop Notifications */}
      <ItemDropNotificationManager
        notifications={itemDropNotifications}
        onRemove={(id) => {
          setItemDropNotifications((prev) => prev.filter((n) => n.id !== id));
        }}
      />
      
      {/* Package Drop Notifications - Positioned below item drop notifications */}
      {packageDropNotifications.length > 0 && (
        <div
          className="fixed top-64 right-4 z-50 pointer-events-none max-w-sm"
          data-ui-element
          style={{ display: "flex", flexDirection: "column", gap: "8px" }}
        >
          {packageDropNotifications.map((notification, index) => (
            <div
              key={notification.id}
              style={{
                position: "relative",
                zIndex: 50 - index,
              }}
            >
              <ItemDropNotificationManager
                notifications={[notification]}
                onRemove={(id) => {
                  setPackageDropNotifications((prev) => prev.filter((n) => n.id !== id));
                }}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Balloon Streak Counter */}
      {balloonStreak > 0 && (
        <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40 animate-fade-in-up">
          <div className="bg-gradient-to-r from-pink-600/95 to-purple-600/95 backdrop-blur-xl px-8 py-4 rounded-2xl shadow-2xl border-2 border-pink-400/60 animate-pulse">
            <div className="flex items-center gap-4">
              <span className="text-4xl animate-bounce">🎈</span>
              <div className="flex flex-col">
                <p className="text-white font-bold text-xl tracking-wide">BALLOON STREAK!</p>
                <p className="text-yellow-300 font-black text-4xl drop-shadow-lg">{balloonStreak}x</p>
              </div>
              {balloonStreak >= 5 && (
                <span className="text-3xl animate-spin">✨</span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Giant Target UI - Countdown and Multiplier */}
      {giantTargetActive && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 pointer-events-none z-40 animate-fade-in-down">
          <div className="bg-gradient-to-r from-yellow-600/95 to-orange-600/95 backdrop-blur-xl px-8 py-4 rounded-2xl shadow-2xl border-2 border-yellow-400/60 animate-pulse">
            <div className="flex items-center gap-4">
              <span className="text-4xl animate-spin">🎯</span>
              <div className="flex flex-col items-center">
                <p className="text-white font-bold text-xl tracking-wide">GIANT TARGET ACTIVE!</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex flex-col items-center">
                    <p className="text-yellow-300 font-black text-3xl drop-shadow-lg">
                      x{giantTargetMultiplier}
                    </p>
                    <p className="text-white/80 text-xs">MULTIPLIER</p>
                  </div>
                  <div className="w-px h-8 bg-white/30"></div>
                  <div className="flex flex-col items-center">
                    <p className={`font-black text-3xl drop-shadow-lg ${
                      giantTargetTimeRemaining <= 3 
                        ? "text-red-400 animate-pulse" 
                        : "text-yellow-300"
                    }`}>
                      {giantTargetTimeRemaining}s
                    </p>
                    <p className="text-white/80 text-xs">TIME LEFT</p>
                  </div>
                  <div className="w-px h-8 bg-white/30"></div>
                  <div className="flex flex-col items-center">
                    <p className="text-yellow-300 font-black text-3xl drop-shadow-lg">
                      {giantTargetHits}
                    </p>
                    <p className="text-white/80 text-xs">HITS</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Point Gain Effects */}
      {pointGainQueue.map((pointGain) => (
        <PointGainEffect
          key={pointGain.id}
          pointGain={pointGain}
          onComplete={() => removePointGain(pointGain.id)}
        />
      ))}

      {/* Disconnect Button in Main UI - Only show when arena is live */}
      {arenaInitialized && !showMonitor && arenaStatus === "live" && (
        <button
          onClick={handleDisconnect}
          className="fixed bottom-4 left-4 z-20 bg-red-600/80 hover:bg-red-700/90 backdrop-blur-md text-white px-4 py-2 rounded-lg shadow-lg border-2 border-red-400/50 pointer-events-auto transition-all duration-200 flex items-center gap-2 text-sm font-semibold"
        >
          <span>🔌</span>
          <span>Disconnect Arena</span>
        </button>
      )}

      {/* Live Countdown Display - Always visible when countdown is active */}
      {countdown !== null && arenaStatus !== "disconnected" && !showInitDialog && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-gradient-to-r from-purple-600/95 to-pink-600/95 backdrop-blur-xl px-8 py-4 rounded-2xl border-2 border-purple-400/60 shadow-2xl flex items-center gap-4">
            <div
              className={`w-4 h-4 rounded-full ${
                arenaStatus === "live"
                  ? "bg-green-400 animate-pulse"
                  : arenaStatus === "countdown"
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-gray-400"
              }`}
            />
            <div className="flex flex-col items-start">
              <span className="text-white/90 text-sm font-semibold uppercase tracking-wide">
                {arenaStatus === "countdown"
                  ? "⚡ Arena Starting In"
                  : arenaStatus === "live"
                  ? "🔥 Arena Cycle"
                  : "Arena"}
              </span>
              <span className="text-white font-black text-4xl tracking-tight">
                {countdown}s
              </span>
            </div>
            {arenaStatus === "live" && (
              <div className="ml-4 pl-4 border-l-2 border-white/30">
                <span className="text-white/70 text-xs">Live Now!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slow Motion Visual Effects - Vignette and Motion Blur Overlay */}
      {slowMotionActive && (
        <>
          {/* Vignette effect - dark edges */}
          <div className="fixed inset-0 pointer-events-none z-50 mix-blend-multiply">
            <div 
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.6) 100%)`,
                animation: "pulse-vignette 2s ease-in-out infinite",
              }}
            />
          </div>
          
          {/* Motion blur effect overlay */}
          <div 
            className="fixed inset-0 pointer-events-none z-40"
            style={{
              background: "rgba(100, 150, 255, 0.1)",
              backdropFilter: "blur(2px)",
              animation: "fade-in-out 0.3s ease-in-out",
            }}
          />
        </>
      )}
    </section>
  );
};
