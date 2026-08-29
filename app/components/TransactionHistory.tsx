import React from 'react';
import { Transaction } from '../types';
import { translate } from '../data/translations';

interface TransactionHistoryProps {
  transactions: Transaction[];
  language: string;
  currency: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, language, currency }) => {
  const t = translate(language);

  return (
    <div>
           <div className="container2"></div>
    <div className="container2">
      </div>
      <h2 className="merchant-title">{t.recentTransactions}</h2>
      {transactions.length === 0 ? (
        <p className="merchant-subtitle">{t.noTransactions}</p>
      ) : (
        <ul className="space-y-3">
          {transactions.map((tx, index) => (
            <li key={index} className="merchant-subtitle">
              <div className="container2">
                <span className="merchant-subtitle">{t.amount}: {currency} {tx.amount.toFixed(2)}</span>
                <span className="merchant-subtitle">{new Date(tx.timestamp).toLocaleString()}</span>
              </div>
              <p className="merchant-subtitle">{t.transactionId}: {tx.txHash.substr(0, 10)}...</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TransactionHistory;
