// Test CHALLENGE messages with your own number
async function testMyselfChallenge() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║  🧪 TEST CHALLENGE - MY NUMBER        ║');
  console.log('╚═══════════════════════════════════════╝\n');
  
  const myPhone = '11998457676';
  
  const response = await fetch('http://localhost:3001/api/send-bulk-referral', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'test',
      limit: 1,
      specific_phone: myPhone
    })
  });

  const result = await response.json();
  
  if (result.success > 0) {
    console.log('✅ Challenge messages sent!');
    console.log('📱 Check your WhatsApp (2 messages)\n');
    console.log(`   Total: ${result.success} leads`);
    console.log(`   Messages: ${result.messages_sent}\n`);
  } else {
    console.log('❌ Error:', result.errors?.[0]?.error || 'Unknown\n');
  }
}

testMyselfChallenge();