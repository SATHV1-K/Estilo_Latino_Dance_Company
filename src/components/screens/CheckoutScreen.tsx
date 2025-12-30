import React, { useState } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';
import { ArrowLeft, CreditCard, Lock, Check } from 'lucide-react';

interface PunchCardOption {
  id: string;
  name: string;
  classes: number;
  expirationMonths: number;
  price: number;
  pricePerClass: number;
}

interface CheckoutScreenProps {
  selectedCard: PunchCardOption;
  onBack: () => void;
  onComplete: () => void;
}

export function CheckoutScreen({ selectedCard, onBack, onComplete }: CheckoutScreenProps) {
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentChange = (field: string, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onComplete();
    }, 2000);
  };

  const tax = selectedCard.price * 0.08; // 8% tax
  const total = selectedCard.price + tax;

  return (
    <div className="min-h-screen bg-brand-black pb-24">
      {/* Header */}
      <div className="bg-brand-black border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-sm mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-brand-yellow hover:text-yellow-400 transition-colors"
            disabled={isProcessing}
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-brand-white text-xl font-semibold">Checkout</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="max-w-sm mx-auto space-y-6">
          {/* Order Summary */}
          <Card padding="medium" variant="dark" className="border-2 border-brand-yellow">
            <CardHeader>
              <CardTitle className="text-brand-yellow">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-brand-white font-medium">{selectedCard.name}</p>
                    <p className="text-gray-400 text-sm">{selectedCard.classes} classes</p>
                  </div>
                  <p className="text-brand-white font-semibold">${selectedCard.price.toFixed(2)}</p>
                </div>
                
                <div className="border-t border-gray-700 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-brand-white">${selectedCard.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tax (8%)</span>
                    <span className="text-brand-white">${tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t-2 border-gray-700 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-brand-white font-semibold text-lg">Total</span>
                    <span className="text-brand-yellow font-bold text-2xl">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Value Highlight */}
                <div className="bg-brand-yellow/10 rounded-lg p-3 mt-4 border border-brand-yellow/30">
                  <p className="text-brand-yellow text-xs text-center">
                    Only ${selectedCard.pricePerClass.toFixed(2)} per class! Valid for {selectedCard.expirationMonths} months.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card padding="medium" variant="dark">
            <CardHeader>
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="text-brand-yellow" size={24} />
                <CardTitle className="text-brand-yellow">Payment Information</CardTitle>
              </div>
            </CardHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Card Number"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={paymentData.cardNumber}
                onChange={(e) => handlePaymentChange('cardNumber', e.target.value)}
                maxLength={19}
                required
              />

              <Input
                label="Cardholder Name"
                type="text"
                placeholder="John Doe"
                value={paymentData.cardName}
                onChange={(e) => handlePaymentChange('cardName', e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Expiry Date"
                  type="text"
                  placeholder="MM/YY"
                  value={paymentData.expiryDate}
                  onChange={(e) => handlePaymentChange('expiryDate', e.target.value)}
                  maxLength={5}
                  required
                />

                <Input
                  label="CVV"
                  type="text"
                  placeholder="123"
                  value={paymentData.cvv}
                  onChange={(e) => handlePaymentChange('cvv', e.target.value)}
                  maxLength={4}
                  required
                />
              </div>

              {/* Security Notice */}
              <div className="flex items-start gap-2 bg-gray-800 border border-gray-700 rounded-lg p-3">
                <Lock size={16} className="text-brand-yellow mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 text-xs">
                  Your payment information is encrypted and secure. We use Stripe for payment processing.
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                size="large" 
                className="mt-6"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock size={20} />
                    Complete Payment - ${total.toFixed(2)}
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-4 text-gray-400 text-xs">
            <div className="flex items-center gap-1">
              <Lock size={12} />
              <span>Secure</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Check size={12} />
              <span>Encrypted</span>
            </div>
            <span>•</span>
            <span>Powered by Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
}