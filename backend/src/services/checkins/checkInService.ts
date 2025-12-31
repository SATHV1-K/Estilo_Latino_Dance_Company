import { supabaseAdmin } from '../../shared/supabase';
import { parseQRCode } from '../../shared/qr';
import { CheckIn, CheckInWithDetails, BirthdayPass, PaginatedResponse } from '../../shared/types';
import * as cardService from '../cards/cardService';
import * as userService from '../users/userService';
import { checkAndSendLowBalanceAlert, checkAndSendExhaustedAlert, sendBirthdayNotification } from '../notifications/notificationService';

/**
 * Check in a user or family member
 */
export async function checkIn(data: {
    user_id?: string;
    family_member_id?: string;
    qr_code?: string;
    use_birthday_pass?: boolean;
    is_birthday_checkin?: boolean;  // NEW: Direct birthday check-in (no pass needed)
    punched_by_user_id: string;
    notes?: string;
}): Promise<CheckInWithDetails> {
    let userId = data.user_id;
    let familyMemberId = data.family_member_id;
    let personName = '';

    // If QR code provided, parse it to get entity
    if (data.qr_code) {
        const parsed = parseQRCode(data.qr_code);
        if (!parsed.isValid) {
            throw new Error('Invalid QR code');
        }

        if (parsed.type === 'user') {
            userId = parsed.entityId!;
        } else if (parsed.type === 'family_member') {
            familyMemberId = parsed.entityId!;
        }
    }

    if (!userId && !familyMemberId) {
        throw new Error('User ID or family member ID is required');
    }

    // Get person name
    if (userId) {
        const user = await userService.getUserById(userId);
        if (!user) throw new Error('User not found');
        personName = `${user.first_name} ${user.last_name}`;
    } else if (familyMemberId) {
        const member = await userService.getFamilyMemberById(familyMemberId);
        if (!member) throw new Error('Family member not found');
        personName = `${member.first_name} ${member.last_name}`;
    }

    // NOTE: Multiple check-ins per day are now allowed per business request
    // The hasCheckedInToday check was removed to allow staff to check in
    // the same person multiple times if they attend multiple classes

    // DIRECT BIRTHDAY CHECK-IN (simplified - no pass needed)
    if (data.is_birthday_checkin) {
        // Create check-in record without deducting from any card
        const { data: checkIn, error } = await supabaseAdmin
            .from('check_ins')
            .insert({
                user_id: userId || null,
                family_member_id: familyMemberId || null,
                punch_card_id: null,
                is_birthday_checkin: true,
                birthday_pass_id: null,
                punched_by_user_id: data.punched_by_user_id,
                notes: data.notes || '🎂 Birthday check-in - Free class!',
            })
            .select()
            .single();

        if (error || !checkIn) {
            console.error('Error creating birthday check-in:', error);
            throw new Error('Failed to create birthday check-in');
        }

        // Get punched by name
        const punchedByUser = await userService.getUserById(data.punched_by_user_id);
        const punchedByName = punchedByUser
            ? `${punchedByUser.first_name} ${punchedByUser.last_name}`
            : 'Unknown';

        // Note: Birthday emails are sent automatically by the 9 AM scheduler
        // NOT on check-in, to ensure customers get their birthday greeting in the morning

        return {
            ...checkIn,
            person_name: personName,
            card_name: '🎂 Birthday Free Class',
            punched_by_name: punchedByName,
        };
    }

    // Check for birthday pass (legacy - still supported if passes were created)
    if (data.use_birthday_pass) {
        const birthdayPass = await getValidBirthdayPass(userId, familyMemberId);
        if (birthdayPass) {
            return await checkInWithBirthdayPass(
                birthdayPass,
                userId,
                familyMemberId,
                personName,
                data.punched_by_user_id,
                data.notes
            );
        }
        throw new Error('No valid birthday pass found');
    }

    // Get active card
    const activeCard = await cardService.getActiveCard(userId, familyMemberId);
    if (!activeCard) {
        throw new Error('No active punch card found. Customer needs to purchase a card.');
    }

    // Check if this is a subscription card (unlimited check-ins, no class deduction)
    const isSubscription = activeCard.card_type?.card_category === 'subscription';
    let classesRemaining = activeCard.classes_remaining;

    if (!isSubscription) {
        // Punch card: Deduct a class
        await cardService.deductClass(activeCard.id);
        classesRemaining = activeCard.classes_remaining - 1;
    }
    // Subscription: No class deduction, just record the check-in for attendance

    // Create check-in record
    const { data: checkIn, error } = await supabaseAdmin
        .from('check_ins')
        .insert({
            user_id: userId || null,
            family_member_id: familyMemberId || null,
            punch_card_id: activeCard.id,
            is_birthday_checkin: false,
            punched_by_user_id: data.punched_by_user_id,
            notes: data.notes || null,
        })
        .select()
        .single();

    if (error || !checkIn) {
        console.error('Error creating check-in:', error);
        throw new Error('Failed to create check-in');
    }

    // Get punched by name
    const punchedByUser = await userService.getUserById(data.punched_by_user_id);
    const punchedByName = punchedByUser
        ? `${punchedByUser.first_name} ${punchedByUser.last_name}`
        : 'Unknown';

    // Only send low balance/exhausted alerts for punch cards (not subscriptions)
    if (!isSubscription) {
        // Send low balance alert if applicable (async, don't wait)
        checkAndSendLowBalanceAlert(
            userId,
            familyMemberId,
            classesRemaining,
            activeCard.card_type?.name || 'Punch Card'
        ).catch(err => console.error('Low balance alert error:', err));

        // Send exhausted alert if card is now empty (async, don't wait)
        if (classesRemaining === 0) {
            checkAndSendExhaustedAlert(
                userId,
                familyMemberId,
                activeCard.card_type?.name || 'Punch Card'
            ).catch(err => console.error('Exhausted alert error:', err));
        }
    }

    return {
        ...checkIn,
        person_name: personName,
        card_name: activeCard.card_type?.name || 'Unknown',
        punched_by_name: punchedByName,
        classes_remaining: isSubscription ? -1 : classesRemaining, // -1 indicates unlimited for subscriptions
    };
}

