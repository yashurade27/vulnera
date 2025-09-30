import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    // Bounty Hunters
    prisma.user.create({
      data: {
        email: 'alice.hunter@example.com',
        username: 'alice_hunter',
        passwordHash: hashedPassword,
        role: 'BOUNTY_HUNTER',
        status: 'ACTIVE',
        emailVerified: true,
        fullName: 'Alice Hunter',
        bio: 'Security researcher specializing in web vulnerabilities',
        country: 'USA',
        totalEarnings: 2500.50,
        totalBounties: 15,
        reputation: 95.5,
        rank: 1,
        githubUrl: 'https://github.com/alicehunter',
        twitterUrl: 'https://twitter.com/alicehunter',
        walletAddress: '11111111111111111111111111111112',
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob.security@example.com',
        username: 'bob_security',
        passwordHash: hashedPassword,
        role: 'BOUNTY_HUNTER',
        status: 'ACTIVE',
        emailVerified: true,
        fullName: 'Bob Security',
        bio: 'Blockchain and smart contract auditor',
        country: 'Canada',
        totalEarnings: 1800.75,
        totalBounties: 12,
        reputation: 88.2,
        rank: 2,
        linkedinUrl: 'https://linkedin.com/in/bobsecurity',
        walletAddress: '22222222222222222222222222222222',
      },
    }),
    prisma.user.create({
      data: {
        email: 'charlie.pentest@example.com',
        username: 'charlie_pentest',
        passwordHash: hashedPassword,
        role: 'BOUNTY_HUNTER',
        status: 'ACTIVE',
        emailVerified: true,
        fullName: 'Charlie Pentest',
        bio: 'Mobile app security specialist',
        country: 'UK',
        totalEarnings: 1200.25,
        totalBounties: 8,
        reputation: 82.1,
        rank: 3,
        portfolioUrl: 'https://charliepentest.com',
        walletAddress: '33333333333333333333333333333333',
      },
    }),
    // Company Admins
    prisma.user.create({
      data: {
        email: 'sarah.ceo@techcorp.com',
        username: 'sarah_ceo',
        passwordHash: hashedPassword,
        role: 'COMPANY_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        fullName: 'Sarah Johnson',
        bio: 'CEO of TechCorp, passionate about secure software',
        country: 'USA',
        walletAddress: '44444444444444444444444444444444',
      },
    }),
    prisma.user.create({
      data: {
        email: 'mike.security@fintech.com',
        username: 'mike_security',
        passwordHash: hashedPassword,
        role: 'COMPANY_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        fullName: 'Mike Chen',
        bio: 'Head of Security at FinTech Solutions',
        country: 'Singapore',
        walletAddress: '55555555555555555555555555555555',
      },
    }),
  ]);

  console.log('✅ Created test users');

  // Create test companies
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'TechCorp',
        slug: 'techcorp',
        description: 'Leading technology company focused on secure software development',
        website: 'https://techcorp.com',
        walletAddress: '66666666666666666666666666666666',
        industry: 'Technology',
        companySize: '100-500',
        location: 'San Francisco, CA',
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.company.create({
      data: {
        name: 'FinTech Solutions',
        slug: 'fintech-solutions',
        description: 'Financial technology company revolutionizing digital payments',
        website: 'https://fintech-solutions.com',
        walletAddress: '77777777777777777777777777777777',
        industry: 'Finance',
        companySize: '50-100',
        location: 'Singapore',
        isVerified: true,
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Created test companies');

  // Create company members
  await Promise.all([
    prisma.companyMember.create({
      data: {
        userId: users[3].id, // sarah_ceo
        companyId: companies[0].id, // TechCorp
        role: 'COMPANY_ADMIN',
        canCreateBounty: true,
        canReviewBounty: true,
        canApprovePayment: true,
        canManageMembers: true,
        isActive: true,
      },
    }),
    prisma.companyMember.create({
      data: {
        userId: users[4].id, // mike_security
        companyId: companies[1].id, // FinTech Solutions
        role: 'COMPANY_ADMIN',
        canCreateBounty: true,
        canReviewBounty: true,
        canApprovePayment: true,
        canManageMembers: true,
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Created company members');

  // Create bounties
  const bounties = await Promise.all([
    prisma.bounty.create({
      data: {
        companyId: companies[0].id, // TechCorp
        title: 'Critical XSS Vulnerability in Login Form',
        description: 'We have identified a critical XSS vulnerability in our login form that allows attackers to inject malicious scripts. We need security researchers to help us identify and fix this issue.',
        bountyType: 'SECURITY',
        targetUrl: 'https://techcorp.com/login',
        rewardAmount: 500.00,
        status: 'ACTIVE',
        inScope: ['techcorp.com', 'app.techcorp.com'],
        outOfScope: ['staging.techcorp.com', 'dev.techcorp.com'],
        requirements: 'Please provide a detailed report with steps to reproduce, impact assessment, and suggested fix.',
        guidelines: 'Do not perform DDoS attacks or attempt to access user data.',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        totalSubmissions: 3,
        validSubmissions: 2,
      },
    }),
    prisma.bounty.create({
      data: {
        companyId: companies[0].id, // TechCorp
        title: 'API Rate Limiting Bypass',
        description: 'Our API endpoints may be vulnerable to rate limiting bypass attacks. Help us identify and fix potential weaknesses.',
        bountyType: 'SECURITY',
        targetUrl: 'https://api.techcorp.com',
        rewardAmount: 750.00,
        status: 'ACTIVE',
        inScope: ['api.techcorp.com'],
        outOfScope: ['staging-api.techcorp.com'],
        requirements: 'Include proof of concept and detailed explanation of the vulnerability.',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        totalSubmissions: 1,
        validSubmissions: 1,
      },
    }),
    prisma.bounty.create({
      data: {
        companyId: companies[1].id, // FinTech Solutions
        title: 'Smart Contract Audit - DeFi Protocol',
        description: 'We need a comprehensive security audit of our new DeFi protocol smart contracts.',
        bountyType: 'SECURITY',
        rewardAmount: 2000.00,
        status: 'ACTIVE',
        inScope: ['smart contracts on Ethereum mainnet'],
        outOfScope: ['testnet contracts'],
        requirements: 'Provide detailed audit report with severity levels and recommended fixes.',
        guidelines: 'Focus on reentrancy, overflow/underflow, and access control issues.',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        totalSubmissions: 2,
        validSubmissions: 1,
      },
    }),
  ]);

  console.log('✅ Created test bounties');

  // Create submissions
  const submissions = await Promise.all([
    prisma.submission.create({
      data: {
        bountyId: bounties[0].id,
        userId: users[0].id, // alice_hunter
        companyId: companies[0].id,
        title: 'XSS in Login Form - DOM-based Injection',
        description: 'Found a DOM-based XSS vulnerability in the login form JavaScript validation.',
        bountyType: 'SECURITY',
        vulnerabilityType: 'Cross-Site Scripting (XSS)',
        stepsToReproduce: '1. Go to login page\n2. Enter <script>alert("XSS")</script> in username field\n3. Click login\n4. Script executes in browser',
        impact: 'High - Attacker can execute arbitrary JavaScript in victim\'s browser, potentially stealing session cookies or performing actions on behalf of the user.',
        proofOfConcept: '<script>alert(document.cookie)</script>',
        attachments: ['https://example.com/proof1.png', 'https://example.com/proof2.html'],
        status: 'APPROVED',
        reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        reviewedBy: users[3].id, // sarah_ceo
        reviewNotes: 'Excellent find! This is indeed a critical vulnerability.',
        rewardAmount: 500.00,
        responseDeadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      },
    }),
    prisma.submission.create({
      data: {
        bountyId: bounties[1].id,
        userId: users[1].id, // bob_security
        companyId: companies[0].id,
        title: 'Rate Limiting Bypass via Header Manipulation',
        description: 'Rate limiting can be bypassed by manipulating HTTP headers.',
        bountyType: 'SECURITY',
        vulnerabilityType: 'Rate Limiting Bypass',
        stepsToReproduce: '1. Send request with X-Forwarded-For header\n2. Rotate IP addresses in header\n3. Bypass rate limiting',
        impact: 'Medium - Allows attackers to perform more requests than intended, potentially leading to DoS.',
        status: 'PENDING',
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        responseDeadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 21 * 24 * 60 * 60 * 1000), // 21 days after submission
      },
    }),
    prisma.submission.create({
      data: {
        bountyId: bounties[2].id,
        userId: users[1].id, // bob_security
        companyId: companies[1].id,
        title: 'Smart Contract Audit Report - Critical Findings',
        description: 'Comprehensive audit of the DeFi protocol smart contracts.',
        bountyType: 'SECURITY',
        vulnerabilityType: 'Smart Contract Vulnerability',
        stepsToReproduce: 'See attached audit report for detailed findings.',
        impact: 'Critical - Multiple reentrancy vulnerabilities found that could lead to fund loss.',
        attachments: ['https://example.com/audit-report.pdf'],
        status: 'APPROVED',
        reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        reviewedBy: users[4].id, // mike_security
        reviewNotes: 'Excellent audit work. The reentrancy findings are valid.',
        rewardAmount: 2000.00,
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        responseDeadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 21 * 24 * 60 * 60 * 1000), // 21 days after submission
      },
    }),
  ]);

  console.log('✅ Created test submissions');

  // Create payments
  await Promise.all([
    prisma.payment.create({
      data: {
        submissionId: submissions[0].id,
        userId: users[0].id, // alice_hunter
        companyId: companies[0].id,
        amount: 500.00,
        platformFee: 25.00,
        netAmount: 475.00,
        txSignature: 'tx_approved_xss_fix_001',
        fromWallet: companies[0].walletAddress,
        toWallet: users[0].walletAddress!,
        blockchainConfirmed: true,
        confirmations: 15,
        status: 'COMPLETED',
        initiatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 minutes later
      },
    }),
    prisma.payment.create({
      data: {
        submissionId: submissions[2].id,
        userId: users[1].id, // bob_security
        companyId: companies[1].id,
        amount: 2000.00,
        platformFee: 100.00,
        netAmount: 1900.00,
        txSignature: 'tx_smart_contract_audit_001',
        fromWallet: companies[1].walletAddress,
        toWallet: users[1].walletAddress!,
        blockchainConfirmed: true,
        confirmations: 12,
        status: 'COMPLETED',
        initiatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // 45 minutes later
      },
    }),
  ]);

  console.log('✅ Created test payments');

  // Create comments
  await Promise.all([
    prisma.comment.create({
      data: {
        submissionId: submissions[0].id,
        userId: users[3].id, // sarah_ceo
        content: 'Thank you for the detailed report. We\'ve started working on the fix.',
        isInternal: false,
      },
    }),
    prisma.comment.create({
      data: {
        submissionId: submissions[0].id,
        userId: users[0].id, // alice_hunter
        content: 'Glad I could help! Let me know if you need any clarification on the fix.',
        isInternal: false,
      },
    }),
    prisma.comment.create({
      data: {
        submissionId: submissions[1].id,
        userId: users[3].id, // sarah_ceo
        content: 'We\'re reviewing this submission. Can you provide more details about the header manipulation technique?',
        isInternal: true,
      },
    }),
  ]);

  console.log('✅ Created test comments');

  // Create notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: users[0].id, // alice_hunter
        title: 'Bounty Payment Received',
        message: 'You have received $500.00 for your XSS vulnerability submission.',
        type: 'PAYMENT',
        actionUrl: `/submissions/${submissions[0].id}`,
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[1].id, // bob_security
        title: 'Submission Approved',
        message: 'Your smart contract audit submission has been approved!',
        type: 'SUBMISSION',
        actionUrl: `/submissions/${submissions[2].id}`,
        isRead: true,
      },
    }),
  ]);

  console.log('✅ Created test notifications');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Users: ${users.length}`);
  console.log(`   Companies: ${companies.length}`);
  console.log(`   Bounties: ${bounties.length}`);
  console.log(`   Submissions: ${submissions.length}`);
  console.log(`   Payments: 2`);
  console.log(`   Comments: 3`);
  console.log(`   Notifications: 2`);

  console.log('\n🔑 Test Login Credentials:');
  console.log('   Email: alice.hunter@example.com | Password: password123');
  console.log('   Email: bob.security@example.com | Password: password123');
  console.log('   Email: charlie.pentest@example.com | Password: password123');
  console.log('   Email: sarah.ceo@techcorp.com | Password: password123');
  console.log('   Email: mike.security@fintech.com | Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });