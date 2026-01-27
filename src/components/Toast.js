import React, { useEffect } from "react";

const Toast = ({ message, type = "info", onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: "rgba(16, 185, 129, 0.15)",
          borderColor: "rgba(5, 150, 105, 0.5)",
          textColor: "#059669",
        };
      case "error":
        return {
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          borderColor: "rgba(220, 38, 38, 0.5)",
          textColor: "#DC2626",
        };
      case "warning":
        return {
          backgroundColor: "rgba(245, 158, 11, 0.15)",
          borderColor: "rgba(217, 119, 6, 0.5)",
          textColor: "#D97706",
        };
      default:
        return {
          backgroundColor: "rgba(59, 130, 246, 0.15)",
          borderColor: "rgba(37, 99, 235, 0.5)",
          textColor: "#2563EB",
        };
    }
  };

  const typeStyles = getTypeStyles();

  const styles = {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    minWidth: "300px",
    maxWidth: "400px",
    padding: "16px 20px",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
    color: typeStyles.textColor,
    fontSize: "15px",
    lineHeight: "1.5",
    zIndex: 10000,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    border: `1px solid ${typeStyles.borderColor}`,
    backgroundColor: typeStyles.backgroundColor,
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    animation: "slideInRight 0.3s ease-out",
  };

  const closeButtonStyle = {
    background: "transparent",
    border: "none",
    color: typeStyles.textColor,
    cursor: "pointer",
    fontSize: "20px",
    lineHeight: "1",
    padding: "0",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
    transition: "opacity 0.2s",
    flexShrink: 0,
  };

  return (
    <>
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @media (max-width: 640px) {
            .toast-container {
              right: 12px !important;
              bottom: 12px !important;
              min-width: calc(100vw - 24px) !important;
              max-width: calc(100vw - 24px) !important;
            }
          }
        `}
      </style>
      <div className="toast-container" style={styles}>
        <span style={{ flex: 1 }}>{message}</span>
        <button
          style={closeButtonStyle}
          onClick={onClose}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </>
  );
};

export default Toast;
