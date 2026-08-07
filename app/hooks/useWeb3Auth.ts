import { useState, useEffect, useCallback } from 'react';
import { web3auth } from '../utils/web3';
import { getTokenBalance } from '../utils/web3';

export const useWeb3Auth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [error, setError] = useState<string | null>(null);

  const updateUserInfo = useCallback(async () => {
    if (web3auth.provider) {
      const addr = await web3auth.provider.request({ method: "eth_accounts" }) as string[];
      setAddress(Array.isArray(addr) ? addr[0] : addr);
      const bal = await getTokenBalance(web3auth.provider, addr[0] as `0x${string}`, addr[0] as `0x${string}`);
      setBalance(bal);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await web3auth.initModal();
        if (web3auth.connected) {
          setIsLoggedIn(true);
          await updateUserInfo();
        }
      } catch (err) {
        console.error("Error initializing Web3Auth:", err);
        setError("Failed to initialize authentication: " + (err as Error).message);
      }
    };
    init();
  }, [updateUserInfo]);

  const login = useCallback(async () => {
    setError(null);
    try {
      if (!web3auth.connected) {
        await web3auth.connect();
      }
      setIsLoggedIn(true);
      await updateUserInfo();
    } catch (err) {
      console.error("Error logging in:", err);
      setError("Login failed: " + (err as Error).message);
    }
  }, [updateUserInfo]);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await web3auth.logout();
      setIsLoggedIn(false);
      setAddress("");
      setBalance("");
    } catch (err) {
      console.error("Error logging out:", err);
      setError("Logout failed: " + (err as Error).message);
    }
  }, []);

  return { isLoggedIn, address, balance, error, login, logout };
};