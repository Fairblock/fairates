import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../utils/firebase";
import { doc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";
import { FONT_FAMILY } from "../styles.js";

export function InviteOnlyPage() {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [waitlistError, setWaitlistError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);

  useEffect(() => {
    document.body.classList.add("landing-page-active");
    
    // Check if user already has a valid invite code
    const inviteCodeValidated = localStorage.getItem("inviteCodeValidated") === "true";
    const inviteCode = localStorage.getItem("inviteCode");
    
    if (inviteCodeValidated && inviteCode) {
      navigate("/");
    }
    
    return () => {
      document.body.classList.remove("landing-page-active");
    };
  }, [navigate]);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteError("");
    setLoading(true);

    if (!inviteCode.trim()) {
      setInviteError("Please enter an invite code");
      setLoading(false);
      return;
    }

    try {
      const inviteRef = doc(db, "inviteCodes", inviteCode.trim().toUpperCase());
      const inviteSnap = await getDoc(inviteRef);

      if (!inviteSnap.exists()) {
        setInviteError("Invalid invite code");
        setLoading(false);
        return;
      }

      const inviteData = inviteSnap.data();

      // Check if code is an admin code (unlimited usage)
      const isAdminCode = inviteData.isAdmin === true;

      // For regular codes, check if already used
      if (!isAdminCode && inviteData.used) {
        setInviteError("This invite code has already been used");
        setLoading(false);
        return;
      }

      // Mark code as used (only for non-admin codes)
      if (!isAdminCode) {
        await updateDoc(inviteRef, {
          used: true,
          usedAt: new Date().toISOString(),
          usedBy: localStorage.getItem("userIdentifier") || "anonymous"
        });
      } else {
        // For admin codes, just track usage without marking as used
        // Optionally, you could add a usage count or log
        await updateDoc(inviteRef, {
          lastUsedAt: new Date().toISOString(),
          lastUsedBy: localStorage.getItem("userIdentifier") || "anonymous"
        });
      }

      // Store validated invite code in localStorage
      localStorage.setItem("inviteCode", inviteCode.trim().toUpperCase());
      localStorage.setItem("inviteCodeValidated", "true");

      // Force page reload to ensure ProtectedRoute picks up the updated localStorage
      window.location.href = "/";
    } catch (error) {
      console.error("Error validating invite code:", error);
      setInviteError("Failed to validate invite code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWaitlistClick = () => {
    setShowEmailInput(true);
    setWaitlistError("");
  };

  const handleWaitlistCancel = () => {
    setShowEmailInput(false);
    setEmail("");
    setWaitlistError("");
  };

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    setWaitlistError("");

    if (!email.trim()) {
      setWaitlistError("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setWaitlistError("Please enter a valid email address");
      return;
    }

    setIsJoiningWaitlist(true);

    try {
      // Add to waitlist collection with email
      await addDoc(collection(db, "waitlist"), {
        email: email.trim().toLowerCase(),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });

      alert("You've been added to the waitlist! We'll reach out when you're eligible.");
      setShowEmailInput(false);
      setEmail("");
    } catch (error) {
      console.error("Error joining waitlist:", error);
      setWaitlistError("Failed to join waitlist. Please try again.");
    } finally {
      setIsJoiningWaitlist(false);
    }
  };

  const pageContainer = {
    minHeight: "100vh",
    backgroundColor: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
  };

  const mainContent = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    flex: 1,
    minHeight: "calc(100vh - var(--header-height, 80px))",
    width: "100%",
    overflow: "hidden",
  };

  const leftContent = {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    height: "100%",
  };

  const rightContent = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "80px 64px",
    width: "100%",
  };

  const contentWrapper = {
    width: "100%",
    maxWidth: "500px",
    display: "flex",
    flexDirection: "column",
  };

  const videoBackground = {
    position: "absolute",
    right: 0,
    top: 0,
    height: "100%",
    width: "auto",
    minWidth: "100%",
    objectFit: "cover",
    display: "block",
  };

  const title = {
    fontSize: "clamp(1.5rem, 2.25vw, 2rem)",
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: "12px",
    color: "#000000",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const description = {
    fontSize: "clamp(1rem, 1.5vw, 1.125rem)",
    lineHeight: 1.6,
    marginBottom: "32px",
    marginTop: "0px",
    color: "#666666",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    fontWeight: 400,
  };

  const formContainer = {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    width: "100%",
  };

  const inputContainer = {
    display: "flex",
    gap: "12px",
    width: "100%",
  };

  const inputField = {
    flex: 1,
    padding: "14px 20px",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    outline: "none",
    transition: "background-color 0.2s",
    backgroundColor: "#EAEAEA",
    color: "#000000",
  };

  const button = {
    padding: "14px 32px",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "opacity 0.2s, background-color 0.2s",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    border: "none",
    whiteSpace: "nowrap",
  };

  const nextButton = {
    ...button,
    background: "#000000",
    color: "#FFFFFF",
  };

  const waitlistButton = {
    ...button,
    background: "#E4F5FF",
    color: "#00A3FF",
    width: "100%",
  };

  const emailInputField = {
    width: "100%",
    padding: "14px 20px",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    outline: "none",
    transition: "background-color 0.2s",
    backgroundColor: "#EAEAEA",
    color: "#000000",
    marginBottom: "16px",
  };

  const buttonRow = {
    display: "flex",
    gap: "12px",
    width: "100%",
  };

  const submitButton = {
    ...button,
    background: "#E4F5FF",
    color: "#00A3FF",
    flex: 1,
  };

  const cancelButton = {
    ...button,
    background: "#000000",
    color: "#FFFFFF",
    flex: 1,
  };

  const separator = {
    display: "flex",
    alignItems: "center",
    margin: "24px 0",
    width: "100%",
  };

  const separatorLine = {
    flex: 1,
    height: "1px",
    backgroundColor: "#E0E0E0",
  };

  const separatorText = {
    padding: "0 16px",
    fontSize: "0.875rem",
    color: "#999999",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const errorText = {
    color: "#FF3B30",
    fontSize: "0.875rem",
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    marginTop: "-16px",
  };

  return (
    <>
      <style>
        {`
          @font-face {
            font-family: 'Charter';
            src: url('/fonts/charter_regular.woff2') format('woff2');
            font-weight: 400;
            font-style: normal;
          }
          
          @font-face {
            font-family: 'Charter';
            src: url('/fonts/charter_bold.woff2') format('woff2');
            font-weight: 700;
            font-style: normal;
          }
          
          @font-face {
            font-family: 'SF Pro Display';
            src: url('/fonts/SFPRODISPLAYREGULAR.OTF') format('opentype');
            font-weight: 400;
            font-style: normal;
          }
          
          @font-face {
            font-family: 'SF Pro Display';
            src: url('/fonts/SFPRODISPLAYMEDIUM.OTF') format('opentype');
            font-weight: 500;
            font-style: normal;
          }
          
          body.landing-page-active {
            background-color: #FFFFFF !important;
            background-image: none !important;
          }
          
          .invite-main-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
            overflow: hidden;
          }
          
          .invite-left-content {
            width: 100%;
            height: 100%;
            min-height: calc(100vh - var(--header-height, 80px));
            position: relative;
            overflow: hidden;
          }
          
          .invite-left-content video {
            position: absolute;
            right: 0;
            top: 0;
            height: 100%;
            width: auto;
            min-width: 100%;
            object-fit: cover;
            display: block;
          }
          
          @media (max-width: 768px) {
            .invite-main-content {
              grid-template-columns: 1fr;
            }
            
            .invite-left-content {
              min-height: 50vh;
              width: 100%;
              height: 50vh;
            }
            
            .invite-right-content {
              padding: 40px 24px !important;
            }
          }
        `}
      </style>
      <div style={pageContainer}>
        <div style={mainContent} className="invite-main-content">
          <div style={leftContent} className="invite-left-content">
            <video
              autoPlay
              loop
              muted
              playsInline
              style={videoBackground}
            >
              <source src="/bg.mp4" type="video/mp4" />
            </video>
          </div>

          <div style={rightContent} className="invite-right-content">
            <div style={contentWrapper}>
              <h1 style={title}>Fairates is invite-only</h1>
              <p style={description}>
                Enter your invite code to continue or join the waitlist. We'll reach out when you're eligible.
              </p>

              <form onSubmit={handleInviteSubmit} style={formContainer}>
                <div style={inputContainer}>
                  <input
                    type="text"
                    placeholder="Enter invite code"
                    value={inviteCode}
                    onChange={(e) => {
                      setInviteCode(e.target.value);
                      setInviteError("");
                    }}
                    style={inputField}
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    style={nextButton}
                    disabled={loading}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    {loading ? "Checking..." : "Next"}
                  </button>
                </div>
                {inviteError && <div style={errorText}>{inviteError}</div>}
              </form>

              <div style={separator}>
                <div style={separatorLine}></div>
                <span style={separatorText}>or</span>
                <div style={separatorLine}></div>
              </div>

              {!showEmailInput ? (
                <button
                  onClick={handleJoinWaitlistClick}
                  style={waitlistButton}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Join Waitlist
                </button>
              ) : (
                <form onSubmit={handleWaitlistSubmit} style={formContainer}>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setWaitlistError("");
                    }}
                    style={emailInputField}
                    disabled={isJoiningWaitlist}
                  />
                  <div style={buttonRow}>
                    <button
                      type="submit"
                      style={submitButton}
                      disabled={isJoiningWaitlist}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      {isJoiningWaitlist ? "Submitting..." : "Submit"}
                    </button>
                    <button
                      type="button"
                      onClick={handleWaitlistCancel}
                      style={cancelButton}
                      disabled={isJoiningWaitlist}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      Cancel
                    </button>
                  </div>
                  {waitlistError && <div style={errorText}>{waitlistError}</div>}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