/**
 * Check in using a birthday pass (no card deduction)
 */
async function checkInWithBirthdayPass(
    birthdayPass: BirthdayPass,
    userId: string | undefined,
    familyMemberId: string | undefined,
    personName: string,
    punchedByUserId: string,
    notes?: string
): Promise<CheckInWithDetails> {
    // Create check-in record
    const { data: checkIn, error } = await supabaseAdmin
        .from('check_ins')
        .insert({
            user_id: userId || null,
            family_member_id: familyMemberId || null,
            punch_card_id: null,
            is_birthday_checkin: true,
            birthday_pass_id: birthdayPass.id,
            punched_by_user_id: punchedByUserId,
            notes: notes || '🎂 Birthday check-in!',
        })
        .select()
        .single();

    if (error || !checkIn) {
        throw new Error('Failed to create birthday check-in');
    }

    // Mark birthday pass as used
    await supabaseAdmin
        .from('birthday_passes')
        .update({
            used: true,
            used_at: new Date().toISOString(),
            check_in_id: checkIn.id,
        })
        .eq('id', birthdayPass.id);

    // Get punched by name
    const punchedByUser = await userService.getUserById(punchedByUserId);
    const punchedByName = punchedByUser
        ? `${punchedByUser.first_name} ${punchedByUser.last_name}`
        : 'Unknown';

    return {
        ...checkIn,
        person_name: personName,
        card_name: '🎂 Birthday Free Class',
        punched_by_name: punchedByName,
    };
}

/**
 * Get valid birthday pass for today
 */
export async function getValidBirthdayPass(
    userId?: string,
    familyMemberId?: string
): Promise<BirthdayPass | null> {
    if (!userId && !familyMemberId) return null;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    let query = supabaseAdmin
        .from('birthday_passes')
        .select('*')
        .eq('valid_date', today)
        .eq('used', false)
        .gt('expires_at', now);

    if (userId) {
        query = query.eq('user_id', userId);
    } else if (familyMemberId) {
        query = query.eq('family_member_id', familyMemberId);
    }

    const { data: passes, error } = await query.limit(1);

    if (error || !passes || passes.length === 0) {
        return null;
    }

    return passes[0];
}

/**
 * Get today's check-ins (staff/admin)
 */
export async function getTodayCheckIns(): Promise<CheckInWithDetails[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: checkIns, error } = await supabaseAdmin
        .from('check_ins')
        .select(`
      *,
      users!check_ins_user_id_fkey (first_name, last_name),
      family_members!check_ins_family_member_id_fkey (first_name, last_name),
      punch_cards!check_ins_punch_card_id_fkey (
        classes_remaining,
        card_types (name)
      ),
      punched_by:users!check_ins_punched_by_user_id_fkey (first_name, last_name)
    `)
        .gte('checked_in_at', today.toISOString())
        .order('checked_in_at', { ascending: false });

    if (error) {
        throw new Error('Failed to fetch today\'s check-ins');
    }

    return (checkIns || []).map(formatCheckInWithDetails);
}

/**
 * Get check-in history with pagination (admin)
 */
export async function getCheckInHistory(
    page: number = 1,
    limit: number = 20,
    startDate?: string,
    endDate?: string
): Promise<PaginatedResponse<CheckInWithDetails>> {
    const offset = (page - 1) * limit;

    // Build count query
    let countQuery = supabaseAdmin
        .from('check_ins')
        .select('*', { count: 'exact', head: true });

    if (startDate) {
        countQuery = countQuery.gte('checked_in_at', startDate);
    }
    if (endDate) {
        countQuery = countQuery.lte('checked_in_at', endDate);
    }

    const { count } = await countQuery;

    // Build data query
    let dataQuery = supabaseAdmin
        .from('check_ins')
        .select(`
      *,
      users!check_ins_user_id_fkey (first_name, last_name),
      family_members!check_ins_family_member_id_fkey (first_name, last_name),
      punch_cards!check_ins_punch_card_id_fkey (
        classes_remaining,
        card_types (name)
      ),
      punched_by:users!check_ins_punched_by_user_id_fkey (first_name, last_name)
    `)
        .order('checked_in_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (startDate) {
        dataQuery = dataQuery.gte('checked_in_at', startDate);
    }
    if (endDate) {
        dataQuery = dataQuery.lte('checked_in_at', endDate);
    }

    const { data: checkIns, error } = await dataQuery;

    if (error) {
        throw new Error('Failed to fetch check-in history');
    }

    return {
        data: (checkIns || []).map(formatCheckInWithDetails),
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
    };
}

