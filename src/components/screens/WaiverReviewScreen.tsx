import React, { useState } from 'react';
import { Button } from '../Button';
import { Card } from '../Card';
import { ArrowLeft, CheckCircle2, Download } from 'lucide-react';
import { WAIVER_CONTENT } from '../../services/waiverService';
import type { WaiverFormData } from '../../services/waiverService';

interface WaiverReviewScreenProps {
  formData: WaiverFormData;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function WaiverReviewScreen({
  formData,
  onConfirm,
  onBack,
  isSubmitting = false
}: WaiverReviewScreenProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrolledToBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 50;

    if (scrolledToBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black pb-20">
      {/* Header */}
      <div className="bg-brand-black border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className="text-brand-yellow hover:text-yellow-400 transition-colors disabled:opacity-50"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-brand-white text-xl">Review & Sign Waiver</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="w-full max-w-3xl mx-auto space-y-6">
          {/* Instructions */}
          <Card padding="medium" className="bg-yellow-900/20 border-brand-yellow/30">
            <div className="flex gap-3">
              <div className="text-brand-yellow mt-1">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-brand-yellow mb-1">Important</h3>
                <p className="text-gray-300 text-sm">
                  Please read the entire waiver agreement carefully. Scroll to the bottom to enable the agreement checkbox.
                </p>
              </div>
            </div>
          </Card>

          {/* Participant Information */}
          <Card padding="medium">
            <h2 className="text-brand-yellow mb-4">Participant Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Name</p>
                <p className="text-brand-black">{formData.firstName} {formData.lastName}</p>
              </div>
              <div>
                <p className="text-gray-400">Email</p>
                <p className="text-brand-black">{formData.email}</p>
              </div>
              <div>
                <p className="text-gray-400">Phone</p>
                <p className="text-brand-black">{formData.phone}</p>
              </div>
              <div>
                <p className="text-gray-400">Birthday</p>
                <p className="text-brand-black">{
                  // Parse date without timezone conversion (YYYY-MM-DD -> M/D/YYYY)
                  formData.birthday ? (() => {
                    const [year, month, day] = formData.birthday.split('-');
                    return `${parseInt(month)}/${parseInt(day)}/${year}`;
                  })() : 'Not provided'
                }</p>
              </div>
              <div>
                <p className="text-gray-400">Address</p>
                <p className="text-brand-black">{formData.address}</p>
              </div>
              <div>
                <p className="text-gray-400">City, State ZIP</p>
                <p className="text-brand-black">{formData.city}, {formData.state} {formData.zipCode}</p>
              </div>
              <div>
                <p className="text-gray-400">Gender</p>
                <p className="text-brand-black capitalize">{formData.gender.replace('-', ' ')}</p>
              </div>
              <div>
                <p className="text-gray-400">Occupation</p>
                <p className="text-brand-black">{formData.occupation}</p>
              </div>
            </div>
          </Card>

          {/* Waiver Content */}
          <Card padding="none">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-brand-yellow">Waiver Agreement</h2>
            </div>

            <div
              onScroll={handleScroll}
              className="p-6 h-96 overflow-y-auto bg-gray-900/50"
              style={{ scrollbarWidth: 'thin' }}
            >
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {WAIVER_CONTENT}
                </div>
              </div>


            </div>

            {hasScrolledToBottom && (
              <div className="p-6 border-t border-gray-700 bg-gray-900/30">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agree-checkbox"
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-gray-600 bg-gray-800 text-brand-yellow focus:ring-brand-yellow focus:ring-offset-0"
                  />
                  <label htmlFor="agree-checkbox" className="text-brand-white text-sm cursor-pointer">
                    I have read and understand this waiver agreement. I acknowledge that by providing my electronic signature, I voluntarily surrender certain legal rights as outlined above.
                  </label>
                </div>
              </div>
            )}
          </Card>

          {/* Signature Preview */}
          <Card padding="medium">
            <h2 className="text-brand-yellow mb-4">Your Signature</h2>
            <div className="bg-white rounded-lg p-4 mb-2">
              <img
                src={formData.signatureDataUrl}
                alt="Signature"
                className="max-h-32 mx-auto"
              />
            </div>
            <p className="text-gray-400 text-sm text-center">
              Signed on: {formData.signatureDate}
            </p>
          </Card>

          {/* Submit Button */}
          <Button
            onClick={onConfirm}
            disabled={!hasAgreed || isSubmitting}
            size="large"
            className="mt-6"
          >
            {isSubmitting ? 'Processing...' : 'Submit Waiver & Complete Registration'}
          </Button>

          {!hasScrolledToBottom && (
            <p className="text-gray-400 text-sm text-center">
              Scroll to the bottom of the waiver to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
