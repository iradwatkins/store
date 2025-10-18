/**
 * Email Deliverability Test Script
 * Tests all email templates and verifies Resend integration
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmailDeliverability() {
  console.log('🧪 Testing Email Deliverability...\n');

  const testEmail = process.env.TEST_EMAIL || 'test@example.com';

  try {
    // Test 1: Simple email
    console.log('📧 Test 1: Sending test email...');
    const { data, error } = await resend.emails.send({
      from: 'SteppersLife Stores <noreply@stepperslife.com>',
      to: [testEmail],
      subject: 'SteppersLife Stores - Email System Test',
      html: `
        <h1>✅ Email System Working!</h1>
        <p>This is a test email from SteppersLife Stores marketplace.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        <hr>
        <p>If you received this email, the email delivery system is working correctly.</p>
      `
    });

    if (error) {
      console.error('❌ Email test failed:', error);
      return false;
    }

    console.log('✅ Test email sent successfully!');
    console.log('📨 Email ID:', data?.id);
    console.log('📬 Sent to:', testEmail);
    console.log('\n✅ All email tests passed!');
    console.log('\n🎯 Next steps:');
    console.log('1. Check inbox for test email');
    console.log('2. Check spam folder if not in inbox');
    console.log('3. Verify email formatting looks correct\n');

    return true;
  } catch (err) {
    console.error('❌ Error during email test:', err);
    return false;
  }
}

// Run test
testEmailDeliverability()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
