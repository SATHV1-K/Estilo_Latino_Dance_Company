import React, { useState, useEffect } from 'react';
import { Button } from '../Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../Card';
import { Badge } from '../Badge';
import { ArrowLeft, Check, Calendar, Clock, Loader2 } from 'lucide-react';
import { punchCardService } from '../../services';
import type { PunchCardOption } from '../../services';

interface PunchCardOptionsProps {
  onBack: () => void;
  onSelectCard: (card: PunchCardOption) => void;
}

export function PunchCardOptions({ onBack, onSelectCard }: PunchCardOptionsProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [cardOptions, setCardOptions] = useState<PunchCardOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load card options on mount
  useEffect(() => {
    const loadCardOptions = async () => {
      try {
        setLoading(true);
        console.log('[PunchCardOptions] Fetching card options...');
        const options = await punchCardService.getCardOptions();
        console.log('[PunchCardOptions] Received options:', options);
        if (options.length > 0) {
          console.log('[PunchCardOptions] First card price:', options[0].price, 'pricePerClass:', options[0].pricePerClass);
        }
        setCardOptions(options);
        setError(null);
      } catch (err) {
        console.error('[PunchCardOptions] Error loading card options:', err);
        setError('Failed to load card options. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadCardOptions();
  }, []);

  const handleSelect = (card: PunchCardOption) => {
    setSelectedCard(card.id);
    // Small delay for visual feedback before navigation
    setTimeout(() => {
      onSelectCard(card);
    }, 150);
  };

  const getExpirationText = (months: number) => {
    if (months === 0) return 'No expiration';
    return `${months} month${months > 1 ? 's' : ''} from purchase`;
  };

  return (
    <div className="min-h-screen bg-brand-black pb-24">
      {/* Header */}
      <div className="bg-brand-black border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-sm mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-brand-yellow hover:text-yellow-400 transition-colors touch-target"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-brand-white text-xl">Choose Your Punch Card</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="max-w-sm mx-auto">
          <p className="text-gray-400 text-sm mb-6">
            Select the punch card that best fits your schedule. Cards expire from purchase date, not first check-in.
          </p>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={48} className="text-brand-yellow animate-spin mb-4" />
              <p className="text-gray-400">Loading card options...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <Card padding="large" className="bg-red-900/20 border-red-500 text-center">
              <p className="text-red-300 mb-4">{error}</p>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </Card>
          )}

          {/* Card Grid */}
          {!loading && !error && cardOptions.length > 0 && (
            <>
              {/* Salsa & Bachata Punch Cards Section */}
              {cardOptions.filter(c => c.cardCategory !== 'subscription').length > 0 && (
                <>
                  <h2 className="text-brand-yellow text-lg font-semibold mb-4">💃 Salsa & Bachata</h2>
                  <div className="space-y-4 mb-8">
                    {cardOptions.filter(c => c.cardCategory !== 'subscription').map((card) => {
                      const isBestValue = card.id === '15-class';

                      return (
                        <Card
                          key={card.id}
                          padding="none"
                          className={`border-2 transition-all duration-200 ${selectedCard === card.id
                            ? 'border-brand-yellow shadow-lg shadow-brand-yellow/20 scale-[1.02]'
                            : 'border-gray-700 hover:border-gray-600'
                            }`}
                        >
                          <div className="p-6">
                            {/* Header with Badge */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <CardTitle className="text-xl mb-1 text-brand-black">{card.name}</CardTitle>
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                  <Calendar size={14} />
                                  <span>{getExpirationText(card.expirationMonths)}</span>
                                </div>
                              </div>
                              {isBestValue && (
                                <Badge variant="best-value">BEST VALUE</Badge>
                              )}
                            </div>

                            {/* Classes Count */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-4 border-2 border-gray-200">
                              <div className="flex items-baseline justify-center gap-2">
                                <span className="text-brand-yellow text-4xl font-bold">
                                  {card.classes}
                                </span>
                                <span className="text-gray-700 text-lg font-medium">
                                  {card.classes === 1 ? 'class' : 'classes'}
                                </span>
                              </div>
                            </div>

                            {/* Pricing Info */}
                            <div className="space-y-3 mb-4">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-sm">Total Price</span>
                                <span className="text-brand-black text-2xl font-bold">
                                  ${(card.price ?? 0).toFixed(2)}
                                </span>
                              </div>
                              {card.classes > 1 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500 text-sm">Price per Class</span>
                                  <span className="text-brand-yellow text-lg font-bold">
                                    ${(card.pricePerClass ?? 0).toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Savings Badge */}
                            {card.classes > 1 && (card.pricePerClass ?? 0) < 25 && (
                              <div className="bg-brand-yellow/20 rounded-lg p-3 mb-4 border border-brand-yellow/30">
                                <p className="text-brand-black text-xs text-center font-medium">
                                  💰 Save ${((25 - (card.pricePerClass ?? 0)) * card.classes).toFixed(2)} vs single class pricing
                                </p>
                              </div>
                            )}

                            {/* Select Button */}
                            <Button
                              onClick={() => handleSelect(card)}
                              variant="primary"
                              className="mt-2"
                            >
                              {selectedCard === card.id ? (
                                <>
                                  <Check size={20} />
                                  Selected
                                </>
                              ) : (
                                'Select This Card'
                              )}
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Monthly Subscription Packages Section */}
              {cardOptions.filter(c => c.cardCategory === 'subscription').length > 0 && (
                <>
                  <h2 className="text-brand-white text-lg font-semibold mb-4 mt-8">📅 Monthly Packages</h2>
                  <div className="space-y-4">
                    {cardOptions.filter(c => c.cardCategory === 'subscription').map((card) => {
                      // Determine color scheme based on card name
                      const isHipHop = card.name.toLowerCase().includes('hip') || card.name.toLowerCase().includes('urban');
                      const isGymnastics = card.name.toLowerCase().includes('gymnastic'); // Check gymnastics BEFORE kids
                      const isLatinKids = card.name.toLowerCase().includes('latin') || (card.name.toLowerCase().includes('kids') && !isGymnastics);

                      // Color schemes: Hip Hop = pink, Gymnastics = blue, Latin/Kids = green
                      const colorScheme = isHipHop
                        ? { bg: 'from-pink-900/20 to-pink-600/10', border: 'border-pink-500', borderHover: 'border-pink-700/50 hover:border-pink-600', shadow: 'shadow-pink-500/20', badge: 'bg-pink-500', button: '!bg-pink-600 hover:!bg-pink-700', text: 'text-pink-400' }
                        : isGymnastics
                          ? { bg: 'from-blue-900/20 to-blue-600/10', border: 'border-blue-500', borderHover: 'border-blue-700/50 hover:border-blue-600', shadow: 'shadow-blue-500/20', badge: 'bg-blue-500', button: '!bg-blue-600 hover:!bg-blue-700', text: 'text-blue-400' }
                          : { bg: 'from-green-900/20 to-green-600/10', border: 'border-green-500', borderHover: 'border-green-700/50 hover:border-green-600', shadow: 'shadow-green-500/20', badge: 'bg-green-500', button: '!bg-green-600 hover:!bg-green-700', text: 'text-green-400' };

                      return (
                        <Card
                          key={card.id}
                          padding="none"
                          className={`border-2 transition-all duration-200 bg-gradient-to-br ${colorScheme.bg} ${selectedCard === card.id
                            ? `${colorScheme.border} shadow-lg ${colorScheme.shadow} scale-[1.02]`
                            : colorScheme.borderHover
                            }`}
                        >
                          <div className="p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <CardTitle className="text-xl mb-1 text-brand-black">
                                  {card.name}
                                </CardTitle>
                                {/* Subtitle for Latin Rhythms */}
                                {isLatinKids && (
                                  <p className="text-gray-500 text-xs mb-1">(Salsa - Bachata - Merengue)</p>
                                )}
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                  <Clock size={14} />
                                  <span>{getExpirationText(card.expirationMonths)}</span>
                                </div>
                              </div>
                              <span className={`${colorScheme.badge} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                                Monthly Package
                              </span>
                            </div>

                            {/* Classes Pass Display */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-4 border-2 border-gray-200">
                              <div className="flex items-baseline justify-center gap-2">
                                <span className="text-brand-yellow text-4xl font-bold">
                                  1 Month
                                </span>
                                <span className="text-gray-700 text-lg font-medium">
                                  • Class Pass
                                </span>
                              </div>
                            </div>

                            {/* Pricing Info */}
                            <div className="space-y-3 mb-4">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-sm">Price</span>
                                <span className="text-brand-black text-2xl font-bold">
                                  ${(card.price ?? 0).toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {/* Select Button */}
                            <Button
                              onClick={() => handleSelect(card)}
                              variant="primary"
                              className={`mt-2 ${colorScheme.button}`}
                            >
                              {selectedCard === card.id ? (
                                <>
                                  <Check size={20} />
                                  Selected
                                </>
                              ) : (
                                'Select Package'
                              )}
                            </Button>

                            {/* Disclaimer */}
                            <p className="text-gray-400 text-xs mt-4 text-center leading-relaxed">
                              All prices are subject to taxes and fees. Schedules may change; please visit{' '}
                              <a href="https://www.estilolatinodance.com" className="underline hover:text-gray-300" target="_blank" rel="noopener noreferrer">
                                www.estilolatinodance.com
                              </a>{' '}
                              or call 201-878-8977 to confirm class availability.
                            </p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* Info Box */}
          <Card padding="medium" className="mt-6 bg-gray-900 border-gray-700">
            <h4 className="text-brand-white mb-3">Important Information</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <Check size={16} className="text-brand-yellow mt-0.5 flex-shrink-0" />
                <span>Access to all Salsa and Bachata classes</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="text-brand-yellow mt-0.5 flex-shrink-0" />
                <span>Cards expire from purchase date, not first check-in</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="text-brand-yellow mt-0.5 flex-shrink-0" />
                <span>Flexible scheduling - use when it works for you</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="text-brand-yellow mt-0.5 flex-shrink-0" />
                <span>Show your QR code at check-in</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}