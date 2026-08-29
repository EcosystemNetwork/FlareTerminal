import React, { useState, useEffect } from 'react';
import { mintBanknote, getBanknoteInfo, getTokenAddresses } from '../utils/web3';
import { web3auth } from '../utils/web3';
import {
  BANKNOTE_DENOMINATIONS,
  formatPrivateKey,
  generateAndSaveBanknotePDF,
  generateBanknotePrivateKey,
} from '../utils/banknote';
import { TOKEN_SYMBOLS, TokenAddresses, TokenSymbol } from '../utils/tokens';

interface BanknotePrinterProps {
  onClose: () => void;
  onPrint: () => void;
}

const BanknotePrinter: React.FC<BanknotePrinterProps> = ({ onClose, onPrint }) => {
  const [denomination, setDenomination] = useState('2');
  const [tokenSymbol, setTokenSymbol] = useState<TokenSymbol>('USDC');
  const [privateKey, setPrivateKey] = useState('');
  const [formattedPrivateKey, setFormattedPrivateKey] = useState('');
  const [uniqueIdentifier, setUniqueIdentifier] = useState('');
  const [tokenAddresses, setTokenAddresses] = useState<Partial<TokenAddresses>>({});

  useEffect(() => {
    generateNewPrivateKey();
    fetchTokenAddresses();
  }, []);

  const fetchTokenAddresses = async () => {
    const addresses = await getTokenAddresses();
    setTokenAddresses(addresses);
  };

  const generateNewPrivateKey = () => {
    const key = generateBanknotePrivateKey();
    setPrivateKey(key);
    setFormattedPrivateKey(formatPrivateKey(key));
  };

  const printBanknote = async () => {
    if (!web3auth.provider) {
      console.error("Web3Auth provider not available");
      return;
    }

    try {
      const tokenAddress = tokenAddresses[tokenSymbol];
      if (!tokenAddress) {
        console.error(`Token address not found for ${tokenSymbol}`);
        return;
      }

      const { txHash, id, requestId } = await mintBanknote(
        web3auth.provider,
        tokenAddress,
        parseInt(denomination)
      );

      console.log(`Banknote minted. Transaction: ${txHash}, ID: ${id}, RequestID: ${requestId}`);

      // Wait for the randomness to be fulfilled (you might need to implement a polling mechanism or use events)
      const banknoteInfo = await getBanknoteInfo(web3auth.provider, id);
      setUniqueIdentifier(banknoteInfo.uniqueIdentifier);

      await generateAndSaveBanknotePDF({
        denomination,
        tokenSymbol,
        id: banknoteInfo.uniqueIdentifier,
        privateKey,
      });
    } catch (error) {
      console.error("Error generating banknote:", error);
    }
  };

  return (
    <div className="banknote-printer" style={{ padding: '6px', textAlign: 'center' }}>
      <div>Print Test Banknote</div>
      <div style={{ marginBottom: '10px' }}>
        <select
          value={denomination}
          onChange={(e) => setDenomination(e.target.value)}
          style={{ padding: '5px', margin: '5px', width: '100px' }}
        >
          {BANKNOTE_DENOMINATIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={tokenSymbol}
          onChange={(e) => setTokenSymbol(e.target.value as TokenSymbol)}
          style={{ padding: '5px', margin: '5px', width: '100px' }}
        >
          {TOKEN_SYMBOLS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <input
        type="text"
        placeholder="Private Key"
        value={formattedPrivateKey}
        readOnly
        style={{ padding: '5px', margin: '5px', width: 'calc(100% - 20px)' }}
      />
      <button onClick={generateNewPrivateKey} style={{ padding: '5px 10px', margin: '5px' }}>Generate New Key</button>
      <button onClick={printBanknote} style={{ padding: '5px 10px', margin: '5px' }}>Print</button>
      {uniqueIdentifier && (
        <div style={{ marginTop: '10px' }}>
          Unique Identifier: {uniqueIdentifier}
        </div>
      )}
    </div>
  );
};

export default BanknotePrinter;