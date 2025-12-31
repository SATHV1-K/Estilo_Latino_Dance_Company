import React, { useState, useEffect } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { SquarePayment } from '../SquarePayment';
import { paymentService, PaymentConfig, PriceCalculation } from '../../services/paymentService';
import type { PunchCardOption, User } from '../../services/types';

interface PaymentScreenProps {
    selectedCard: PunchCardOption;
    user: User;
    onPaymentSuccess: (punchCardId: string) => void;
    onCancel: () => void;
}

const TIP_PRESETS = [1, 2, 3]; // Dollar amounts

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
    selectedCard,
    user,
    onPaymentSuccess,
    onCancel
}) => {
    const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
    const [priceCalculation, setPriceCalculation] = useState<PriceCalculation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Tip state
    const [tipAmount, setTipAmount] = useState<number>(0); // In dollars
    const [customTipInput, setCustomTipInput] = useState<string>('');
    const [showCustomTip, setShowCustomTip] = useState(false);

    useEffect(() => {
        loadPaymentData();
    }, [selectedCard]);

    const loadPaymentData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Get payment config and calculate total
            const [config, calculation] = await Promise.all([
                paymentService.getConfig(),
                paymentService.calculateTotal(Math.round(selectedCard.price * 100))
            ]);

            setPaymentConfig(config);
            setPriceCalculation(calculation);
        } catch (err: any) {
            console.error('Error loading payment data:', err);
            setError('Failed to load payment information. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectTip = (amount: number) => {
        setTipAmount(amount);
        setShowCustomTip(false);
        setCustomTipInput('');
    };

    const handleCustomTipClick = () => {
        setShowCustomTip(true);
        setTipAmount(0);
    };

    const handleCustomTipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Only allow numbers and one decimal point
        if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
            setCustomTipInput(value);
            const parsed = parseFloat(value);
            setTipAmount(isNaN(parsed) ? 0 : parsed);
        }
    };

    const handlePaymentSuccess = async (paymentToken: string) => {
        if (!priceCalculation) return;

        setIsProcessing(true);
        setError(null);

        try {
            const tipCents = Math.round(tipAmount * 100);
            const result = await paymentService.processPayment(
                paymentToken,
                selectedCard.id,
                priceCalculation.subtotalCents,
                user.email,
                tipCents
            );

            if (result.success && result.punchCardId) {
                onPaymentSuccess(result.punchCardId);
            } else {
                setError(result.error || 'Payment failed. Please try again.');
            }
        } catch (err: any) {
            console.error('Payment error:', err);
            setError(err.message || 'Payment failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentError = (errorMessage: string) => {
        setError(errorMessage);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-yellow"></div>
                <span className="ml-3 text-gray-600">Loading payment details...</span>
            </div>
        );
    }

    const taxPercent = paymentConfig?.taxRate ? (paymentConfig.taxRate * 100).toFixed(3) : '0';
    const grandTotal = priceCalculation ? priceCalculation.total + tipAmount : 0;

    return (
        <div className="min-h-screen bg-brand-black pb-24">
            {/* Header */}
            <div className="bg-brand-black border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-sm mx-auto">
                    <h1 className="text-brand-white text-xl">Complete Your Purchase</h1>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-8">
                <div className="max-w-sm mx-auto space-y-6">
                    {/* Order Summary */}
                    <Card padding="large">
                        <h3 className="text-brand-black font-semibold mb-4">Order Summary</h3>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-700">{selectedCard.name}</span>
                                <span className="text-brand-black font-medium">
                                    {selectedCard.cardCategory === 'subscription'
                                        ? 'Unlimited Classes'
                                        : `${selectedCard.classes} classes`}
                                </span>
                            </div>

                            <hr className="border-gray-200" />

                            {priceCalculation && (
                                <>
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span>Subtotal</span>
                                        <span>${priceCalculation.subtotal.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-gray-600">
                                        <span>Tax</span>
                                        <span>${priceCalculation.tax.toFixed(2)}</span>
                                    </div>

                                    {tipAmount > 0 && (
                                        <div className="flex justify-between items-center text-brand-yellow font-medium">
                                            <span>💛 Tip</span>
                                            <span>${tipAmount.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <hr className="border-gray-200" />

                                    <div className="flex justify-between items-center text-lg font-bold">
                                        <span className="text-brand-black">Total</span>
                                        <span className="text-brand-yellow">${grandTotal.toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>

                    {/* Tip Selection */}
                    <Card padding="large">
                        <h3 className="text-brand-black font-semibold mb-3">Add a Tip (Optional)</h3>
                        <p className="text-gray-500 text-sm mb-4">Show your appreciation for our instructors!</p>

                        <div className="grid grid-cols-4 gap-2 mb-3">
                            {TIP_PRESETS.map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => handleSelectTip(preset)}
                                    className={`py-3 px-2 rounded-lg font-medium transition-all ${tipAmount === preset && !showCustomTip
                                        ? 'bg-brand-yellow text-brand-black'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    ${preset}
                                </button>
                            ))}
                            <button
                                onClick={handleCustomTipClick}
                                className={`py-3 px-2 rounded-lg font-medium transition-all ${showCustomTip
                                    ? 'bg-brand-yellow text-brand-black'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Other
                            </button>
                        </div>

                        {showCustomTip && (
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-gray-600 text-lg">$</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    value={customTipInput}
                                    onChange={handleCustomTipChange}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow text-brand-black"
                                />
                            </div>
                        )}

                        {/* Show Cancel when tip is selected, otherwise show No tip */}
                        {tipAmount > 0 || showCustomTip ? (
                            <button
                                onClick={() => handleSelectTip(0)}
                                className="w-full py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                            >
                                Cancel Tip
                            </button>
                        ) : (
                            <button
                                onClick={() => handleSelectTip(0)}
                                className="w-full py-2 rounded-lg text-sm bg-brand-yellow text-brand-black font-medium transition-all"
                            >
                                No Tip
                            </button>
                        )}
                    </Card>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Square Payment Form */}
                    {paymentConfig && priceCalculation && (
                        <SquarePayment
                            applicationId={paymentConfig.applicationId}
                            locationId={paymentConfig.locationId}
                            environment={paymentConfig.environment}
                            amount={grandTotal}
                            onPaymentSuccess={handlePaymentSuccess}
                            onPaymentError={handlePaymentError}
                            disabled={isProcessing}
                        />
                    )}

                    {/* Cancel Button */}
                    <div className="mt-6">
                        <Button
                            variant="secondary"
                            onClick={onCancel}
                            disabled={isProcessing}
                            className="w-full"
                        >
                            Cancel
                        </Button>
                    </div>

                    {paymentConfig?.environment === 'sandbox' && (
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl shadow-md">
                            <h4 className="font-semibold text-blue-800 mb-2">🧪 Sandbox Test Card</h4>
                            <p className="text-blue-700 text-sm">
                                Card: <code className="bg-blue-100 px-1 rounded">4111 1111 1111 1111</code><br />
                                Exp: Any future date<br />
                                CVV: Any 3 digits<br />
                                ZIP: Any 5 digits
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentScreen;

