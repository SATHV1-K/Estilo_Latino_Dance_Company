import { supabaseAdmin } from '../../shared/supabase';
import { CardType, PunchCard, PunchCardWithDetails, PaginatedResponse } from '../../shared/types';
import * as userService from '../users/userService';
import { sendPurchaseConfirmationEmail } from '../notifications/notificationService';

/**
 * Get all available card types
 */
export async function getCardTypes(): Promise<CardType[]> {
    const { data: cardTypes, error } = await supabaseAdmin
        .from('card_types')
        .select('*')
        .eq('is_active', true)
        .order('classes', { ascending: true });

    if (error) {
        throw new Error('Failed to fetch card types');
    }

    return cardTypes || [];
}

/**
 * Get a specific card type by ID
 */
export async function getCardTypeById(cardTypeId: string): Promise<CardType | null> {
    const { data: cardType, error } = await supabaseAdmin
        .from('card_types')
        .select('*')
        .eq('id', cardTypeId)
        .single();

    if (error || !cardType) {
        return null;
    }

    return cardType;
}

/**
 * Get all cards for a user
 */
export async function getUserCards(userId: string): Promise<PunchCardWithDetails[]> {
    const { data: cards, error } = await supabaseAdmin
        .from('punch_cards')
        .select(`
      *,
      card_types (*)
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error('Failed to fetch user cards');
    }

    return (cards || []).map((card: any) => ({
        ...card,
        card_type: card.card_types,
        card_types: undefined,
        owner_type: 'user',
    }));
}

/**
 * Get all cards for a family member
 */
export async function getFamilyMemberCards(familyMemberId: string): Promise<PunchCardWithDetails[]> {
    const { data: cards, error } = await supabaseAdmin
        .from('punch_cards')
        .select(`
      *,
      card_types (*)
    `)
        .eq('family_member_id', familyMemberId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error('Failed to fetch family member cards');
    }

    return (cards || []).map((card: any) => ({
        ...card,
        card_type: card.card_types,
        card_types: undefined,
        owner_type: 'family_member',
    }));
}

/**
 * Get today's date in EST/EDT timezone for accurate expiration checks
 */
function getTodayDateString(): string {
    // Use America/New_York timezone for the dance studio's location
    const now = new Date();
    const estOffset = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const estDate = new Date(estOffset);
    const year = estDate.getFullYear();
    const month = String(estDate.getMonth() + 1).padStart(2, '0');
    const day = String(estDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get active card for a user
 * PRIORITY: Punch cards with remaining classes > Subscription cards
 * This ensures admin-created passes are used before subscription cards
 */
export async function getActiveCard(
    userId?: string,
    familyMemberId?: string
): Promise<PunchCardWithDetails | null> {
    const todayDate = getTodayDateString();

    if (!userId && !familyMemberId) {
        return null;
    }

    // Query for active cards - includes both punch cards and subscriptions
    let query = supabaseAdmin
        .from('punch_cards')
        .select(`
      *,
      card_types (*)
    `)
        .eq('status', 'active')
        .gte('expiration_date', todayDate);

    if (userId) {
        query = query.eq('user_id', userId);
    } else if (familyMemberId) {
        query = query.eq('family_member_id', familyMemberId);
    }

    const { data: cards, error } = await query
        .order('expiration_date', { ascending: true });

    if (error || !cards || cards.length === 0) {
        return null;
    }

    // Separate punch cards (with remaining classes) from subscriptions
    const punchCards: any[] = [];
    const subscriptionCards: any[] = [];

    for (const card of cards) {
        const isSubscription = card.card_types?.card_category === 'subscription';
        if (isSubscription) {
            subscriptionCards.push(card);
        } else if (card.classes_remaining > 0) {
            punchCards.push(card);
        }
    }

    // PRIORITY: Return punch card first if available, then subscription
    // This ensures admin-created passes are used before subscriptions
    const selectedCard = punchCards.length > 0 ? punchCards[0] : subscriptionCards[0];

    if (!selectedCard) {
        return null;
    }

    return {
        ...selectedCard,
        card_type: selectedCard.card_types,
        card_types: undefined,
        owner_type: userId ? 'user' : 'family_member',
    };
}

/**
 * Create a punch card (for online purchase)
 */
export async function createPunchCard(data: {
    user_id?: string;
    family_member_id?: string;
    card_type_id: string;
    payment_method: 'online' | 'cash' | 'admin_created';
    amount_paid: number;
    square_payment_id?: string;
    created_by?: string;
    skip_duplicate_check?: boolean; // For admin overrides
}): Promise<PunchCard> {
    // Get card type details
    const cardType = await getCardTypeById(data.card_type_id);
    if (!cardType) {
        throw new Error('Invalid card type');
    }

    // Check for existing active card (unless override)
    if (!data.skip_duplicate_check) {
        const existingCard = await getActiveCard(data.user_id, data.family_member_id);
        if (existingCard) {
            throw new Error(
                `Cannot purchase a new card. An active card already exists with ${existingCard.classes_remaining} classes remaining. ` +
                `Please use your current card or wait until it expires or is exhausted.`
            );
        }
    }

    // Calculate expiration date
    const purchaseDate = new Date();
    const expirationDate = new Date(purchaseDate);
    expirationDate.setMonth(expirationDate.getMonth() + cardType.expiration_months);

    const { data: card, error } = await supabaseAdmin
        .from('punch_cards')
        .insert({
            user_id: data.user_id || null,
            family_member_id: data.family_member_id || null,
            card_type_id: data.card_type_id,
            total_classes: cardType.classes,
            classes_remaining: cardType.classes,
            purchase_date: purchaseDate.toISOString().split('T')[0],
            expiration_date: expirationDate.toISOString().split('T')[0],
            amount_paid: data.amount_paid,
            status: 'active',
            payment_method: data.payment_method,
            square_payment_id: data.square_payment_id || null,
            created_by: data.created_by || null,
        })
        .select()
        .single();

    if (error || !card) {
        console.error('Error creating punch card:', error);
        throw new Error('Failed to create punch card');
    }

    // Send purchase confirmation email (async, don't block)
    sendPurchaseConfirmationEmailAsync(data.user_id, data.family_member_id, cardType.name, cardType.classes, card.expiration_date, data.amount_paid)
        .catch(err => console.error('Error sending purchase confirmation:', err));

    return card;
}

/**
 * Helper to send purchase confirmation email
 */
async function sendPurchaseConfirmationEmailAsync(
    userId: string | undefined,
    familyMemberId: string | undefined,
    cardName: string,
    totalClasses: number,
    expirationDate: string,
    amountPaid: number
): Promise<void> {
    try {
        let email: string | null = null;
        let userName = '';
        let checkInCode = '';

        if (userId) {
            const user = await userService.getUserById(userId);
            if (user) {
                email = user.email;
                userName = `${user.first_name} ${user.last_name}`;
                checkInCode = user.check_in_code || '';
            }
        } else if (familyMemberId) {
            // For family members, get parent's email
            const member = await userService.getFamilyMemberById(familyMemberId);
            if (member) {
                const parent = await userService.getUserById(member.primary_user_id);
                if (parent) {
                    email = parent.email;
                    userName = `${member.first_name} ${member.last_name}`;
                    checkInCode = member.check_in_code || '';
                }
            }
        }

        if (email && userName && checkInCode) {
            await sendPurchaseConfirmationEmail(
                userId || familyMemberId || '',
                userName,
                email,
                checkInCode,
                cardName,
                totalClasses,
                expirationDate,
                amountPaid
            );
            console.log(`✅ Purchase confirmation email sent to ${email}`);
        } else if (email && userName) {
            // Send even without checkInCode
            await sendPurchaseConfirmationEmail(
                userId || familyMemberId || '',
                userName,
                email,
                'N/A',
                cardName,
                totalClasses,
                expirationDate,
                amountPaid
            );
            console.log(`✅ Purchase confirmation email sent to ${email} (no check-in code)`);
        } else {
            console.log(`⚠️ Could not send purchase confirmation: email=${email}, userName=${userName}, checkInCode=${checkInCode}`);
        }
    } catch (error) {
        console.error('Error in sendPurchaseConfirmationEmailAsync:', error);
    }
}

/**
 * Admin create a custom pass (cash payment)
 */
export async function adminCreatePass(data: {
    user_id?: string;
    family_member_id?: string;
    classes: number;
    expiration_date: string;
    amount_paid: number;
    admin_id: string;
}): Promise<PunchCard> {
    const types = await getCardTypes();

    // Find a suitable card type for admin passes (must be punch_card, NOT subscription)
    let cardType = types.find(t => t.name === 'Admin Pass' && t.card_category !== 'subscription');

    // Fallback to common punch card types (not subscription)
    if (!cardType) {
        cardType = types.find(t =>
            t.card_category !== 'subscription' &&
            (t.name.includes('12 Class') || t.name.includes('5 Class') || t.name === 'Salsa & Bachata')
        );
    }

    // Last resort: use any non-subscription card type
    if (!cardType) {
        cardType = types.find(t => t.card_category !== 'subscription');
    }

    // If still no type found, use first available (shouldn't happen)
    if (!cardType) {
        cardType = types[0];
    }

    const { data: card, error } = await supabaseAdmin
        .from('punch_cards')
        .insert({
            user_id: data.user_id || null,
            family_member_id: data.family_member_id || null,
            card_type_id: cardType.id,
            total_classes: data.classes,
            classes_remaining: data.classes,
            purchase_date: new Date().toISOString().split('T')[0],
            expiration_date: data.expiration_date,
            amount_paid: data.amount_paid,
            status: 'active',
            payment_method: 'admin_created',
            created_by: data.admin_id,
        })
        .select()
        .single();

    if (error || !card) {
        console.error('Error creating admin pass:', error);
        throw new Error('Failed to create pass');
    }

    return card;
}

/**
 * Deduct a class from a punch card (used during check-in)
 */
export async function deductClass(cardId: string): Promise<PunchCard> {
    // Get current card
    const { data: currentCard, error: fetchError } = await supabaseAdmin
        .from('punch_cards')
        .select('*')
        .eq('id', cardId)
        .single();

    if (fetchError || !currentCard) {
        throw new Error('Card not found');
    }

    if (currentCard.classes_remaining <= 0) {
        throw new Error('No classes remaining on this card');
    }

    const newRemaining = currentCard.classes_remaining - 1;
    const newStatus = newRemaining <= 0 ? 'exhausted' : currentCard.status;

    const { data: card, error } = await supabaseAdmin
        .from('punch_cards')
        .update({
            classes_remaining: newRemaining,
            status: newStatus,
        })
        .eq('id', cardId)
        .select()
        .single();

    if (error || !card) {
        throw new Error('Failed to deduct class');
    }

    return card;
}

/**
 * Get all expired cards (admin)
 */
export async function getExpiredCards(
    page: number = 1,
    limit: number = 20
): Promise<PaginatedResponse<PunchCardWithDetails>> {
    const offset = (page - 1) * limit;

    // Get total count
    const { count } = await supabaseAdmin
        .from('punch_cards')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'expired');

    // Get paginated cards
    const { data: cards, error } = await supabaseAdmin
        .from('punch_cards')
        .select(`
      *,
      card_types (*),
      users!punch_cards_user_id_fkey (first_name, last_name, email),
      family_members!punch_cards_family_member_id_fkey (first_name, last_name)
    `)
        .eq('status', 'expired')
        .order('expiration_date', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        throw new Error('Failed to fetch expired cards');
    }

    const formattedCards = (cards || []).map((card: any) => {
        const ownerName = card.users
            ? `${card.users.first_name} ${card.users.last_name}`
            : card.family_members
                ? `${card.family_members.first_name} ${card.family_members.last_name}`
                : 'Unknown';

        return {
            ...card,
            card_type: card.card_types,
            owner_name: ownerName,
            owner_type: card.user_id ? 'user' : 'family_member',
            card_types: undefined,
            users: undefined,
            family_members: undefined,
        };
    });

    return {
        data: formattedCards,
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
    };
}

/**
 * Get active cards count (for analytics)
 */
export async function getActiveCardsCount(): Promise<number> {
    const { count } = await supabaseAdmin
        .from('punch_cards')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

    return count || 0;
}

/**
 * Get cards purchased today (for analytics)
 */
export async function getCardsIssuedToday(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    const { count } = await supabaseAdmin
        .from('punch_cards')
        .select('*', { count: 'exact', head: true })
        .eq('purchase_date', today);

    return count || 0;
}

/**
 * Get cards expiring within N days
 */
export async function getCardsExpiringSoon(days: number = 7): Promise<PunchCardWithDetails[]> {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    const { data: cards, error } = await supabaseAdmin
        .from('punch_cards')
        .select(`
      *,
      card_types (*),
      users!punch_cards_user_id_fkey (first_name, last_name, email, phone),
      family_members!punch_cards_family_member_id_fkey (first_name, last_name, primary_user_id)
    `)
        .eq('status', 'active')
        .gte('expiration_date', today.toISOString().split('T')[0])
        .lte('expiration_date', futureDate.toISOString().split('T')[0]);

    if (error) {
        throw new Error('Failed to fetch expiring cards');
    }

    return (cards || []).map((card: any) => ({
        ...card,
        card_type: card.card_types,
        owner_type: card.user_id ? 'user' : 'family_member',
    }));
}

/**
 * Get cards with low balance (2 or fewer classes)
 */
export async function getLowBalanceCards(): Promise<PunchCardWithDetails[]> {
    const { data: cards, error } = await supabaseAdmin
        .from('punch_cards')
        .select(`
      *,
      card_types (*),
      users!punch_cards_user_id_fkey (first_name, last_name, email, phone),
      family_members!punch_cards_family_member_id_fkey (first_name, last_name, primary_user_id)
    `)
        .eq('status', 'active')
        .lte('classes_remaining', 2)
        .gt('classes_remaining', 0);

    if (error) {
        throw new Error('Failed to fetch low balance cards');
    }

    return (cards || []).map((card: any) => ({
        ...card,
        card_type: card.card_types,
        owner_type: card.user_id ? 'user' : 'family_member',
    }));
}

/**
 * Expire all cards past their expiration date
 */
export async function expireCards(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
        .from('punch_cards')
        .update({ status: 'expired' })
        .eq('status', 'active')
        .lt('expiration_date', today)
        .select();

    if (error) {
        console.error('Error expiring cards:', error);
        return 0;
    }

    return data?.length || 0;
}

/**
 * Get all cards with user info (for admin dashboard)
 */
export async function getAllCards(
    page: number = 1,
    limit: number = 20,
    status?: 'active' | 'expired' | 'exhausted'
): Promise<PaginatedResponse<PunchCardWithDetails>> {
    let query = supabaseAdmin
        .from('punch_cards')
        .select(`
            *,
            card_types (*),
            users!punch_cards_user_id_fkey (id, first_name, last_name, email, phone, check_in_code),
            family_members!punch_cards_family_member_id_fkey (id, first_name, last_name, primary_user_id)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: cards, error, count } = await query;

    if (error) {
        throw new Error('Failed to fetch all cards');
    }

    return {
        data: (cards || []).map((card: any) => ({
            ...card,
            card_type: card.card_types,
            owner_type: card.user_id ? 'user' : 'family_member',
            owner_name: card.users
                ? `${card.users.first_name} ${card.users.last_name}`
                : card.family_members
                    ? `${card.family_members.first_name} ${card.family_members.last_name}`
                    : 'Unknown',
            owner_email: card.users?.email || 'N/A',
            owner_check_in_code: card.users?.check_in_code || null,
        })),
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
    };
}

