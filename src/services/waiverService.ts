/**
 * Waiver Service
 * 
 * Manages waiver data via backend API.
 * Handles the complete waiver flow for new customers.
 */

import { apiClient } from './apiClient';

export interface WaiverFormData {
  // User basic info (from signup)
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Additional waiver fields
  address: string;
  city: string;
  state: string;
  zipCode: string;
  birthday: string;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  occupation: string;
  source: string; // How did you hear about us?

  // Signature
  signatureDataUrl: string;
  signatureDate: string;
}

export interface WaiverRecord {
  id: string;
  userId: string;
  formData: WaiverFormData;
  pdfUrl: string;
  submittedAt: string;
  emailSent: boolean;
  storagePath: string;
}

export interface SignupWithWaiverResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
    createdAt?: string;
    qrCode?: string;
    checkInCode?: string;
    birthday?: string;
  };
  accessToken: string;
  waiver: {
    id: string;
    pdfPath: string;
    signedAt: string;
    emailSent: boolean;
  };
}

export const WAIVER_CONTENT = `AGREEMENT, WAIVER, AND RELEASE OF LIABILITY

In exchange for participation in the dance company organized by Estilo Latino Dance Company (ELDC), I agree for my son/daughter and/or myself to the following terms:

1. Assumption of Risk
I understand that participating in a dance or exercise class is a potentially hazardous activity. I recognize that there are inherent risks associated with this activity, including but not limited to: slips, falls, sprains, twists, muscle tears, fractures, broken bones, cardiac incidents, stroke, physical strain, or other medical conditions, including the risk of serious injury or death. I voluntarily assume all such risks, known and appreciated by me.

2. Release of Liability
I assume full responsibility for personal injury to myself and/or my child and further release and discharge Estilo Latino Dance Company, its owners, instructors, staff, partners, and volunteers from any and all liability, including negligence, for injuries, medical conditions, accidents, or damages arising out of my use of or presence upon the facilities. This includes any injury whether caused by the fault of myself, Estilo Latino, or other third parties.

3. Indemnification
I agree to indemnify and defend Estilo Latino against all claims, causes of action, damages, judgements, costs, or expenses, including attorney fees and other litigation costs, which may in any way arise from my use of or presence in the facilities of Estilo Latino Dance Company.

4. Medical Fitness & Physical Contact
I agree that I should not participate in such activity unless I am medically able. I agree to abide by any decision of the instructor relative to my ability to safely participate. I explicitly understand and consent that dance involves professional physical contact and close interaction.

5. Rules, Conduct, and Zero-Tolerance Policy
I agree to observe and obey all rules, warnings, and oral instructions given by ELDC and its employees. I acknowledge that ELDC enforces a Zero-Tolerance Aggression Policy: Any verbal, physical, or psychological aggression toward ELDC personnel results in immediate removal. ELDC reserves the right to deny participation or remove any participant from the premises at its sole discretion.

6. Facility Damages & Security
I agree to pay for all damages to the facilities of Estilo Latino Dance Company caused by my negligent, reckless, or willful actions. I further accept the use of security cameras on the premises and allow ELDC to use recordings for safety, verification, or legal matters.

7. Costumes, Tuition, and Fees
I understand that I am responsible for all tuition, fees, and costume costs. I understand that dance may require costumes, shoes, makeup, registrations, competition fees, travel, and other expenses, and I agree to provide them as needed. All services must be paid prior to participation.

8. Media Consent & Publicity Release
I grant ELDC full and unrestricted permission to capture, use, reproduce, publish, or distribute any photographs, videos, audio, or other media of the Participant taken during classes, rehearsals, events, or performances. I understand these materials may be used in publicity for the studio.

9. Legal Acknowledgment
I agree and acknowledge that I am under no pressure or duress to sign this agreement and have been given a reasonable opportunity to review it. Any legal or equitable claim that may arise from participation shall be resolved under New Jersey law. I acknowledge that if I provide an electronic signature, it is valid under the U.S. ESIGN Act and NJ UETA.

I have read this document and understand it. I further understand that by signing this release, I voluntarily surrender certain legal rights.`;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class WaiverService {
  /**
   * Complete signup with waiver - creates account + submits waiver + sends emails
   * This is the main function for new user registration
   */
  async signupWithWaiver(
    password: string,
    formData: WaiverFormData
  ): Promise<SignupWithWaiverResult> {
    const response = await apiClient.post<ApiResponse<SignupWithWaiverResult>>('/api/waivers/signup', {
      email: formData.email,
      password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      formData
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to complete signup with waiver');
    }

    // Store the access token
    apiClient.setAccessToken(response.data.accessToken);

    return response.data;
  }

  /**
   * Submit waiver for existing user
   */
  async submitWaiver(
    userId: string,
    formData: WaiverFormData
  ): Promise<WaiverRecord> {
    const response = await apiClient.post<ApiResponse<WaiverRecord>>('/api/waivers', {
      formData
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to submit waiver');
    }

    return response.data;
  }

  /**
   * Get current user's waiver
   */
  async getMyWaiver(): Promise<WaiverRecord | null> {
    try {
      const response = await apiClient.get<ApiResponse<WaiverRecord>>('/api/waivers/me');
      return response.data || null;
    } catch {
      return null;
    }
  }

  /**
   * Check if user has completed waiver
   */
  async hasCompletedWaiver(userId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<{ hasWaiver: boolean }>>(`/api/waivers/check/${userId}`);
      return response.data?.hasWaiver || false;
    } catch {
      return false;
    }
  }

  /**
   * Download waiver PDF
   */
  async downloadWaiverPDF(waiverId: string): Promise<Blob> {
    const response = await fetch(`${window.location.origin.replace(':3000', ':3001')}/api/waivers/download/${waiverId}`, {
      headers: {
        'Authorization': `Bearer ${apiClient.getAccessToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download waiver PDF');
    }

    return await response.blob();
  }

  /**
   * Validate waiver form data
   */
  validateWaiverData(formData: Partial<WaiverFormData>): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    if (!formData.address?.trim()) {
      errors.address = 'Address is required';
    }
    if (!formData.city?.trim()) {
      errors.city = 'City is required';
    }
    if (!formData.state?.trim()) {
      errors.state = 'State is required';
    }
    if (!formData.zipCode?.trim()) {
      errors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      errors.zipCode = 'Invalid ZIP code format';
    }
    if (!formData.birthday?.trim()) {
      errors.birthday = 'Birthday is required';
    }
    if (!formData.gender) {
      errors.gender = 'Gender is required';
    }
    if (!formData.occupation?.trim()) {
      errors.occupation = 'Occupation is required';
    }
    if (!formData.source?.trim()) {
      errors.source = 'Please tell us how you heard about us';
    }
    if (!formData.signatureDataUrl?.trim()) {
      errors.signature = 'Signature is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export const waiverService = new WaiverService();