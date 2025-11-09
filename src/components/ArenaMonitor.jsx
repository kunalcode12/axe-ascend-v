"use client";

import { useState, useEffect, useRef } from "react";

export const ArenaMonitor = ({
  events,
  isOpen,
  onToggle,
  arenaStatus,
  countdown,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    countdown: true,
    arena: true,
    boosts: true,
    drops: true,
    players: true,
    gameEvents: true,
  });
  const eventsEndRef = useRef(null);

  const scrollToBottom = () => {
    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [events, isOpen]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Categorize events
  const countdownEvents = events.filter((e) =>
    e.type.includes("countdown")
  );
  const arenaEvents = events.filter(
    (e) => e.type === "arena_begins" || e.type === "arena_countdown_started"
  );
  const boostEvents = events.filter((e) => e.type.includes("boost"));
  const dropEvents = events.filter(
    (e) => e.type.includes("drop") || e.type.includes("package") || e.type.includes("item")
  );
  const playerEvents = events.filter((e) => e.type.includes("player") || e.type.includes("joined"));
  const gameEvents = events.filter(
    (e) =>
      e.type.includes("completed") ||
      e.type.includes("stopped") ||
      e.type === "event_triggered"
  );

  const getEventIcon = (type) => {
    if (type.includes("countdown")) return "⏱️";
    if (type.includes("boost")) return "⚡";
    if (type.includes("package")) return "📦";
    if (type.includes("item")) return "🎁";
    if (type.includes("completed")) return "✅";
    if (type.includes("stopped")) return "⏹️";
    if (type.includes("joined")) return "👤";
    if (type.includes("arena_begins")) return "🎮";
    if (type.includes("event_triggered")) return "🎯";
    return "📡";
  };

  const formatEventType = (type) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getEventColor = (type) => {
    if (type.includes("countdown")) return "text-purple-400";
    if (type.includes("boost")) return "text-pink-400";
    if (type.includes("drop")) return "text-blue-400";
    if (type.includes("completed") || type.includes("stopped"))
      return "text-red-400";
    if (type.includes("joined")) return "text-green-400";
    return "text-white/70";
  };

  const SectionHeader = ({ title, icon, count, isExpanded, onToggle, color }) => (
    <button
      onClick={onToggle}
      className={`w-full bg-gradient-to-r ${color} p-3 rounded-lg flex items-center justify-between hover:opacity-90 transition-all duration-200`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-white font-bold text-lg">{title}</h3>
        {count > 0 && (
          <span className="bg-white/30 text-white text-xs px-2 py-1 rounded-full font-semibold">
            {count}
          </span>
        )}
      </div>
      <span className="text-white/80 text-lg">
        {isExpanded ? "▼" : "▶"}
      </span>
    </button>
  );

  const EventCard = ({ event, index }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
      <div
        key={index}
        className="bg-white/5 hover:bg-white/10 border border-purple-400/20 rounded-lg p-3 transition-all duration-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl">{getEventIcon(event.type)}</span>
            <div className="flex-1 min-w-0">
              <p
                className={`font-semibold text-sm ${getEventColor(event.type)}`}
              >
                {formatEventType(event.type)}
              </p>
              <p className="text-xs text-white/50 mt-0.5">
                {event.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <span className="text-white/30 text-xs">
            {isExpanded ? "▼" : "▶"}
          </span>
        </div>
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <pre className="text-xs text-white/70 overflow-x-auto bg-black/30 p-2 rounded max-h-60 overflow-y-auto">
              {JSON.stringify(event.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-purple-600/90 to-pink-600/90 hover:from-purple-700/100 hover:to-pink-700/100 backdrop-blur-md text-white px-6 py-3 rounded-xl shadow-2xl border-2 border-purple-400/50 pointer-events-auto transition-all duration-200 flex items-center gap-3 transform hover:scale-105"
      >
        <span className="text-2xl">📊</span>
        <div className="flex flex-col items-start">
          <span className="text-base font-bold">Arena Monitor</span>
          <span className="text-xs opacity-80">
            {events.length} events • {arenaStatus}
          </span>
        </div>
        {events.length > 0 && (
          <span className="bg-purple-500/90 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse">
            {events.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-4 z-50 bg-black/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/50 shadow-2xl pointer-events-auto flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 p-6 border-b-2 border-purple-400/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-4xl">📊</span>
          <div>
            <h2 className="text-white font-bold text-2xl">Arena Monitor</h2>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-2">
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
                <span className="text-white/80 text-sm font-medium">
                  {arenaStatus === "connected"
                    ? "Connected"
                    : arenaStatus === "countdown"
                    ? `Countdown: ${countdown}s`
                    : arenaStatus === "live"
                    ? "Arena Live"
                    : arenaStatus === "completed"
                    ? "Completed"
                    : arenaStatus === "stopped"
                    ? "Stopped"
                    : "Disconnected"}
                </span>
              </div>
              <span className="text-white/60 text-sm">
                {events.length} Total Events
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="text-white/70 hover:text-white transition-colors text-3xl hover:rotate-90 duration-300"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Countdown Section */}
        <div className="space-y-3">
          <SectionHeader
            title="Countdown"
            icon="⏱️"
            count={countdownEvents.length}
            isExpanded={expandedSections.countdown}
            onToggle={() => toggleSection("countdown")}
            color="from-purple-600/60 to-purple-800/60"
          />
          {expandedSections.countdown && (
            <div className="space-y-2 pl-4">
              {countdownEvents.length === 0 ? (
                <p className="text-white/40 text-sm italic">No countdown events yet</p>
              ) : (
                countdownEvents
                  .slice()
                  .reverse()
                  .map((event, idx) => (
                    <EventCard key={idx} event={event} index={idx} />
                  ))
              )}
            </div>
          )}
        </div>

        {/* Arena Events Section */}
        <div className="space-y-3">
          <SectionHeader
            title="Arena Events"
            icon="🎮"
            count={arenaEvents.length}
            isExpanded={expandedSections.arena}
            onToggle={() => toggleSection("arena")}
            color="from-green-600/60 to-emerald-800/60"
          />
          {expandedSections.arena && (
            <div className="space-y-2 pl-4">
              {arenaEvents.length === 0 ? (
                <p className="text-white/40 text-sm italic">No arena events yet</p>
              ) : (
                arenaEvents
                  .slice()
                  .reverse()
                  .map((event, idx) => (
                    <EventCard key={idx} event={event} index={idx} />
                  ))
              )}
            </div>
          )}
        </div>

        {/* Boost Events Section */}
        <div className="space-y-3">
          <SectionHeader
            title="Boost Events"
            icon="⚡"
            count={boostEvents.length}
            isExpanded={expandedSections.boosts}
            onToggle={() => toggleSection("boosts")}
            color="from-yellow-600/60 to-orange-800/60"
          />
          {expandedSections.boosts && (
            <div className="space-y-2 pl-4">
              {boostEvents.length === 0 ? (
                <p className="text-white/40 text-sm italic">No boost events yet</p>
              ) : (
                boostEvents
                  .slice()
                  .reverse()
                  .map((event, idx) => (
                    <EventCard key={idx} event={event} index={idx} />
                  ))
              )}
            </div>
          )}
        </div>

        {/* Drop Events Section */}
        <div className="space-y-3">
          <SectionHeader
            title="Drops & Items"
            icon="📦"
            count={dropEvents.length}
            isExpanded={expandedSections.drops}
            onToggle={() => toggleSection("drops")}
            color="from-blue-600/60 to-cyan-800/60"
          />
          {expandedSections.drops && (
            <div className="space-y-2 pl-4">
              {dropEvents.length === 0 ? (
                <p className="text-white/40 text-sm italic">No drop events yet</p>
              ) : (
                dropEvents
                  .slice()
                  .reverse()
                  .map((event, idx) => (
                    <EventCard key={idx} event={event} index={idx} />
                  ))
              )}
            </div>
          )}
        </div>

        {/* Player Events Section */}
        <div className="space-y-3">
          <SectionHeader
            title="Players"
            icon="👤"
            count={playerEvents.length}
            isExpanded={expandedSections.players}
            onToggle={() => toggleSection("players")}
            color="from-teal-600/60 to-green-800/60"
          />
          {expandedSections.players && (
            <div className="space-y-2 pl-4">
              {playerEvents.length === 0 ? (
                <p className="text-white/40 text-sm italic">No player events yet</p>
              ) : (
                playerEvents
                  .slice()
                  .reverse()
                  .map((event, idx) => (
                    <EventCard key={idx} event={event} index={idx} />
                  ))
              )}
            </div>
          )}
        </div>

        {/* Game Events Section */}
        <div className="space-y-3">
          <SectionHeader
            title="Game Events"
            icon="🎯"
            count={gameEvents.length}
            isExpanded={expandedSections.gameEvents}
            onToggle={() => toggleSection("gameEvents")}
            color="from-red-600/60 to-pink-800/60"
          />
          {expandedSections.gameEvents && (
            <div className="space-y-2 pl-4">
              {gameEvents.length === 0 ? (
                <p className="text-white/40 text-sm italic">No game events yet</p>
              ) : (
                gameEvents
                  .slice()
                  .reverse()
                  .map((event, idx) => (
                    <EventCard key={idx} event={event} index={idx} />
                  ))
              )}
            </div>
          )}
        </div>
        <div ref={eventsEndRef} />
      </div>

      {/* Footer */}
      <div className="p-4 border-t-2 border-purple-400/30 bg-black/50 flex items-center justify-between">
        <span className="text-white/60 text-sm">Real-time Arena Monitoring</span>
        <button
          onClick={() =>
            setExpandedSections({
              countdown: true,
              arena: true,
              boosts: true,
              drops: true,
              players: true,
              gameEvents: true,
            })
          }
          className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
        >
          Expand All
        </button>
      </div>
    </div>
  );
};