/**
 * Get revenue stats for admin dashboard
 */
export async function getRevenueStats(): Promise<{
    totalRevenue: number;
    thisMonthRevenue: number;
    lastMonthRevenue: number;
    totalCardsSold: number;
}> {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

    // Total revenue (all time)
    const { data: totalData } = await supabaseAdmin
        .from('punch_cards')
        .select('amount_paid');

    const totalRevenue = (totalData || []).reduce((sum, card) => sum + parseFloat(card.amount_paid || 0), 0);
    const totalCardsSold = totalData?.length || 0;

    // This month revenue
    const { data: thisMonthData } = await supabaseAdmin
        .from('punch_cards')
        .select('amount_paid')
        .gte('created_at', thisMonthStart);

    const thisMonthRevenue = (thisMonthData || []).reduce((sum, card) => sum + parseFloat(card.amount_paid || 0), 0);

    // Last month revenue
    const { data: lastMonthData } = await supabaseAdmin
        .from('punch_cards')
        .select('amount_paid')
        .gte('created_at', lastMonthStart)
        .lte('created_at', lastMonthEnd);

    const lastMonthRevenue = (lastMonthData || []).reduce((sum, card) => sum + parseFloat(card.amount_paid || 0), 0);

    return {
        totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        totalCardsSold,
    };
}
