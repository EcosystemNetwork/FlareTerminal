import React from "react";
import { SCANNER_ELEMENT_ID } from "../../hooks/useQRScanner";

interface CameraFeedProps {
  devices: MediaDeviceInfo[];
  selectedDevice: string;
  onDeviceChange: (deviceId: string) => void;
  readerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Camera picker plus the viewport html5-qrcode draws into, including the
 * flash animation played on a successful scan.
 */
const CameraFeed: React.FC<CameraFeedProps> = ({
  devices,
  selectedDevice,
  onDeviceChange,
  readerRef,
}) => (
  <>
    <select
      value={selectedDevice}
      onChange={(e) => onDeviceChange(e.target.value)}
      className="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
    >
      {devices.map((device) => (
        <option key={device.deviceId} value={device.deviceId}>
          {device.label || `Camera ${device.deviceId}`}
        </option>
      ))}
    </select>
    <div className="container2"></div>
    <div
      id={SCANNER_ELEMENT_ID}
      ref={readerRef}
      className="w-full max-w-sm mx-auto border-4 border-transparent transition-all duration-300"
    ></div>
    <style jsx>{`
      @keyframes flash {
        0%,
        100% {
          border-color: transparent;
        }
        50% {
          border-color: #10b981;
        }
      }
      .success-flash {
        animation: flash 0.5s linear infinite;
      }
    `}</style>
  </>
);

export default CameraFeed;
