import React from "react";
import CameraFeed from "./QR/CameraFeed";
import { useQRScanner } from "../hooks/useQRScanner";

const CameraTest = () => {
  const {
    devices,
    selectedDevice,
    setSelectedDevice,
    scannedValue,
    error,
    showSuccess,
    readerRef,
    rescan,
  } = useQRScanner();

  return (
    <div className="space-y-4">
      <h3 className="merchant-title">Camera Test</h3>
      <div className="container2"></div>
      <div>
        <h3 className="merchant-subtitle">
          Hold up a QR code to test your camera and print it&apos;s value below.
        </h3>
      </div>
      <div className="container2"></div>
      {error && <p className="text-red-500">{error}</p>}
      <CameraFeed
        devices={devices}
        selectedDevice={selectedDevice}
        onDeviceChange={setSelectedDevice}
        readerRef={readerRef}
      />
      {showSuccess && (
        <div className="container2">
          <p className="merchant-subtitle">QR Code Success!</p>
          <p className="merchant-subtitle">Scanned Value: {scannedValue}</p>
          <button
            onClick={rescan}
            className="mt-2 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Confirm and Scan Again
          </button>
        </div>
      )}
    </div>
  );
};

export default CameraTest;
