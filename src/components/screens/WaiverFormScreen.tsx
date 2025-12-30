import React, { useState, useRef } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Card } from '../Card';
import { SignaturePad } from '../SignaturePad';
import { ArrowLeft } from 'lucide-react';
import type { WaiverFormData } from '../../services/waiverService';

interface WaiverFormScreenProps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  onSubmit: (formData: Omit<WaiverFormData, 'firstName' | 'lastName' | 'email' | 'phone'>) => void;
  onBack: () => void;
}

export function WaiverFormScreen({
  firstName,
  lastName,
  email,
  phone,
  onSubmit,
  onBack
}: WaiverFormScreenProps) {
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    birthday: '',
    gender: '' as 'male' | 'female' | 'other' | 'prefer-not-to-say' | '',
    occupation: '',
    source: '',
    signatureDataUrl: '',
    signatureDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const [zipLookupLoading, setZipLookupLoading] = useState(false);

  // Handle ZIP code change with auto-lookup for city/state
  const handleZipChange = async (value: string) => {
    // Only allow digits and limit to 5 characters for basic ZIP
    const cleanZip = value.replace(/\D/g, '').slice(0, 5);
    handleChange('zipCode', cleanZip);

    // When we have a complete 5-digit ZIP, look up city/state
    if (cleanZip.length === 5) {
      setZipLookupLoading(true);
      try {
        const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
        if (response.ok) {
          const data = await response.json();
          if (data.places && data.places.length > 0) {
            const place = data.places[0];
            setFormData(prev => ({
              ...prev,
              city: place['place name'],
              state: place['state abbreviation']
            }));
            // Clear any errors on those fields
            setErrors(prev => ({ ...prev, city: '', state: '' }));
          }
        }
      } catch (error) {
        console.log('ZIP lookup failed, user can enter manually');
      } finally {
        setZipLookupLoading(false);
      }
    }
  };

  const handleSignatureChange = (dataUrl: string) => {
    setFormData(prev => ({ ...prev, signatureDataUrl: dataUrl }));
    if (errors.signature) {
      setErrors(prev => ({ ...prev, signature: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Invalid ZIP code format (e.g., 12345 or 12345-6789)';
    }
    if (!formData.birthday.trim()) newErrors.birthday = 'Birthday is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.occupation.trim()) newErrors.occupation = 'Occupation is required';
    if (!formData.source.trim()) newErrors.source = 'This field is required';
    if (!formData.signatureDataUrl.trim()) newErrors.signature = 'Signature is required';

    setErrors(newErrors);

    // If there are errors, scroll to the first error field
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      const fieldMap: Record<string, string> = {
        address: 'address-field',
        city: 'city-field',
        state: 'state-field',
        zipCode: 'zip-field',
        birthday: 'birthday-field',
        gender: 'gender-field',
        occupation: 'occupation-field',
        source: 'source-field',
        signature: 'signature-field'
      };
      const elementId = fieldMap[firstErrorField];
      if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      // Also scroll the error summary into view
      if (errorSummaryRef.current) {
        errorSummaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData as Omit<WaiverFormData, 'firstName' | 'lastName' | 'email' | 'phone'>);
    }
  };

  // Ref for error summary scroll
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const SOURCE_OPTIONS = [
    'Google Search',
    'Social Media (Facebook/Instagram)',
    'Friend/Family Referral',
    'Flyer/Poster',
    'Event/Performance',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-brand-black pb-20">
      {/* Header */}
      <div className="bg-brand-black border-b border-gray-700 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-brand-yellow hover:text-yellow-400 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-brand-white text-xl">Additional Information</h1>
        </div>
      </div>

      {/* Form */}
      <div className="px-6 py-8">
        <div className="w-full max-w-2xl mx-auto">
          <p className="text-gray-400 text-sm mb-6">
            Please complete the following information before reviewing the waiver agreement.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Validation Error Summary */}
            {Object.keys(errors).length > 0 && (
              <div
                ref={errorSummaryRef}
                className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-4"
              >
                <p className="text-red-400 font-semibold mb-2">Please fix the following errors:</p>
                <ul className="list-disc list-inside text-red-300 text-sm space-y-1">
                  {Object.entries(errors).map(([field, message]) => (
                    <li key={field}>{message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Address */}
            <div className="space-y-2">
              <Input
                label="Street Address"
                type="text"
                placeholder="123 Main Street"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                error={errors.address}
                autoComplete="street-address"
              />
            </div>

            {/* City, State, ZIP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Input
                  label="City"
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  error={errors.city}
                  autoComplete="address-level2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-brand-yellow text-sm">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className={`w-full h-11 px-4 bg-white border ${errors.state ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow transition-all duration-200`}
                  autoComplete="address-level1"
                >
                  <option value="">Select State</option>
                  {US_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                )}
              </div>

              <div className="space-y-2">
                <Input
                  label={zipLookupLoading ? "ZIP Code (looking up...)" : "ZIP Code"}
                  type="text"
                  placeholder="12345"
                  value={formData.zipCode}
                  onChange={(e) => handleZipChange(e.target.value)}
                  error={errors.zipCode}
                  autoComplete="postal-code"
                />
                {formData.zipCode.length === 5 && !zipLookupLoading && formData.city && (
                  <p className="text-green-500 text-xs">✓ Found: {formData.city}, {formData.state}</p>
                )}
              </div>
            </div>

            {/* Birthday */}
            <div className="space-y-2">
              <Input
                label="Birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) => handleChange('birthday', e.target.value)}
                error={errors.birthday}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-brand-yellow text-sm">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className={`w-full h-11 px-4 bg-white border ${errors.gender ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow transition-all duration-200`}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
              )}
            </div>

            {/* Occupation */}
            <div className="space-y-2">
              <Input
                label="Occupation"
                type="text"
                placeholder="Your occupation"
                value={formData.occupation}
                onChange={(e) => handleChange('occupation', e.target.value)}
                error={errors.occupation}
              />
            </div>

            {/* Source */}
            <div className="space-y-2">
              <label className="text-brand-yellow text-sm">
                How did you hear about us? <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.source}
                onChange={(e) => handleChange('source', e.target.value)}
                className={`w-full h-11 px-4 bg-white border ${errors.source ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow transition-all duration-200`}
              >
                <option value="">Select an option</option>
                {SOURCE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.source && (
                <p className="text-red-500 text-xs mt-1">{errors.source}</p>
              )}
            </div>

            {/* Signature */}
            <div className="space-y-2">
              <SignaturePad
                onSignatureChange={handleSignatureChange}
                error={errors.signature}
              />
              <p className="text-gray-400 text-xs mt-2">
                By signing above, you acknowledge that you have read and agree to the waiver terms.
                Date: {formData.signatureDate}
              </p>
            </div>

            <Button type="submit" size="large" className="mt-6">
              Continue to Waiver Review
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}