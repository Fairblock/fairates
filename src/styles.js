
const FAIRYRING_CONTRACT_ADDRESS =
  "0x1bdCDE229FE055D91C306987DB6f74737e13065f";
const ERC20ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
];
const T1_ADDRESS = "0xDB1E18f9eb609FD8027DF1fCcc06315f019C0dA0";
const DEFAULT_COLLATERAL =
  "0x2367dDf156601b411479A3745B20f0618055270E";

const T2_ADDRESS =
  "0x2367dDf156601b411479A3745B20f0618055270E";
const T3_ADDRESS =
  "0xf59D050BeA595f6F3A47e0a28e85B23BFB56DD81";

const T1_FAUCET =
  "0x23F62098dE48391AcdEFA14D9C0fCa5f30EEb5a8";
const T2_FAUCET =
  "0xb7D6e143417E0e097365296408f0c8B41b60493B";
const T3_FAUCET =
  "0x2369F3ed583DE7cA80c46977d323119d24674824";
const COLORS = {
  bgDark: "#080808",
  textPrimary: "#FFFFFF",
  textMuted: "#BDBDBD",
  accent: "#9B3DFF",
  accentHover: "#B570FF",
  buttonBorder: "rgba(255,255,255,0.15)",
};
const FONT_FAMILY = `"Montserrat", sans-serif`;

const sectionWrap = {
  marginBottom: "54px",
};

const sectionHeading = {
  fontSize: "28px",
  fontWeight: 400,
  color: COLORS.accent,
  marginBottom: "8px",
};

const sectionSub = {
  fontSize: "18px",
  lineHeight: 1.55,
  color: COLORS.textMuted,
  marginBottom: "32px",
  maxWidth: 640,
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "32px",
};
const formGridMobile = "@media(max-width: 860px){grid-template-columns:1fr!important;}";

const labelNew = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#FFFFFF",
  marginBottom: "8px",
};

const inputNew = {
  width: "100%",
  padding: "18px 20px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.25)",
  color: COLORS.textPrimary,
  fontSize: "18px",
  outline: "none",
  transition: "box-shadow .18s,border .18s",
};
const inputFocusGlow =
  "box-shadow:0 0 0 3px rgba(155,61,255,0.45);border-color:#9B3DFF";



function applyFocusGlow(e) {
  e.currentTarget.style.boxShadow = inputFocusGlow;
  e.currentTarget.style.borderColor = COLORS.accent;
}
function removeFocusGlow(e) {
  e.currentTarget.style.boxShadow = "";
  e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
}

const topBarStyle = {
  display: "flex",
  alignItems: "center",
  padding: "0 64px",
  height: "112px",
  backdropFilter: "blur(6px)",
  background: "rgba(8,8,8,0.72)",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  flexWrap: "wrap",
};
const navLink = {
  fontSize: "18px",
  fontWeight: 400,
  marginLeft: "64px",
  color: COLORS.textPrimary,
};
const logoStyle = { height: 100 };

const walletBtnBase = {
  height: "56px",
  display: "flex",
  alignItems: "center",
  padding: "0 20px",
  borderRadius: "9999px",
  border: `1px solid ${COLORS.buttonBorder}`,
  background: "transparent",
  color: COLORS.textPrimary,
  fontWeight: 500,
  fontFamily: FONT_FAMILY,
  cursor: "pointer",
  transition: "background .18s",
};


const heroHeading = {
  fontFamily: "'Montserrat', sans-serif",
  fontSize: "65px",
  fontWeight: 200,
  lineHeight: 1.2,
  letterSpacing: "-0.02em",
  marginBottom: "40px",
  color: "#fff",
};

const heroSub = {
  fontSize: "26px",
  lineHeight: 1.55,
  margin: "0 0 24px 0",
  color: COLORS.textMuted,
};

const ctaRow = {
  display: "flex",
  gap: "32px",
  justifyContent: "center",
  flexWrap: "wrap",
};
const primaryBtn = {
  background: COLORS.accent,
  color: "#FFF",
  border: "none",
  padding: "24px 56px",
  borderRadius: "16px",
  fontSize: "22px",
  fontWeight: 400,
  cursor: "pointer",
  transition: "background .18s",
};
const primaryBtnWide = {
  ...primaryBtn,
  width: 260,
};
const secondaryBtn = {
  ...primaryBtn,
  background: "#FFF",
  color: COLORS.bgDark,
};


