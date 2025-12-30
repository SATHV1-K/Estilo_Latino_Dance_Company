import { supabaseAdmin } from '../../shared/supabase';
import { generateQRCodeId } from '../../shared/qr';
import { User, UserPublic, FamilyMember, PaginatedResponse } from '../../shared/types';

/**
 * Remove password_hash from user object
 */
function toPublicUser(user: User): UserPublic {
    const { password_hash, ...publicUser } = user;
    return publicUser;
}

/**
 * Get all customers (admin only)
 */
export async function getAllCustomers(
    page: number = 1,
    limit: number = 20
): Promise<PaginatedResponse<UserPublic>> {
    const offset = (page - 1) * limit;

    // Get total count
    const { count } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer');

    // Get paginated users
    const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        throw new Error('Failed to fetch customers');
    }

    return {
        data: (users || []).map(toPublicUser),
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
    };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserPublic | null> {
    const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !user) {
        return null;
    }

    return toPublicUser(user);
}

/**
 * Update user profile
 */
export async function updateUser(
    userId: string,
    data: Partial<{
        first_name: string;
        last_name: string;
        phone: string;
        birthday: string;
    }>
): Promise<UserPublic> {
    const { data: user, error } = await supabaseAdmin
        .from('users')
        .update(data)
        .eq('id', userId)
        .select()
        .single();

    if (error || !user) {
        throw new Error('Failed to update user');
    }

    return toPublicUser(user);
}

/**
 * Delete user and all related data (admin only)
 * This performs a cascade delete of all user data including:
 * - Payments
 * - Check-ins (where user was checked in)
 * - Check-ins (where user was the staff doing the check-in)
 * - Punch cards
 * - Waivers (including PDF files from storage)
 * - Birthday passes
 * - Family members (cascade deletes their data too)
 * - Notification preferences
 * - Password reset tokens
 */
