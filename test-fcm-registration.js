#!/usr/bin/env node

/**
 * Test script to diagnose FCM token registration issues
 * This script tests the complete FCM token registration flow
 */

require('dotenv').config({ path: '.env.local' });

async function testFCMRegistration() {
  console.log('🔍 Testing FCM Token Registration System...\n');

  // Test 1: Check if admin server is running
  console.log('1️⃣ Testing Admin Server Connection...');
  try {
    const healthResponse = await fetch('http://localhost:3001/api/notifications/test', {
      method: 'GET'
    });
    
    if (healthResponse.ok) {
      console.log('✅ Admin server is running and accessible');
    } else {
      console.log('❌ Admin server responded with status:', healthResponse.status);
      const errorText = await healthResponse.text();
      console.log('Error response:', errorTe