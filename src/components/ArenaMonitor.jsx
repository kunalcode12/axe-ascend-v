"use client";

import { useState } from "react";

export const ArenaMonitor = ({ events, isOpen, onToggle }) => {
  const [expandedEvents, setExpandedEvents] = useState(new Set());

  const toggleEvent = (index) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedEvents(newExpanded);
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
    if (type.includes("completed") || type.includes("stopped")) return "text-red-400";
    if (type.includes("joined")) return "text-green-400";
    return "text-white/70";
  };

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

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 left-4 z-50 bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-700/90 hover:to-pink-700/90 backdrop-blur-md text-white px-4 py-2 rounded-lg shadow-lg border border-purple-400/30 pointer-events-auto transition-all duration-200 flex items-center gap-2"
      >
        <span>📊</span>
        <span className="text-sm font-medium">Arena Monitor</span>
        {events.length > 0 && (
          <span className="bg-purple-500/90 text-white text-xs px-2 py-0.5 rounded-full font-semibold animate-pulse">
            {events.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96 max-h-[600px] bg-black/90 backdrop-blur-md rounded-xl border border-purple-500/30 shadow-2xl pointer-events-auto flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/50 to-pink-600/50 p-4 border-b border-purple-400/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <h3 className="text-white font-bold text-lg">Arena Monitor</h3>
          {events.length > 0 && (
            <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
              {events.length}
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="text-white/70 hover:text-white transition-colors text-xl"
        >
          ✕
        </button>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {events.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            <p className="text-sm">No events yet</p>
            <p className="text-xs mt-2">Waiting for arena events...</p>
          </div>
        ) : (
          events
            .slice()
            .reverse()
            .map((event, index) => {
              const reverseIndex = events.length - 1 - index;
              const isExpanded = expandedEvents.has(reverseIndex);
              return (
                <div
                  key={reverseIndex}
                  className="bg-white/5 hover:bg-white/10 border border-purple-400/20 rounded-lg p-3 transition-all duration-200 cursor-pointer"
                  onClick={() => toggleEvent(reverseIndex)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xl">{getEventIcon(event.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-semibold text-sm ${getEventColor(
                            event.type
                          )}`}
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
                      <pre className="text-xs text-white/70 overflow-x-auto bg-black/30 p-2 rounded">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-purple-400/20 bg-black/50 flex items-center justify-between text-xs text-white/50">
        <span>Real-time Arena Events</span>
        <button
          onClick={() => setExpandedEvents(new Set())}
          className="hover:text-white/80 transition-colors"
        >
          Collapse All
        </button>
      </div>
    </div>
  );
};