export async function deleteUser(userId: string): Promise<boolean> {
    try {
        console.log(`[Delete User] Starting cascade delete for user: ${userId}`);

        // 1. Get family member IDs first (we'll need to delete their data too)
        const { data: familyMembers } = await supabaseAdmin
            .from('family_members')
            .select('id')
            .eq('primary_user_id', userId);

        const familyMemberIds = (familyMembers || []).map(fm => fm.id);
        console.log(`[Delete User] Found ${familyMemberIds.length} family members`);

        // 2. Get waiver storage paths for user and family members (to delete files)
        const { data: userWaivers } = await supabaseAdmin
            .from('waivers')
            .select('pdf_storage_path, signature_url')
            .eq('user_id', userId);

        let familyWaivers: any[] = [];
        if (familyMemberIds.length > 0) {
            const { data } = await supabaseAdmin
                .from('waivers')
                .select('pdf_storage_path, signature_url')
                .in('family_member_id', familyMemberIds);
            familyWaivers = data || [];
        }

        const allWaivers = [...(userWaivers || []), ...familyWaivers];
        console.log(`[Delete User] Found ${allWaivers.length} waiver files to delete`);

        // 3. Delete waiver files from storage
        for (const waiver of allWaivers) {
            if (waiver.pdf_storage_path) {
                const { error: deleteError } = await supabaseAdmin.storage
                    .from('waivers')
                    .remove([waiver.pdf_storage_path]);
                if (deleteError) {
                    console.warn(`[Delete User] Could not delete waiver file: ${waiver.pdf_storage_path}`, deleteError);
                }
            }
        }

        // 4. Delete payments (references punch_cards and users)
        const { error: paymentsError } = await supabaseAdmin
            .from('payments')
            .delete()
            .eq('user_id', userId);
        if (paymentsError) {
            console.error('[Delete User] Error deleting payments:', paymentsError);
        }

        // 5. Delete check-ins where user was checked in
        const { error: checkinsUserError } = await supabaseAdmin
            .from('check_ins')
            .delete()
            .eq('user_id', userId);
        if (checkinsUserError) {
            console.error('[Delete User] Error deleting user check-ins:', checkinsUserError);
        }

        // 6. Delete check-ins where user was the staff doing the check-in
        // (punched_by_user_id is NOT NULL, so we delete these records)
        const { error: checkinsStaffError } = await supabaseAdmin
            .from('check_ins')
            .delete()
            .eq('punched_by_user_id', userId);
        if (checkinsStaffError) {
            console.error('[Delete User] Error deleting staff check-ins:', checkinsStaffError);
        }

        // 7. Delete check-ins for family members
        if (familyMemberIds.length > 0) {
            const { error: fmCheckinsError } = await supabaseAdmin
                .from('check_ins')
                .delete()
                .in('family_member_id', familyMemberIds);
            if (fmCheckinsError) {
                console.error('[Delete User] Error deleting family member check-ins:', fmCheckinsError);
            }
        }

        // 8. Delete punch cards for user
        const { error: punchCardsError } = await supabaseAdmin
            .from('punch_cards')
            .delete()
            .eq('user_id', userId);
        if (punchCardsError) {
            console.error('[Delete User] Error deleting punch cards:', punchCardsError);
        }

        // 9. Delete punch cards for family members
        if (familyMemberIds.length > 0) {
            const { error: fmPunchCardsError } = await supabaseAdmin
                .from('punch_cards')
                .delete()
                .in('family_member_id', familyMemberIds);
            if (fmPunchCardsError) {
                console.error('[Delete User] Error deleting family member punch cards:', fmPunchCardsError);
            }
        }

        // 10. Delete waivers for user
        const { error: waiversError } = await supabaseAdmin
            .from('waivers')
            .delete()
            .eq('user_id', userId);
        if (waiversError) {
            console.error('[Delete User] Error deleting waivers:', waiversError);
        }

        // 11. Delete waivers for family members
        if (familyMemberIds.length > 0) {
            const { error: fmWaiversError } = await supabaseAdmin
                .from('waivers')
                .delete()
                .in('family_member_id', familyMemberIds);
            if (fmWaiversError) {
                console.error('[Delete User] Error deleting family member waivers:', fmWaiversError);
            }
        }

        // 12. Delete birthday passes for user
        const { error: birthdayError } = await supabaseAdmin
            .from('birthday_passes')
            .delete()
            .eq('user_id', userId);
        if (birthdayError) {
            console.error('[Delete User] Error deleting birthday passes:', birthdayError);
        }

        // 13. Delete birthday passes for family members
        if (familyMemberIds.length > 0) {
            const { error: fmBirthdayError } = await supabaseAdmin
                .from('birthday_passes')
                .delete()
                .in('family_member_id', familyMemberIds);
            if (fmBirthdayError) {
                console.error('[Delete User] Error deleting family member birthday passes:', fmBirthdayError);
            }
        }

        // 14. Family members, notification preferences, and password reset tokens 
        // have ON DELETE CASCADE, so they'll be deleted automatically with the user

        // 15. Finally, delete the user
        const { error: userError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', userId);

        if (userError) {
            console.error('[Delete User] Error deleting user:', userError);
            return false;
        }

        console.log(`[Delete User] Successfully deleted user ${userId} and all related data`);
        return true;
    } catch (error) {
        console.error('[Delete User] Unexpected error:', error);
        return false;
    }
}

/**
 * Search users by name, email, or phone
 */
export async function searchUsers(
    query: string,
    limit: number = 10
): Promise<UserPublic[]> {
    const searchQuery = query.toLowerCase().trim();

    const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('role', 'customer')
        .or(`email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
        .limit(limit);

    if (error) {
        throw new Error('Failed to search users');
    }

    return (users || []).map(toPublicUser);
}

/**
 * Find user by QR code
 */
export async function getUserByQRCode(qrCode: string): Promise<UserPublic | null> {
    const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('qr_code', qrCode)
        .single();

    if (error || !user) {
        return null;
    }

    return toPublicUser(user);
}

// ============================================
// FAMILY MEMBER FUNCTIONS
// ============================================

/**
 * Get all family members for a user
 */
export async function getFamilyMembers(userId: string): Promise<FamilyMember[]> {
    const { data: members, error } = await supabaseAdmin
        .from('family_members')
        .select('*')
        .eq('primary_user_id', userId)
        .order('created_at', { ascending: true });

    if (error) {
        throw new Error('Failed to fetch family members');
    }

    return members || [];
}

/**
 * Get a specific family member
 */
export async function getFamilyMemberById(memberId: string): Promise<FamilyMember | null> {
    const { data: member, error } = await supabaseAdmin
        .from('family_members')
        .select('*')
        .eq('id', memberId)
        .single();

    if (error || !member) {
        return null;
    }

    return member;
}

/**
 * Add a family member
 */
export async function addFamilyMember(
    primaryUserId: string,
    data: {
        first_name: string;
        last_name: string;
        birthday?: string;
    }
): Promise<FamilyMember> {
    // Generate temporary QR code
    const tempQrCode = generateQRCodeId('temp', 'family_member');

    const { data: member, error } = await supabaseAdmin
        .from('family_members')
        .insert({
            primary_user_id: primaryUserId,
            first_name: data.first_name,
            last_name: data.last_name,
            birthday: data.birthday || null,
            qr_code: tempQrCode,
            has_waiver: false,
        })
        .select()
        .single();

    if (error || !member) {
        console.error('Error creating family member:', error);
        throw new Error('Failed to add family member');
    }

    // Update with actual QR code
    const finalQrCode = generateQRCodeId(member.id, 'family_member');
    const { data: updatedMember, error: updateError } = await supabaseAdmin
        .from('family_members')
        .update({ qr_code: finalQrCode })
        .eq('id', member.id)
        .select()
        .single();

    if (updateError || !updatedMember) {
        throw new Error('Failed to update family member QR code');
    }

    return updatedMember;
}

/**
 * Update a family member
 */
export async function updateFamilyMember(
    memberId: string,
    data: Partial<{
        first_name: string;
        last_name: string;
        birthday: string;
    }>
): Promise<FamilyMember> {
    const { data: member, error } = await supabaseAdmin
        .from('family_members')
        .update(data)
        .eq('id', memberId)
        .select()
        .single();

    if (error || !member) {
        throw new Error('Failed to update family member');
    }

    return member;
}

/**
 * Delete a family member
 */
export async function deleteFamilyMember(memberId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('family_members')
        .delete()
        .eq('id', memberId);

    return !error;
}

/**
 * Find family member by QR code
 */
export async function getFamilyMemberByQRCode(qrCode: string): Promise<FamilyMember | null> {
    const { data: member, error } = await supabaseAdmin
        .from('family_members')
        .select('*')
        .eq('qr_code', qrCode)
        .single();

    if (error || !member) {
        return null;
    }

    return member;
}

/**
 * Check if a family member belongs to a user
 */
export async function isFamilyMemberOwner(
    memberId: string,
    userId: string
): Promise<boolean> {
    const { data: member } = await supabaseAdmin
        .from('family_members')
        .select('primary_user_id')
        .eq('id', memberId)
        .single();

    return member?.primary_user_id === userId;
}

/**
 * Search for users or family members by identifier
 * Supports: qr_code (ELDC_ prefix), check_in_code (4-char), email, phone, name parts, full name
 * Used by staff for check-in
 */
export async function searchByIdentifier(
    query: string
): Promise<{
    users: UserPublic[];
    familyMembers: (FamilyMember & { parent_email: string })[];
}> {
    const searchQuery = query.trim();
    const searchLower = searchQuery.toLowerCase();

    // Check if query looks like a QR code (starts with ELDC_)
    const isQRCode = searchQuery.startsWith('ELDC_');

    // Check if query looks like a check-in code (4 alphanumeric characters)
    const isCheckInCode = /^[A-Z0-9]{4}$/i.test(searchQuery);

    // Split query into parts for full name search (e.g., "John Smith" -> ["john", "smith"])
    const nameParts = searchLower.split(/\s+/).filter(p => p.length > 0);
    const hasMultipleParts = nameParts.length >= 2;

    let users: any[] = [];
    let familyMembers: any[] = [];

    // If it's a QR code, search by qr_code field first
    if (isQRCode) {
        // Search users by QR code
        const { data: userQrMatch } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('role', 'customer')
            .eq('qr_code', searchQuery)
            .limit(10);

        if (userQrMatch && userQrMatch.length > 0) {
            users = userQrMatch;
        }

        // Also search family members by QR code
        const { data: familyQrMatch } = await supabaseAdmin
            .from('family_members')
            .select(`
                *,
                users!family_members_primary_user_id_fkey (email)
            `)
            .eq('qr_code', searchQuery)
            .limit(10);

        if (familyQrMatch && familyQrMatch.length > 0) {
            familyMembers = familyQrMatch;
        }

        // If we found results, return them
        if (users.length > 0 || familyMembers.length > 0) {
            const formattedFamilyMembers = familyMembers.map((fm: any) => ({
                ...fm,
                parent_email: fm.users?.email || '',
                users: undefined,
            }));

            return {
                users: users.map(toPublicUser),
                familyMembers: formattedFamilyMembers,
            };
        }
    }

    // If it's a check-in code, search by exact match first
    if (isCheckInCode) {
        const { data: codeMatch } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('role', 'customer')
            .ilike('check_in_code', searchQuery.toUpperCase())
            .limit(10);

        if (codeMatch && codeMatch.length > 0) {
            users = codeMatch;
        }
    }

    // If no results from check-in code, do broader search
    if (users.length === 0) {
        // Build search query
        let searchConditions = `email.ilike.%${searchLower}%,phone.ilike.%${searchLower}%,first_name.ilike.%${searchLower}%,last_name.ilike.%${searchLower}%`;

        // Add check_in_code to search if it looks like one
        if (isCheckInCode) {
            searchConditions += `,check_in_code.ilike.${searchQuery.toUpperCase()}`;
        }

        const { data: userResults } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('role', 'customer')
            .or(searchConditions)
            .limit(10);

        users = userResults || [];

        // If searching with full name (e.g., "John Smith"), filter for exact matches
        if (hasMultipleParts && users.length === 0) {
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];

            const { data: fullNameMatch } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('role', 'customer')
                .ilike('first_name', `%${firstName}%`)
                .ilike('last_name', `%${lastName}%`)
                .limit(10);

            users = fullNameMatch || [];
        }
    }

    // Search family members (same logic - skip if already found by QR code)

    if (isCheckInCode) {
        const { data: familyCodeMatch } = await supabaseAdmin
            .from('family_members')
            .select(`
                *,
                users!family_members_primary_user_id_fkey (email)
            `)
            .ilike('check_in_code', searchQuery.toUpperCase())
            .limit(10);

        if (familyCodeMatch && familyCodeMatch.length > 0) {
            familyMembers = familyCodeMatch;
        }
    }

    if (familyMembers.length === 0) {
        let familySearchConditions = `first_name.ilike.%${searchLower}%,last_name.ilike.%${searchLower}%`;

        if (isCheckInCode) {
            familySearchConditions += `,check_in_code.ilike.${searchQuery.toUpperCase()}`;
        }

        const { data: familyResults } = await supabaseAdmin
            .from('family_members')
            .select(`
                *,
                users!family_members_primary_user_id_fkey (email)
            `)
            .or(familySearchConditions)
            .limit(10);

        familyMembers = familyResults || [];

        // Full name search for family members
        if (hasMultipleParts && familyMembers.length === 0) {
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];

            const { data: familyFullNameMatch } = await supabaseAdmin
                .from('family_members')
                .select(`
                    *,
                    users!family_members_primary_user_id_fkey (email)
                `)
                .ilike('first_name', `%${firstName}%`)
                .ilike('last_name', `%${lastName}%`)
                .limit(10);

            familyMembers = familyFullNameMatch || [];
        }
    }

    const formattedFamilyMembers = familyMembers.map((fm: any) => ({
        ...fm,
        parent_email: fm.users?.email || '',
        users: undefined,
    }));

    return {
        users: users.map(toPublicUser),
        familyMembers: formattedFamilyMembers,
    };
}
