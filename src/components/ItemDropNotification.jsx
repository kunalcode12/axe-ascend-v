"use client";

import { useEffect, useState } from "react";

export const ItemDropNotification = ({ itemName, cost, targetPlayerName, stats, onComplete }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 300); // Wait for fade out animation
    }, 2000); // Show for 2 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Get stat name if available
  const statName = stats?.[0]?.name || "Item";
  const statValue = stats?.[0]?.currentValue;

  return (
    <div
      className={`w-full transition-all duration-300 ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
      }`}
    >
      <div className="bg-gradient-to-r from-blue-600/95 to-cyan-600/95 backdrop-blur-md px-6 py-4 rounded-xl shadow-2xl border-2 border-blue-400 shadow-blue-500/50 animate-slide-in-right">
        <div className="flex items-center gap-3">
          <span className="text-3xl animate-bounce">📦</span>
          <div className="flex flex-col flex-1">
            <p className="text-white font-bold text-lg">{itemName}</p>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-white/90 text-sm">
                To: <span className="font-semibold">{targetPlayerName}</span>
              </p>
              {cost && (
                <p className="text-yellow-300 text-sm font-semibold">
                  💰 {cost}
                </p>
              )}
            </div>
            {statName && (
              <p className="text-white/80 text-xs mt-1">
                Effect: <span className="font-medium">{statName}</span>
                {statValue !== undefined && (
                  <span className="ml-2 text-cyan-300">({statValue})</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Manager Component
export const ItemDropNotificationManager = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  // Position below boost notifications (boost notifications start at top-4, we start at top-32 to account for boost notifications)
  return (
    <div
      className="fixed top-32 right-4 z-50 pointer-events-none max-w-sm"
      data-ui-element
      style={{ display: "flex", flexDirection: "column", gap: "8px" }}
    >
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            position: "relative",
            zIndex: 50 - index,
          }}
        >
          <ItemDropNotification
            itemName={notification.itemName}
            cost={notification.cost}
            targetPlayerName={notification.targetPlayerName}
            stats={notification.stats}
            onComplete={() => onRemove(notification.id)}
          />
        </div>
      ))}
    </div>
  );
};

