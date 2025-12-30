import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card } from './Card';
import { Button } from './Button';
import { Camera, X, RefreshCw } from 'lucide-react';

interface QRScannerProps {
    onScanSuccess: (qrCode: string) => void;
    onClose: () => void;
}

export function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(true);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let mounted = true;
        let isScannerRunning = false;

        const startScanner = async () => {
            try {
                setIsStarting(true);
                setError(null);

                // Create scanner instance
                const scanner = new Html5Qrcode('qr-reader');
                scannerRef.current = scanner;

                // Request camera permission and start scanning
                await scanner.start(
                    { facingMode: 'environment' }, // Use back camera
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                    },
                    async (decodedText) => {
                        // Success callback
                        if (mounted && isScannerRunning) {
                            isScannerRunning = false; // Prevent double stop
                            try {
                                // Stop scanner before calling the callback
                                await scanner.stop();
                            } catch (stopError) {
                                // Ignore stop errors - scanner might already be stopped
                                console.log('Scanner stop (success callback):', stopError);
                            }
                            onScanSuccess(decodedText);
                        }
                    },
                    (errorMessage) => {
                        // Error callback (called frequently, just for decoding attempts)
                        // We don't need to show these errors
                    }
                );

                if (mounted) {
                    isScannerRunning = true;
                    setIsStarting(false);
                }
            } catch (err) {
                console.error('Scanner error:', err);
                if (mounted) {
                    setIsStarting(false);
                    if (err instanceof Error) {
                        if (err.message.includes('Permission denied')) {
                            setError('Camera permission denied. Please allow camera access and try again.');
                        } else if (err.message.includes('No cameras found')) {
                            setError('No camera found on this device.');
                        } else {
                            setError('Failed to start camera. Please try again.');
                        }
                    } else {
                        setError('Failed to start camera. Please try again.');
                    }
                }
            }
        };

        startScanner();

        // Cleanup
        return () => {
            mounted = false;
            if (scannerRef.current && isScannerRunning) {
                isScannerRunning = false;
                scannerRef.current.stop().catch((err) => {
                    // Ignore errors during cleanup - scanner might not be running
                    console.log('Scanner stop (cleanup):', err);
                });
            }
        };
    }, [onScanSuccess]);

    const handleRetry = () => {
        setError(null);
        setIsStarting(true);
        // Force re-mount by updating state
        window.location.reload();
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
            {/* Header */}
            <div className="bg-brand-black border-b border-gray-700 px-4 py-4 flex items-center justify-between">
                <h2 className="text-brand-white text-lg">Scan QR Code</h2>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-brand-white transition-colors p-2"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Scanner Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                {isStarting && !error && (
                    <div className="text-center mb-4">
                        <div className="w-12 h-12 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Starting camera...</p>
                    </div>
                )}

                {error && (
                    <Card padding="large" className="bg-red-900/20 border-red-500 text-center max-w-sm">
                        <div className="text-red-300 mb-4">{error}</div>
                        <Button variant="secondary" onClick={handleRetry}>
                            <RefreshCw size={20} />
                            Try Again
                        </Button>
                    </Card>
                )}

                <div
                    id="qr-reader"
                    ref={containerRef}
                    className={`w-full max-w-sm mx-auto ${error ? 'hidden' : ''}`}
                    style={{ minHeight: '300px' }}
                />

                {!error && !isStarting && (
                    <p className="text-gray-400 text-sm text-center mt-4">
                        Point your camera at the customer's QR code
                    </p>
                )}
            </div>

            {/* Cancel Button */}
            <div className="p-4 bg-brand-black border-t border-gray-700">
                <Button variant="secondary" onClick={onClose} className="w-full">
                    Cancel
                </Button>
            </div>
        </div>
    );
}
