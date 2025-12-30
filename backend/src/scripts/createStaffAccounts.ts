/**
 * Script to create admin and staff accounts
 * Run with: npx tsx src/scripts/createStaffAccounts.ts
 */

import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../shared/supabase';
import { generateQRCodeId } from '../shared/qr';

const SALT_ROUNDS = 12;

async function createStaffAccounts() {
    console.log('Creating admin and staff accounts...\n');

    // Admin account
    const adminPassword = await bcrypt.hash('Admin123!', SALT_ROUNDS);
    const adminQrCode = generateQRCodeId('admin', 'user');

    const { data: admin, error: adminError } = await supabaseAdmin
        .from('users')
        .upsert({
            email: 'admin@estilolatino.com',
            password_hash: adminPassword,
            first_name: 'Admin',
            last_name: 'User',
            phone: '5551111111',
            role: 'admin',
            qr_code: adminQrCode,
            email_verified: true,
        }, { onConflict: 'email' })
        .select()
        .single();

    if (adminError) {
        console.error('Error creating admin:', adminError);
    } else {
        console.log('✅ Admin account created:');
        console.log(`   Email: admin@estilolatino.com`);
        console.log(`   Password: Admin123!`);
        console.log(`   ID: ${admin.id}\n`);
    }

    // Staff account
    const staffPassword = await bcrypt.hash('Staff123!', SALT_ROUNDS);
    const staffQrCode = generateQRCodeId('staff', 'user');

    const { data: staff, error: staffError } = await supabaseAdmin
        .from('users')
        .upsert({
            email: 'staff@estilolatino.com',
            password_hash: staffPassword,
            first_name: 'Staff',
            last_name: 'Member',
            phone: '5552222222',
            role: 'staff',
            qr_code: staffQrCode,
            email_verified: true,
        }, { onConflict: 'email' })
        .select()
        .single();

    if (staffError) {
        console.error('Error creating staff:', staffError);
    } else {
        console.log('✅ Staff account created:');
        console.log(`   Email: staff@estilolatino.com`);
        console.log(`   Password: Staff123!`);
        console.log(`   ID: ${staff.id}\n`);
    }

    console.log('\n📋 Test Accounts Summary:');
    console.log('═══════════════════════════════════════');
    console.log('ADMIN LOGIN (via Staff login type):');
    console.log('  Email: admin@estilolatino.com');
    console.log('  Password: Admin123!');
    console.log('');
    console.log('STAFF LOGIN (via Staff login type):');
    console.log('  Email: staff@estilolatino.com');
    console.log('  Password: Staff123!');
    console.log('');
    console.log('CUSTOMER LOGIN (via Customer login type):');
    console.log('  Email: testuser@example.com');
    console.log('  Password: TestPass123');
    console.log('═══════════════════════════════════════');
}

createStaffAccounts()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Error:', err);
        process.exit(1);
    });