const ARBITRUM_SEPOLIA = {
  chainId: "0x66eee",
  chainName: "Arbitrum Sepolia Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://arb-sepolia.g.alchemy.com/v2/dGQpXrSNg3TUJ9Mm6ztTUQ2mtSeoMYcZ"],
  blockExplorerUrls: ["https://sepolia.arbiscan.io"],
};


const globalBgCss = `
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

body {
  background-color: ${COLORS.bgDark};
  background-image: url("/home-bg.png");
  background-position: center bottom;
  background-repeat: no-repeat;

  /* ← make the image exactly as wide as the viewport */
  background-size: 100% auto;

  /* optional: lock it in place if you scroll */
  background-attachment: fixed;

  color: ${COLORS.textPrimary};
  font-family: ${FONT_FAMILY};
  -webkit-font-smoothing: antialiased;
}

`;


const buttonStyle = {
  backgroundColor: "#444",
  color: "#fff",
  border: "none",
  padding: "0.7rem 1.2rem",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 500,
  transition: "background-color 0.2s ease-in-out",
  fontFamily: "EB Garabond",
  whiteSpace: "nowrap",
};
const buttonStyleBid = {
  ...buttonStyle,
  width: "25%",
};
const buttonStyleAuction = {
  ...buttonStyle,
  width: "40%",
};
const inputStyle = {
  width: "40%",
  marginBottom: "0.7rem",
  padding: "0.7rem 1.2rem",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "1rem",
  color: "#333",
  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
  transition: "border-color 0.2s ease-in-out",
  fontFamily: "EB Garabond",
  marginRight: "0.7rem",
};
const inputStyleCollat = {
  ...inputStyle,
  width: "100%",
};
const cardStyle = {
  backgroundColor: "#fff",
  color: "#333",
  padding: "1.5rem",
  marginTop: "1.5rem",
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  fontFamily: "EB Garabond",
};

const auctionPageOuterStyle = {
  backgroundColor: "#f7f7f7",
  padding: "2rem",
  borderRadius: "10px",
  maxWidth: "1200px",
  margin: "2rem auto",
  display: "grid",
  gridTemplateRows: "auto auto auto",
  rowGap: "2rem",
};
const auctionTitleStyle = {
  textAlign: "center",
  color: "#555",
  fontSize: "1.8rem",
  marginBottom: "1.5rem",
  fontWeight: "bold",
};
const threeColumnGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "2rem",
};
const proSectionCardStyle = {
  backgroundColor: "#fff",
  borderRadius: "8px",
  boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
  padding: "1.5rem",
  display: "flex",
  flexDirection: "column",
};
const labelStyle = {
  display: "block",
  marginBottom: "0.3rem",
  marginTop: "0.8rem",
  fontWeight: 600,
  color: "#666",
  fontSize: "0.95rem",
};
const tableStyle = {
  width: "100%",
  borderSpacing: 0,
  borderCollapse: "collapse",
  marginBottom: "0.7rem",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};
const tdStyle = {
  padding: "0.5rem",
  borderBottom: "1px solid #e0e0e0",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};
const selectStyle = {
  width: "20%",
  padding: "0.5rem",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "1rem",
  color: "#333",
  fontFamily: "EB Garabond",
  marginTop: "1rem",
  marginRight: "0.5rem",
};
const selectStyleWallet = {
  ...selectStyle,
  width: "70%",
};

const mobileCss = `
   @media (max-width: 768px) {
     .auction-page-outer {
       padding: 1rem !important;
       margin: 1rem auto !important;
     }
     .three-column-grid {
       grid-template-columns: 1fr !important;
       gap: 1rem !important;
     }
     .responsive-input,
     .responsive-select,
     .responsive-button {
       width: 100% !important;
     }
   }
 `;
