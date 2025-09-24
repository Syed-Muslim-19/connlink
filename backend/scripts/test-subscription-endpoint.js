import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

async function testSubscriptionEndpoint() {
  try {
    console.log('🧪 Testing subscription endpoint...');

    // Create a test JWT token for user 68caa03277d9ab4fb8c88ac2
    const testUserId = '68caa03277d9ab4fb8c88ac2';
    const testToken = jwt.sign({ userId: testUserId }, process.env.SECRET_KEY, { expiresIn: '1h' });

    console.log('🔑 Created test token for user:', testUserId);

    // Test the subscription endpoint
    const response = await fetch('http://localhost:3000/api/v1/subscription/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      }
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers));

    const data = await response.text();
    console.log('📊 Response body:', data);

    if (response.ok) {
      const jsonData = JSON.parse(data);
      console.log('✅ Subscription endpoint working!');
      console.log('🎉 Session ID:', jsonData.sessionId);
      console.log('🎉 Checkout URL:', jsonData.url);
    } else {
      console.log('❌ Subscription endpoint failed');
      console.log('Error details:', data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('❌ Stack:', error.stack);
  }
}

// Add node-fetch import simulation for older Node versions
if (!global.fetch) {
  global.fetch = (await import('node-fetch')).default;
}

testSubscriptionEndpoint();