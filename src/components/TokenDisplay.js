import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAppContext } from "../context/AppContext";

export function TokenDisplay({ address }) {
  const { signer } = useAppContext();
  const [symbol, setSymbol] = useState("");

  useEffect(() => {
    async function fetchSymbol() {
      try {
        const provider = signer ? signer.provider : ethers.getDefaultProvider();
        const tokenContract = new ethers.Contract(address, ["function symbol() view returns (string)"], provider);
        const tokenSymbol = await tokenContract.symbol();
        setSymbol(tokenSymbol);
      } catch (e) {
        console.error("Error fetching symbol for", address, e);
        setSymbol("");
      }
    }
    if (address) {
      fetchSymbol();
    }
  }, [address, signer]);

  return (
    <>
      {address} {symbol ? `(${symbol})` : ""}
    </>
  );
} 