const responsiveCss = `
     @media (max-width: 768px) {
    .auction-page-outer { … }
    .three-column-grid  { … }
    .responsive-input,
    .responsive-select,
    .responsive-button { … }
 
  }
 @media (max-width: 768x) {
   /* tighten up the nav container */
   nav {
     padding: 0 8px !important;
   }
 
   /* really small links */
   .nav-link {
     font-size: 6px !important;
     margin-left: 6px  !important;
   }
 
   /* shrink the wallet-connect select & button */
   nav > div select,
   .wallet-pill {
     font-size: 12px !important;
     padding:    4px 6px !important;
   }
 }
 
 @media (max-width: 540px) {
   /* shrink the logo height */
   nav > img {
     height: 65px !important;
     width: auto    !important;
   }
 }
 
    @media (max-width: 540px) {
   .hero-sub {
     font-size: 18px !important;
     line-height: 1.4 !important;
     max-width: 90%   !important;
     margin: 0 auto 32px !important;
   }
 }
 
 .wrap-addr { word-break: break-all; overflow-wrap: anywhere; }
    /*  Deploy-page layout : stack on narrow screens  */
 @media (max-width: 860px){
   .deploy-flex{
     flex-direction:column!important;
     gap:48px!important;
     align-items:center;         /* keeps the card centred          */
   }
   .deploy-flex .purple-card{
     width:90%!important;        /* card fills width nicely          */
     margin:0 auto!important;
   }
 }
 
    /* 1 — fluid body font-size … 320 → 1440 px */
    html{font-size:clamp(14px,1.2vw + .5rem,18px);}
    
    /* 2 — ‘purple-card’ (the frosted rectangles) go edge-to-edge */
    @media(max-width:640px){
      .purple-card{width:90%!important;padding:24px!important;}
    }
    
    /* 3 — 2-column grids collapse */
    @media(max-width:860px){
      .grid-2{grid-template-columns:1fr!important;}
    }
    
    /* 4 — big CTA buttons fill the width */
    @media(max-width:540px){
      .btn-primary{width:100%!important;padding:16px 0!important;}
    }
    
    /* 5 — headings down-scale just a bit */
    @media(max-width:540px){
      h1{font-size:2rem!important;}
      h2{font-size:1.4rem!important;}
      h3{font-size:1.2rem!important;}
    }
 
    /*  nav bar  -------------------------------------------------- */
 @media(max-width:640px){
   nav{padding:0 20px !important;}        /* narrower side-gutter           */
   .nav-link{                            /* we’ll add this class below     */
     font-size:10px!important;           /* smaller text                   */
     margin-left:24px!important;         /* tighter spacing                */
   }
 
  
 }
 @media (max-width: 540px) {
   /* super-compact wallet button */
   .wallet-pill {
     font-size: 9px      !important;
     padding:    2px 6px !important;
     height:     auto     !important;
     line-height: 1      !important;
   }
 }
 /* responsiveCss */
 @media (max-width: 540px) {
   /* tighten nav container */
   nav {
     padding: 0 8px !important;
   }
   /* shrink logo */
   nav > img {
     height: 48px !important;
     width: auto   !important;
   }
   /* extra-small links */
   .nav-link {
     font-size: 16px !important;
     margin-left: 6px  !important;
   }
   /* super-compact wallet select & pill */
   nav select,
   .wallet-pill {
     font-size:   9px      !important;
     padding:     3px 7px  !important;
     height:      auto     !important;
     line-height: 1        !important;
   }
 }
 
 
   
    `;


export {
  FAIRYRING_CONTRACT_ADDRESS,
  ERC20ABI,
  T1_ADDRESS,
  DEFAULT_COLLATERAL,
  T2_ADDRESS,
  T3_ADDRESS,
  T1_FAUCET,
  T2_FAUCET,
  T3_FAUCET,
  ARBITRUM_SEPOLIA,
  COLORS,
  FONT_FAMILY,
  globalBgCss,
  sectionWrap,
  sectionHeading,
  sectionSub,
  formGrid,
  formGridMobile,
  labelNew,
  inputNew,
  inputFocusGlow,
  applyFocusGlow,
  removeFocusGlow,
  walletBtnBase,
  topBarStyle,
  navLink,
  logoStyle,

  heroHeading,
  heroSub,
  ctaRow,
  primaryBtnWide,



  buttonStyleBid,
  buttonStyleAuction,

  auctionPageOuterStyle,
  auctionTitleStyle,
  threeColumnGridStyle,
  proSectionCardStyle,
  responsiveCss,
  mobileCss
}