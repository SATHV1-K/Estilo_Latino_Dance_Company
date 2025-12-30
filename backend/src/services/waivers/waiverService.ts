import { supabaseAdmin } from '../../shared/supabase';
import { generateWaiverPDF, WaiverFormData } from './pdfGenerator';

export interface WaiverRecord {
    id: string;
    user_id: string | null;
    family_member_id: string | null;
    form_data: WaiverFormData;
    signature_url: string;
    pdf_storage_path: string;
    signed_at: string;
    email_sent: boolean;
}

/**
 * Upload waiver PDF to Supabase Storage
 */
async function uploadWaiverToStorage(
    pdfBuffer: Buffer,
    formData: WaiverFormData,
    date: Date
): Promise<{ path: string; url: string }> {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Use FirstName_LastName_waiver.pdf format
    const firstName = formData.firstName.replace(/[^a-zA-Z]/g, '');
    const lastName = formData.lastName.replace(/[^a-zA-Z]/g, '');
    const fileName = `${firstName}_${lastName}_waiver.pdf`;

    const storagePath = `waivers/${year}/${month}/${day}/${fileName}`;

    const { data, error } = await supabaseAdmin.storage
        .from('documents')
        .upload(storagePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
        });

    if (error) {
        console.error('Error uploading waiver to storage:', error);
        throw new Error('Failed to upload waiver PDF');
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
        .from('documents')
        .getPublicUrl(storagePath);

    return {
        path: storagePath,
        url: urlData.publicUrl
    };
}

/**
 * Create a new waiver record
 */
export async function createWaiver(
    userId: string,
    formData: WaiverFormData,
    familyMemberId?: string
): Promise<WaiverRecord> {
    const signedAt = new Date();

    // 1. Generate PDF
    console.log('📄 Generating waiver PDF for:', formData.email);
    const pdfBuffer = await generateWaiverPDF(formData);
    console.log('✅ PDF generated, size:', pdfBuffer.length, 'bytes');

    // 2. Upload to Supabase Storage
    console.log('📤 Uploading to Supabase Storage...');
    const storageResult = await uploadWaiverToStorage(pdfBuffer, formData, signedAt);
    console.log('✅ Uploaded to:', storageResult.path);

    // 3. Save waiver record to database
    const { data: waiver, error } = await supabaseAdmin
        .from('waivers')
        .insert({
            user_id: familyMemberId ? null : userId,
            family_member_id: familyMemberId || null,
            form_data: formData,
            signature_url: formData.signatureDataUrl,
            pdf_storage_path: storageResult.path,
            signed_at: signedAt.toISOString(),
            email_sent: false, // Will be updated after email is sent
            first_name: formData.firstName,
            last_name: formData.lastName
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating waiver record:', error);
        throw new Error('Failed to create waiver record');
    }

    console.log('✅ Waiver record created:', waiver.id);
    return waiver;
}

/**
 * Mark waiver as email sent
 */
export async function markWaiverEmailSent(waiverId: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('waivers')
        .update({ email_sent: true })
        .eq('id', waiverId);

    if (error) {
        console.error('Error updating waiver email status:', error);
    }
}

/**
 * Get waiver by user ID
 */
export async function getWaiverByUserId(userId: string): Promise<WaiverRecord | null> {
    const { data: waiver, error } = await supabaseAdmin
        .from('waivers')
        .select('*')
        .eq('user_id', userId)
        .order('signed_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !waiver) {
        return null;
    }

    return waiver;
}

/**
 * Get waiver by family member ID
 */
export async function getWaiverByFamilyMemberId(familyMemberId: string): Promise<WaiverRecord | null> {
    const { data: waiver, error } = await supabaseAdmin
        .from('waivers')
        .select('*')
        .eq('family_member_id', familyMemberId)
        .order('signed_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !waiver) {
        return null;
    }

    return waiver;
}

/**
 * Get waiver by ID
 */
export async function getWaiverById(waiverId: string): Promise<WaiverRecord | null> {
    const { data: waiver, error } = await supabaseAdmin
        .from('waivers')
        .select('*')
        .eq('id', waiverId)
        .single();

    if (error || !waiver) {
        return null;
    }

    return waiver;
}

/**
 * Check if user has completed waiver
 */
export async function hasCompletedWaiver(userId: string): Promise<boolean> {
    const waiver = await getWaiverByUserId(userId);
    return waiver !== null;
}

/**
 * Get all waivers with pagination (admin function)
 */
export async function getAllWaivers(
    page: number = 1,
    limit: number = 20
): Promise<{ waivers: WaiverRecord[]; total: number; totalPages: number }> {
    const offset = (page - 1) * limit;

    // Get count
    const { count } = await supabaseAdmin
        .from('waivers')
        .select('*', { count: 'exact', head: true });

    // Get waivers
    const { data: waivers, error } = await supabaseAdmin
        .from('waivers')
        .select('*')
        .order('signed_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        throw new Error('Failed to fetch waivers');
    }

    return {
        waivers: waivers || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
    };
}

/**
 * Get waivers by date range (admin function)
 */
export async function getWaiversByDateRange(
    startDate: string,
    endDate: string
): Promise<WaiverRecord[]> {
    const { data: waivers, error } = await supabaseAdmin
        .from('waivers')
        .select('*')
        .gte('signed_at', startDate)
        .lte('signed_at', endDate)
        .order('signed_at', { ascending: false });

    if (error) {
        throw new Error('Failed to fetch waivers by date range');
    }

    return waivers || [];
}

/**
 * Download waiver PDF from storage
 */
export async function downloadWaiverPDF(storagePath: string): Promise<Buffer> {
    const { data, error } = await supabaseAdmin.storage
        .from('documents')
        .download(storagePath);

    if (error || !data) {
        console.error('Error downloading waiver PDF:', error);
        throw new Error('Failed to download waiver PDF');
    }

    // Convert blob to buffer
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
}
