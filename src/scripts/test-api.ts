// Test script to verify API access from different devices
import { createTestClient } from '../lib/api-test-client';

async function testAPI() {
  // Replace with your server's local IP
  const serverIP = '192.168.1.100'; // Your computer's local IP
  const client = createTestClient(serverIP);

  try {
    console.log('🔗 Testing API connection...');
    await client.testConnection();

    console.log('\n📊 Testing statistics endpoint...');
    const stats = await client.getStats();
    console.log('Stats:', {
      totalMembers: stats.data.total_members,
      communities: stats.data.communities.length
    });

    console.log('\n👥 Testing members endpoint...');
    const members = await client.getMembers({ limit: '5' });
    console.log(`Retrieved ${members.data.length} members`);

    console.log('\n🏘️ Testing communities endpoint...');
    const communities = await client.getCommunities();
    console.log(`Found ${communities.data.length} communities`);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testAPI();
}