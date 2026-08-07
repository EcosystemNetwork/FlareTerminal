import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

/** Id of the element html5-qrcode renders the camera feed into. */
export const SCANNER_ELEMENT_ID = "reader";

const SCANNER_CONFIG = { fps: 10, qrbox: { width: 250, height: 250 } };

interface UseQRScannerOptions {
  onError?: (message: string) => void;
}

/**
 * Camera enumeration plus html5-qrcode start/stop lifecycle, shared by every
 * component that scans a banknote QR code.
 */
export const useQRScanner = ({ onError }: UseQRScannerOptions = {}) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [scannedValue, setScannedValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerRef = useRef<HTMLDivElement>(null);

  const reportError = useCallback(
    (message: string) => {
      setError(message);
      onError?.(message);
    },
    [onError]
  );

  const stopScanner = useCallback(() => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch((err) => {
        console.error("Failed to stop scanner:", err);
        onError?.("Failed to stop scanner: " + err);
      });
    }
  }, [onError]);

  const startScanner = useCallback(() => {
    if (scannerRef.current) {
      stopScanner();
    }

    scannerRef.current = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current
      .start(
        { deviceId: selectedDevice },
        SCANNER_CONFIG,
        (decodedText) => {
          setScannedValue(decodedText);
          setShowSuccess(true);
          setIsScanning(false);
          readerRef.current?.classList.add("success-flash");
          stopScanner();
        },
        (errorMessage) => {
          console.log(errorMessage);
          onError?.(errorMessage);
        }
      )
      .then(() => {
        setIsScanning(true);
      })
      .catch((err) => {
        reportError("Failed to start scanner: " + err);
      });
  }, [onError, reportError, selectedDevice, stopScanner]);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(
          (device) => device.kind === "videoinput"
        );
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDevice(videoDevices[0].deviceId);
        }
      } catch (err) {
        reportError(
          "Failed to enumerate devices: " + (err as Error).message
        );
      }
    };

    getDevices();
  }, [reportError]);

  useEffect(() => {
    if (selectedDevice && !isScanning) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevice]);

  /** Clears the last scan and resumes scanning. */
  const rescan = useCallback(() => {
    setShowSuccess(false);
    setScannedValue("");
    readerRef.current?.classList.remove("success-flash");
    startScanner();
  }, [startScanner]);

  return {
    devices,
    selectedDevice,
    setSelectedDevice,
    scannedValue,
    error,
    showSuccess,
    readerRef,
    rescan,
  };
};
