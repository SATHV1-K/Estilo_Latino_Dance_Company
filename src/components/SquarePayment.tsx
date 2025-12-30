import React, { useEffect, useState, useRef } from 'react';
import { Card } from './Card';
import { Button } from './Button';

declare global {
    interface Window {
        Square?: any;
    }
}

interface SquarePaymentProps {
    applicationId: string;
    locationId: string;
    environment?: string;  // 'sandbox' or 'production'
    amount: number;  // Total amount in dollars
    onPaymentSuccess: (paymentToken: string) => void;
    onPaymentError: (error: string) => void;
    disabled?: boolean;
}

export const SquarePayment: React.FC<SquarePaymentProps> = ({
    applicationId,
    locationId,
    environment = 'sandbox',
    amount,
    onPaymentSuccess,
    onPaymentError,
    disabled = false
}) => {
    const [card, setCard] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const cardContainerRef = useRef<HTMLDivElement>(null);
    const paymentsRef = useRef<any>(null);

    useEffect(() => {
        loadSquareSDK();
    }, [applicationId, locationId]);

    const loadSquareSDK = async () => {
        try {
            // Check if SDK is already loaded
            if (window.Square) {
                await initializeCard();
                return;
            }

            // Load Square Web Payments SDK - use production or sandbox
            const script = document.createElement('script');
            const sdkUrl = environment === 'production'
                ? 'https://web.squarecdn.com/v1/square.js'
                : 'https://sandbox.web.squarecdn.com/v1/square.js';
            script.src = sdkUrl;
            console.log(`📦 Loading Square SDK (${environment}):`, sdkUrl);
            script.onload = async () => {
                await initializeCard();
            };
            script.onerror = () => {
                setError('Failed to load payment SDK');
                setIsLoading(false);
            };
            document.body.appendChild(script);
        } catch (err) {
            console.error('Error loading Square SDK:', err);
            setError('Failed to initialize payment form');
            setIsLoading(false);
        }
    };

    const initializeCard = async () => {
        try {
            if (!window.Square) {
                throw new Error('Square SDK not loaded');
            }

            const payments = window.Square.payments(applicationId, locationId);
            paymentsRef.current = payments;

            const cardInstance = await payments.card();
            await cardInstance.attach('#card-container');

            setCard(cardInstance);
            setIsLoading(false);
            setError(null);
        } catch (err: any) {
            console.error('Error initializing card:', err);
            setError(err.message || 'Failed to initialize payment form');
            setIsLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!card) {
            setError('Payment form not ready');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const result = await card.tokenize();

            if (result.status === 'OK') {
                onPaymentSuccess(result.token);
            } else {
                let errorMessage = 'Payment failed';
                if (result.errors && result.errors.length > 0) {
                    errorMessage = result.errors.map((e: any) => e.message).join(', ');
                }
                setError(errorMessage);
                onPaymentError(errorMessage);
            }
        } catch (err: any) {
            console.error('Error tokenizing card:', err);
            const errorMessage = err.message || 'Payment processing failed';
            setError(errorMessage);
            onPaymentError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-brand-black mb-4">
                Payment Information
            </h3>

            {isLoading && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow"></div>
                    <span className="ml-3 text-gray-600">Loading payment form...</span>
                </div>
            )}

            <div
                id="card-container"
                ref={cardContainerRef}
                className={`min-h-[100px] ${isLoading ? 'hidden' : ''}`}
                style={{ minHeight: '100px' }}
            />

            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            <div className="mt-6">
                <Button
                    onClick={handlePayment}
                    disabled={disabled || isLoading || isProcessing || !card}
                    className="w-full"
                >
                    {isProcessing ? (
                        <span className="flex items-center justify-center">
                            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                            Processing...
                        </span>
                    ) : (
                        `Pay $${amount.toFixed(2)}`
                    )}
                </Button>
            </div>

            <p className="mt-4 text-xs text-gray-500 text-center">
                🔒 Your payment is secured by Square
            </p>
        </Card>
    );
};

export default SquarePayment;
