// Simple test script to verify the server is working
const http = require('http');

const testEndpoint = (path, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

async function runTests() {
  console.log('🧪 Testing Dataverse Backend...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await testEndpoint('/health');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response: ${JSON.stringify(healthResponse.data, null, 2)}\n`);

    // Test 404 endpoint
    console.log('2. Testing 404 endpoint...');
    const notFoundResponse = await testEndpoint('/nonexistent');
    console.log(`   Status: ${notFoundResponse.status}`);
    console.log(`   Response: ${JSON.stringify(notFoundResponse.data, null, 2)}\n`);

    // Test user signup (should fail without database)
    console.log('3. Testing user signup endpoint...');
    const signupResponse = await testEndpoint('/api/user/signup', 'POST', {
      email: 'test@example.com',
      password: 'testpassword'
    });
    console.log(`   Status: ${signupResponse.status}`);
    console.log(`   Response: ${JSON.stringify(signupResponse.data, null, 2)}\n`);

    console.log('✅ Basic server tests completed!');
    console.log('📝 Note: Database-dependent endpoints will fail until you configure the database.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('💡 Make sure the server is running on port 3000');
  }
}

// Run tests
runTests();
