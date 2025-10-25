// Test CHALLENGE messages with 5 leads
async function testBatchChallenge() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║  🧪 TEST CHALLENGE - 5 LEADS          ║');
  console.log('╚═══════════════════════════════════════╝\n');
  
  const response = await fetch('http://localhost:3001/api/send-bulk-referral', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'test',
      limit: 5
    })
  });

  const result = await response.json();
  
  console.log('📊 RESULTS:');
  console.log(`   ✅ Sent: ${result.success}/${result.total}`);
  console.log(`   ❌ Failed: ${result.failed}`);
  console.log(`   📨 Messages: ${result.messages_sent}\n`);
  
  if (result.errors?.length > 0) {
    console.log('⚠️  Errors:');
    result.errors.forEach(e => console.log(`   - ${e.nome}: ${e.error}`));
    console.log('');
  }
}

testBatchChallenge();