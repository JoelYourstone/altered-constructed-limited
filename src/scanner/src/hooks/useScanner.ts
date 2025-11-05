"use client";
import { type RefObject, useCallback, useEffect, useRef } from "react";
import { base64Beep } from "../assets/base64Beep";
import type { IUseScannerState } from "../types";
import deepEqual from "../utilities/deepEqual";

interface IUseScannerProps {
  videoElementRef: RefObject<HTMLVideoElement | null>;
  onScan: (result: DetectedBarcode[]) => void;
  onFound: (result: DetectedBarcode[]) => void;
  formats?: BarcodeFormat[];
  sound?: boolean | string;
  allowMultiple?: boolean;
  retryDelay?: number;
  scanDelay?: number;
}

export default function useScanner(props: IUseScannerProps) {
  const {
    videoElementRef,
    onScan,
    onFound,
    retryDelay = 100,
    scanDelay = 0,
    formats = [],
    allowMultiple = false,
    sound = true,
  }: IUseScannerProps = props;

  const barcodeDetectorRef = useRef(new BarcodeDetector({ formats }));
  const hasStartedRef = useRef(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const previousFormatsRef = useRef(formats);
  useEffect(() => {
    if (!deepEqual(previousFormatsRef.current, formats)) {
      barcodeDetectorRef.current = new BarcodeDetector({ formats });
    }
  }, [formats]);

  useEffect(() => {
    if (typeof window !== "undefined" && sound) {
      audioRef.current = new Audio(
        typeof sound === "string" ? sound : base64Beep
      );
    }
  }, [sound]);

  const onScanCallback = useCallback((detectedCodes: DetectedBarcode[]) => {
    onScan(detectedCodes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processFrame = useCallback(
    (state: IUseScannerState) => async (timeNow: number) => {
      if (
        videoElementRef.current !== null &&
        videoElementRef.current.readyState > 1
      ) {
        const { lastScan, contentBefore, lastScanHadContent } = state;

        if (timeNow - lastScan < retryDelay) {
          animationFrameIdRef.current = window.requestAnimationFrame(
            processFrame(state)
          );
        } else {
          const detectedCodes = await barcodeDetectorRef.current.detect(
            videoElementRef.current
          );

          const anyNewCodesDetected = detectedCodes.some(
            (code: DetectedBarcode) => {
              return !contentBefore.includes(code.rawValue);
            }
          );

          const currentScanHasContent = detectedCodes.length > 0;

          let lastOnScan = state.lastOnScan;

          const scanDelayPassed = timeNow - lastOnScan >= scanDelay;

          if (
            anyNewCodesDetected ||
            (allowMultiple && currentScanHasContent && scanDelayPassed)
          ) {
            if (sound && audioRef.current && audioRef.current.paused) {
              audioRef.current
                .play()
                .catch((error) =>
                  console.error("Error playing the sound", error)
                );
            }

            lastOnScan = timeNow;

            onScanCallback(detectedCodes);
          }

          if (currentScanHasContent) {
            onFound(detectedCodes);
          }

          if (!currentScanHasContent && lastScanHadContent) {
            onFound(detectedCodes);
          }

          const newState = {
            lastScan: timeNow,
            lastOnScan: lastOnScan,
            lastScanHadContent: currentScanHasContent,
            contentBefore: anyNewCodesDetected
              ? detectedCodes.map((code: DetectedBarcode) => code.rawValue)
              : contentBefore,
          };

          animationFrameIdRef.current = window.requestAnimationFrame(
            processFrame(newState)
          );
        }
      } else {
        animationFrameIdRef.current = window.requestAnimationFrame(
          processFrame(state)
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      videoElementRef.current,
      onScanCallback,
      onFound,
      retryDelay,
      allowMultiple,
      scanDelay,
      sound,
    ]
  );

  const startScanning = useCallback(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const current = performance.now();

    const initialState = {
      lastScan: current,
      lastOnScan: current,
      contentBefore: [],
      lastScanHadContent: false,
    };

    animationFrameIdRef.current = window.requestAnimationFrame(
      processFrame(initialState)
    );
  }, [processFrame]);

  const stopScanning = useCallback(() => {
    if (animationFrameIdRef.current !== null) {
      window.cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
  }, []);

  return {
    startScanning,
    stopScanning,
  };
}
