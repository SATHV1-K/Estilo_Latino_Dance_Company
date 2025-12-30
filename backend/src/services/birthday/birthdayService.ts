import { supabaseAdmin } from '../../shared/supabase';

interface BirthdayPass {
    id: string;
    user_id: string | null;
    family_member_id: string | null;
    valid_date: string;
    expires_at: string;
    used: boolean;
    used_at: string | null;
    check_in_id: string | null;
    created_at: string;
}

interface BirthdayPerson {
    id: string;
    first_name: string;
    last_name: string;
    birthday: string;
    type: 'user' | 'family_member';
    email?: string;
    check_in_code?: string;
}

/**
 * Check if a user has a valid birthday pass for today
 */
export async function checkBirthdayPass(
    userId?: string,
    familyMemberId?: string
): Promise<BirthdayPass | null> {
    const today = new Date().toISOString().split('T')[0];

    let query = supabaseAdmin
        .from('birthday_passes')
        .select('*')
        .eq('valid_date', today)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString());

    if (userId) {
        query = query.eq('user_id', userId);
    } else if (familyMemberId) {
        query = query.eq('family_member_id', familyMemberId);
    } else {
        return null;
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
        console.error('Error checking birthday pass:', error);
        return null;
    }

    return data;
}

/**
 * Check if today is someone's birthday
 */
export async function isBirthday(
    userId?: string,
    familyMemberId?: string
): Promise<boolean> {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const day = today.getDate(); // 1-31

    let data = null;

    if (userId) {
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('birthday')
            .eq('id', userId)
            .single();
        data = user;
    } else if (familyMemberId) {
        const { data: member } = await supabaseAdmin
            .from('family_members')
            .select('birthday')
            .eq('id', familyMemberId)
            .single();
        data = member;
    }

    if (!data?.birthday) return false;

    // Parse date string directly (format: YYYY-MM-DD) to avoid timezone issues
    const parts = data.birthday.split('-');
    if (parts.length !== 3) return false;
    const bdayMonth = parseInt(parts[1], 10);
    const bdayDay = parseInt(parts[2], 10);

    return bdayMonth === month && bdayDay === day;
}

/**
 * Create a birthday pass for a user (valid only on their birthday)
 */
export async function createBirthdayPass(
    userId?: string,
    familyMemberId?: string
): Promise<BirthdayPass | null> {
    if (!userId && !familyMemberId) {
        throw new Error('Either userId or familyMemberId is required');
    }

    const today = new Date();
    const validDate = today.toISOString().split('T')[0];

    // Pass expires at end of day
    const expiresAt = new Date(today);
    expiresAt.setHours(23, 59, 59, 999);

    const { data, error } = await supabaseAdmin
        .from('birthday_passes')
        .insert({
            user_id: userId || null,
            family_member_id: familyMemberId || null,
            valid_date: validDate,
            expires_at: expiresAt.toISOString(),
            used: false,
        })
        .select()
        .single();

    if (error) {
        // If duplicate, return existing pass
        if (error.code === '23505') {
            return checkBirthdayPass(userId, familyMemberId);
        }
        console.error('Error creating birthday pass:', error);
        throw new Error('Failed to create birthday pass');
    }

    return data;
}

/**
 * Use a birthday pass during check-in
 */
export async function useBirthdayPass(
    passId: string,
    checkInId: string
): Promise<BirthdayPass> {
    const { data, error } = await supabaseAdmin
        .from('birthday_passes')
        .update({
            used: true,
            used_at: new Date().toISOString(),
            check_in_id: checkInId,
        })
        .eq('id', passId)
        .select()
        .single();

    if (error) {
        throw new Error('Failed to use birthday pass');
    }

    return data;
}

/**
 * Get all users/family members with birthdays today
 */
export async function getTodaysBirthdays(): Promise<BirthdayPerson[]> {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const day = today.getDate(); // 1-31

    console.log(`[Birthday Check] Today is month=${month}, day=${day}`);

    // Get users with birthdays today
    const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, birthday, email, check_in_code')
        .eq('role', 'customer');

    const birthdayUsers = (users || [])
        .filter(u => {
            if (!u.birthday) return false;
            // Parse date string directly (format: YYYY-MM-DD) to avoid timezone issues
            const parts = u.birthday.split('-');
            if (parts.length !== 3) return false;
            const bdayMonth = parseInt(parts[1], 10);
            const bdayDay = parseInt(parts[2], 10);
            const isMatch = bdayMonth === month && bdayDay === day;
            if (isMatch) {
                console.log(`[Birthday Check] User ${u.first_name} ${u.last_name} has birthday today (${u.birthday})`);
            }
            return isMatch;
        })
        .map(u => ({
            id: u.id,
            first_name: u.first_name,
            last_name: u.last_name,
            birthday: u.birthday,
            type: 'user' as const,
            email: u.email,
            check_in_code: u.check_in_code,
        }));

    // Get family members with birthdays today
    const { data: familyMembers } = await supabaseAdmin
        .from('family_members')
        .select('id, first_name, last_name, birthday');

    const birthdayFamilyMembers = (familyMembers || [])
        .filter(fm => {
            if (!fm.birthday) return false;
            // Parse date string directly (format: YYYY-MM-DD) to avoid timezone issues
            const parts = fm.birthday.split('-');
            if (parts.length !== 3) return false;
            const bdayMonth = parseInt(parts[1], 10);
            const bdayDay = parseInt(parts[2], 10);
            const isMatch = bdayMonth === month && bdayDay === day;
            if (isMatch) {
                console.log(`[Birthday Check] Family member ${fm.first_name} ${fm.last_name} has birthday today (${fm.birthday})`);
            }
            return isMatch;
        })
        .map(fm => ({
            id: fm.id,
            first_name: fm.first_name,
            last_name: fm.last_name,
            birthday: fm.birthday,
            type: 'family_member' as const,
        }));

    console.log(`[Birthday Check] Found ${birthdayUsers.length} users and ${birthdayFamilyMembers.length} family members with birthdays today`);
    return [...birthdayUsers, ...birthdayFamilyMembers];
}

/**
 * Get birthday pass usage history (for admin)
 */
export async function getBirthdayPassHistory(
    page: number = 1,
    limit: number = 20
): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
}> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabaseAdmin
        .from('birthday_passes')
        .select(`
            *,
            users!birthday_passes_user_id_fkey (first_name, last_name, email),
            family_members!birthday_passes_family_member_id_fkey (first_name, last_name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        throw new Error('Failed to fetch birthday pass history');
    }

    return {
        data: (data || []).map(pass => ({
            ...pass,
            person_name: pass.users
                ? `${pass.users.first_name} ${pass.users.last_name}`
                : pass.family_members
                    ? `${pass.family_members.first_name} ${pass.family_members.last_name}`
                    : 'Unknown',
            person_email: pass.users?.email || 'N/A',
        })),
        total: count || 0,
        page,
        limit,
    };
}
