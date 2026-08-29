import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TOKEN_SYMBOLS, TokenBalances, TokenSymbol } from '../utils/tokens';

interface AddressDisplayProps {
  address: string;
  balances: TokenBalances;
  currentToken: TokenSymbol;
  onTokenChange: (token: TokenSymbol) => void;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({ address, balances, currentToken, onTokenChange }) => {
  const cycleToken = (direction: 'next' | 'prev') => {
    const currentIndex = TOKEN_SYMBOLS.indexOf(currentToken);
    const newIndex = direction === 'next'
      ? (currentIndex + 1) % TOKEN_SYMBOLS.length
      : (currentIndex - 1 + TOKEN_SYMBOLS.length) % TOKEN_SYMBOLS.length;
    onTokenChange(TOKEN_SYMBOLS[newIndex]);
  };

  const formatBalance = (balance: string) => {
    const [amount, symbol] = balance.split(' ');
    const num = parseFloat(amount);
    return `${num.toFixed(symbol === 'ETH' ? 5 : 2)} ${symbol}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '24px' }}>
      <span>{address}</span>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
        <ChevronLeft onClick={() => cycleToken('prev')} style={{ cursor: 'pointer' }} />
        <span style={{ margin: '0 10px' }}>
          {formatBalance(balances[currentToken])}
        </span>
        <ChevronRight onClick={() => cycleToken('next')} style={{ cursor: 'pointer' }} />
      </div>
    </div>
  );
};

export default AddressDisplay;
