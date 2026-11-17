import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

type Props = {
  onScan: (text: string) => void;
  onError?: (message: string) => void;
};

export function QrScanner({ onScan, onError }: Props) {
  const started = useRef(false);

  useEffect(() => {
    const regionId = 'qr-reader';
    const scanner = new Html5Qrcode(regionId);
    let cancelled = false;

    const start = async () => {
      if (started.current) return;
      started.current = true;
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 8, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            onScan(decoded);
            // stop after first success
            scanner.stop().catch(() => {});
          },
          () => {
            /* ignore frame-by-frame miss */
          }
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Camera failed';
        onError?.(msg);
      }
    };

    start();

    return () => {
      cancelled = true;
      scanner
        .stop()
        .catch(() => {})
        .finally(() => {
            try {
                scanner.clear();
            } catch (e) {
                console.error('Failed to clear scanner', e);
            }
          started.current = false;
        });
      void cancelled; // to avoid unused variable warning
    };
  }, [onScan, onError]);

  return (
    <div
      id="qr-reader"
      className="w-full max-w-xs overflow-hidden border border-[#0E0D0B]/20 bg-black"
    />
  );
}