/**
 * Get check-in history for a specific user
 */
export async function getUserCheckInHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
): Promise<PaginatedResponse<CheckInWithDetails>> {
    const offset = (page - 1) * limit;

    const { count } = await supabaseAdmin
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    const { data: checkIns, error } = await supabaseAdmin
        .from('check_ins')
        .select(`
      *,
      punch_cards!check_ins_punch_card_id_fkey (
        classes_remaining,
        card_types (name)
      ),
      punched_by:users!check_ins_punched_by_user_id_fkey (first_name, last_name)
    `)
        .eq('user_id', userId)
        .order('checked_in_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        throw new Error('Failed to fetch user check-in history');
    }

    const user = await userService.getUserById(userId);
    const personName = user ? `${user.first_name} ${user.last_name}` : 'Unknown';

    return {
        data: (checkIns || []).map((ci: any) => formatCheckInWithDetails({
            ...ci,
            users: { first_name: user?.first_name, last_name: user?.last_name },
        })),
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
    };
}

/**
 * Get today's check-in count
 */
export async function getTodayCheckInCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabaseAdmin
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .gte('checked_in_at', today.toISOString());

    return count || 0;
}

/**
 * Check if a user/family member has already checked in today
 */
export async function hasCheckedInToday(
    userId?: string,
    familyMemberId?: string
): Promise<boolean> {
    if (!userId && !familyMemberId) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = supabaseAdmin
        .from('check_ins')
        .select('id', { count: 'exact', head: true })
        .gte('checked_in_at', today.toISOString());

    if (userId) {
        query = query.eq('user_id', userId);
    } else if (familyMemberId) {
        query = query.eq('family_member_id', familyMemberId);
    }

    const { count } = await query;
    return (count || 0) > 0;
}

/**
 * Check if today is the person's birthday
 */
export async function isBirthdayToday(
    userId?: string,
    familyMemberId?: string
): Promise<boolean> {
    if (!userId && !familyMemberId) return false;

    const today = new Date();
    const todayMonth = today.getMonth() + 1; // 0-indexed
    const todayDay = today.getDate();

    let birthday: string | null = null;

    if (userId) {
        const user = await userService.getUserById(userId);
        birthday = user?.birthday || null;
    } else if (familyMemberId) {
        const member = await userService.getFamilyMemberById(familyMemberId);
        birthday = member?.birthday || null;
    }

    if (!birthday) return false;

    // Birthday format is 'YYYY-MM-DD' - parse directly to avoid timezone issues
    const parts = birthday.split('-');
    if (parts.length !== 3) return false;

    const birthdayMonth = parseInt(parts[1], 10); // MM
    const birthdayDay = parseInt(parts[2], 10);   // DD

    console.log(`🎂 Birthday check: User birthday=${birthday} (M:${birthdayMonth} D:${birthdayDay}), Today=(M:${todayMonth} D:${todayDay})`);

    return birthdayMonth === todayMonth && birthdayDay === todayDay;
}

/**
 * Helper to format check-in with details
 */
function formatCheckInWithDetails(checkIn: any): CheckInWithDetails {
    const personName = checkIn.users
        ? `${checkIn.users.first_name} ${checkIn.users.last_name}`
        : checkIn.family_members
            ? `${checkIn.family_members.first_name} ${checkIn.family_members.last_name}`
            : 'Unknown';

    const cardName = checkIn.is_birthday_checkin
        ? '🎂 Birthday Free Class'
        : checkIn.punch_cards?.card_types?.name || 'Unknown';

    const punchedByName = checkIn.punched_by
        ? `${checkIn.punched_by.first_name} ${checkIn.punched_by.last_name}`
        : 'Unknown';

    return {
        id: checkIn.id,
        user_id: checkIn.user_id,
        family_member_id: checkIn.family_member_id,
        punch_card_id: checkIn.punch_card_id,
        is_birthday_checkin: checkIn.is_birthday_checkin,
        birthday_pass_id: checkIn.birthday_pass_id,
        checked_in_at: checkIn.checked_in_at,
        punched_by_user_id: checkIn.punched_by_user_id,
        notes: checkIn.notes,
        person_name: personName,
        card_name: cardName,
        punched_by_name: punchedByName,
        classes_remaining: checkIn.punch_cards?.classes_remaining,
    };
}

