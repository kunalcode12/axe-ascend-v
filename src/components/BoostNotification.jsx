"use client";

import { useEffect, useState } from "react";

export const BoostNotification = ({ amount, name, onComplete }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 300); // Wait for fade out animation
    }, 1000); // Show for 1 second

    return () => clearTimeout(timer);
  }, [onComplete]);

  const isSpecial = amount > 50;

  return (
    <div
      className={`w-full transition-all duration-300 ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
      }`}
    >
      <div
        className={`bg-gradient-to-r ${
          isSpecial
            ? "from-yellow-500/95 to-orange-500/95 border-2 border-yellow-400 shadow-yellow-500/50"
            : "from-purple-600/95 to-pink-600/95 border-2 border-purple-400 shadow-purple-500/50"
        } backdrop-blur-md px-6 py-4 rounded-xl shadow-2xl border animate-slide-in-right`}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl animate-bounce">
            {isSpecial ? "⚡" : "🎁"}
          </span>
          <div className="flex flex-col">
            <p className="text-white font-bold text-lg">
              {isSpecial ? "SPECIAL BOOST!" : "Boost Received"}
            </p>
            <p className="text-white/90 text-sm">
              +{amount} points from {name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Manager Component
export const BoostNotificationManager = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 pointer-events-none max-w-sm"
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
          <BoostNotification
            amount={notification.amount}
            name={notification.name}
            onComplete={() => onRemove(notification.id)}
          />
        </div>
      ))}
    </div>
  );
};

