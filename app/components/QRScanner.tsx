import React from 'react';
import CameraFeed from './QR/CameraFeed';
import { useQRScanner } from '../hooks/useQRScanner';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
  const {
    devices,
    selectedDevice,
    setSelectedDevice,
    scannedValue,
    showSuccess,
    readerRef,
    rescan,
  } = useQRScanner({ onError });

  const handleConfirm = () => {
    onScan(scannedValue);
    rescan();
  };

  return (
    <div className="space-y-4">
      <CameraFeed
        devices={devices}
        selectedDevice={selectedDevice}
        onDeviceChange={setSelectedDevice}
        readerRef={readerRef}
      />
      {showSuccess && (
        <div className="mt-4 p-4 bg-green-100 rounded-md">
          <p className="text-green-800 font-bold">QR Code Scanned Successfully!</p>
          <p className="text-green-800">Scanned Value: {scannedValue}</p>
          <button
            onClick={handleConfirm}
            className="mt-2 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Confirm and Proceed
          </button>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
