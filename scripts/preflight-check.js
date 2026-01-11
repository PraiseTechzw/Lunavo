#!/usr/bin/env node

/**
 * Pre-flight Check Script
 * Validates environment and configuration before deployment
 */

const fs = require('fs');
const path = require('path');

const checks = [];

function check(name, condition, fix) {
    const passed = typeof condition === 'function' ? condition() : condition;
    checks.push({ name, passed, fix });
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}`);
    if (!passed && fix) {
        console.log(`   Fix: ${fix}`);
    }
    return passed;
}

console.log('\n🚀 Pre-flight Checks for PEACE Platform\n');

// Check 1: Node version
check(
    'Node.js version >= 20.x',
    () => {
        const version = process.version.match(/^v(\d+)/);
        return version && parseInt(version[1]) >= 20;
    },
    'Install Node.js 20.x or higher from https://nodejs.org'
);

// Check 2: package.json exists
check(
    'package.json exists',
    fs.existsSync(path.join(process.cwd(), 'package.json')),
    'Run npm init or restore package.json'
);

// Check 3: node_modules installed
check(
    'Dependencies installed',
    fs.existsSync(path.join(process.cwd(), 'node_modules')),
    'Run: npm install'
);

// Check 4: .env file exists
check(
    '.env file exists',
    fs.existsSync(path.join(process.cwd(), '.env')),
    'Create .env file with Supabase credentials'
);

// Check 5: .env has required variables
if (fs.existsSync(path.join(process.cwd(), '.env'))) {
    const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
    check(
        'EXPO_PUBLIC_SUPABASE_URL configured',
        envContent.includes('EXPO_PUBLIC_SUPABASE_URL='),
        'Add EXPO_PUBLIC_SUPABASE_URL to .env'
    );
    check(
        'EXPO_PUBLIC_SUPABASE_ANON_KEY configured',
        envContent.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY='),
        'Add EXPO_PUBLIC_SUPABASE_ANON_KEY to .env'
    );
}

// Check 6: app.json exists
check(
    'app.json exists',
    fs.existsSync(path.join(process.cwd(), 'app.json')),
    'Restore app.json configuration'
);

// Check 7: app.json has EAS project ID
if (fs.existsSync(path.join(process.cwd(), 'app.json'))) {
    const appJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'app.json'), 'utf8'));
    check(
        'EAS project ID configured',
        appJson.expo?.extra?.eas?.projectId,
        'Run: eas init'
    );
}

// Check 8: eas.json exists
check(
    'eas.json exists',
    fs.existsSync(path.join(process.cwd(), 'eas.json')),
    'Run: eas build:configure'
);

// Check 9: GitHub workflows exist
check(
    'GitHub Actions workflows configured',
    fs.existsSync(path.join(process.cwd(), '.github', 'workflows')),
    'Workflows should be in .github/workflows/'
);

// Check 10: Supabase migrations exist
check(
    'Supabase migrations exist',
    fs.existsSync(path.join(process.cwd(), 'supabase', 'migrations')),
    'Create supabase/migrations/ directory'
);

// Check 11: TypeScript configuration
check(
    'tsconfig.json exists',
    fs.existsSync(path.join(process.cwd(), 'tsconfig.json')),
    'Create tsconfig.json for TypeScript support'
);

// Check 12: Git repository initialized
check(
    'Git repository initialized',
    fs.existsSync(path.join(process.cwd(), '.git')),
    'Run: git init'
);

// Check 13: .gitignore exists
check(
    '.gitignore exists',
    fs.existsSync(path.join(process.cwd(), '.gitignore')),
    'Create .gitignore to exclude sensitive files'
);

// Check 14: Documentation exists
check(
    'Documentation exists',
    fs.existsSync(path.join(process.cwd(), '.agent')),
    'Documentation should be in .agent/ folder'
);

// Summary
console.log('\n📊 Summary:\n');
const passed = checks.filter(c => c.passed).length;
const failed = checks.filter(c => !c.passed).length;
const total = checks.length;

console.log(`Total Checks: ${total}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

if (failed > 0) {
    console.log('⚠️  Please fix the failed checks before deploying\n');
    process.exit(1);
} else {
    console.log('🎉 All checks passed! Ready for deployment\n');
    process.exit(0);
}
