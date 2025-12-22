#!/usr/bin/env node

/**
 * Helper script to get your local network IP address
 * Run this to find the IP address to use when accessing from other devices
 */

const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: name,
          address: iface.address
        });
      }
    }
  }

  return addresses;
}

const ips = getLocalIP();

if (ips.length === 0) {
  console.log('❌ No network interfaces found');
  process.exit(1);
}

console.log('\n🌐 Your local network IP addresses:\n');
ips.forEach(({ interface, address }) => {
  console.log(`  ${interface}: ${address}`);
});

console.log('\n📱 To access from other devices:');
console.log(`   Frontend: http://${ips[0].address}:3000`);
console.log(`   Backend:  http://${ips[0].address}:3001\n`);

console.log('💡 Tip: Set FRONTEND_URL environment variable if needed:');
console.log(`   FRONTEND_URL=http://${ips[0].address}:3000\n`);

