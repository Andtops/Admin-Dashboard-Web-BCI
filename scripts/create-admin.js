/**
 * Utility script to create admin accounts via Convex
 * Usage: node scripts/create-admin.js
 */

const readline = require('readline');
const crypto = require('crypto');

// Simple password hashing function (same as in auth.ts)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'benzochem_salt').digest('hex');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionHidden(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    process.stdin.on('data', function(char) {
      char = char + '';
      
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function createAdmin() {
  console.log('🔧 Benzochem Admin Account Creator');
  console.log('=====================================\n');
  
  try {
    const email = await question('Email: ');
    const firstName = await question('First Name: ');
    const lastName = await question('Last Name: ');
    const password = await questionHidden('Password: ');
    const confirmPassword = await questionHidden('Confirm Password: ');
    
    if (password !== confirmPassword) {
      console.log('\n❌ Passwords do not match!');
      rl.close();
      return;
    }
    
    if (password.length < 8) {
      console.log('\n❌ Password must be at least 8 characters long!');
      rl.close();
      return;
    }
    
    const roleAnswer = await question('\nRole (admin/super_admin) [super_admin]: ');
    const role = roleAnswer.trim() || 'super_admin';
    
    if (!['admin', 'super_admin'].includes(role)) {
      console.log('\n❌ Invalid role! Must be "admin" or "super_admin"');
      rl.close();
      return;
    }
    
    console.log('\n📝 Admin Account Details:');
    console.log(`Email: ${email}`);
    console.log(`Name: ${firstName} ${lastName}`);
    console.log(`Role: ${role}`);
    console.log(`Password Hash: ${hashPassword(password)}`);
    
    const confirm = await question('\nCreate this admin account? (y/N): ');
    
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('\n❌ Admin creation cancelled.');
      rl.close();
      return;
    }
    
    console.log('\n✅ Admin account details generated!');
    console.log('\n📋 To create this admin account, you can:');
    console.log('1. Use the Convex dashboard to insert the record manually');
    console.log('2. Call the createAdmin mutation with these details\n');

    console.log('🔗 Convex Mutation Call:');
    console.log('Function: auth.createAdmin');
    console.log('Arguments:');
    console.log(JSON.stringify({
      email,
      password, // Note: Plain text password (DEVELOPMENT ONLY!)
      firstName,
      lastName
    }, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
  
  rl.close();
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!');
  rl.close();
  process.exit(0);
});

createAdmin();
