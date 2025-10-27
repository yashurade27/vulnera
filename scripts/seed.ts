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
    prisma.project.deleteMany(),
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
    prisma.user.create({
      data: {
        email: 'james.nft@nftmarketplace.io',
        username: 'james_nft',
        passwordHash: hashedPassword,
        role: 'COMPANY_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        fullName: 'James Martinez',
        bio: 'Co-founder of NFT Marketplace Pro',
        country: 'UAE',
        walletAddress: 'JamesNFTWallet99999999999999999999999999',
      },
    }),
    prisma.user.create({
      data: {
        email: 'lisa.defi@defiprotocol.finance',
        username: 'lisa_defi',
        passwordHash: hashedPassword,
        role: 'COMPANY_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        fullName: 'Lisa Wong',
        bio: 'Head of Security at DeFi Protocol Labs',
        country: 'Switzerland',
        walletAddress: 'LisaDeFiWalletAAAAAAAAAAAAAAAAAAAAAAAAA',
      },
    }),
    prisma.user.create({
      data: {
        email: 'david.cloud@cloudsecure.com',
        username: 'david_cloud',
        passwordHash: hashedPassword,
        role: 'COMPANY_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        fullName: 'David Thompson',
        bio: 'VP of Engineering at CloudSecure Inc',
        country: 'USA',
        walletAddress: 'DavidCloudWalletBBBBBBBBBBBBBBBBBBBBBBBBB',
      },
    }),
    prisma.user.create({
      data: {
        email: 'sophia.game@gamefistudios.gg',
        username: 'sophia_game',
        passwordHash: hashedPassword,
        role: 'COMPANY_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        fullName: 'Sophia Kim',
        bio: 'Lead Game Developer at GameFi Studios',
        country: 'South Korea',
        walletAddress: 'SophiaGameWalletCCCCCCCCCCCCCCCCCCCCCCCC',
      },
    }),
    prisma.user.create({
      data: {
        email: 'rachel.health@healthtech.com',
        username: 'rachel_health',
        passwordHash: hashedPassword,
        role: 'COMPANY_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        fullName: 'Rachel Anderson',
        bio: 'Chief Technology Officer at HealthTech Innovations',
        country: 'USA',
        walletAddress: 'RachelHealthWalletDDDDDDDDDDDDDDDDDDDDDD',
      },
    }),
  ]);

  const [alice, bob, charlie, dana, sarah, mike, olivia, ethan, james, lisa, david, sophia, rachel] = createdUsers;
  console.log('✅ Created users');

  // Create projects for bounty hunters
  const createdProjects = await Promise.all([
    // Alice's projects
    prisma.project.create({
      data: {
        userId: alice.id,
        name: 'SecureAuth Library',
        description: 'Open-source authentication library with built-in protection against common vulnerabilities like XSS, CSRF, and SQL injection.',
        website: 'https://github.com/alicehunter/secureauth',
      },
    }),
    prisma.project.create({
      data: {
        userId: alice.id,
        name: 'VulnScanner Pro',
        description: 'Automated web application security scanner that identifies OWASP Top 10 vulnerabilities with minimal false positives.',
        website: 'https://vulnscanner.dev',
      },
    }),
    prisma.project.create({
      data: {
        userId: alice.id,
        name: 'API Security Toolkit',
        description: 'Comprehensive toolkit for testing and securing REST APIs, GraphQL endpoints, and WebSocket connections.',
        website: 'https://github.com/alicehunter/api-security-toolkit',
      },
    }),

    // Bob's projects
    prisma.project.create({
      data: {
        userId: bob.id,
        name: 'DeFi Audit Framework',
        description: 'Smart contract auditing framework specifically designed for DeFi protocols on Solana and Ethereum.',
        website: 'https://defi-audit.io',
      },
    }),
    prisma.project.create({
      data: {
        userId: bob.id,
        name: 'Blockchain Security Scanner',
        description: 'Automated tool for detecting common vulnerabilities in Solana programs including reentrancy, integer overflow, and access control issues.',
        website: 'https://github.com/bobsecurity/blockchain-scanner',
      },
    }),

    // Charlie's projects
    prisma.project.create({
      data: {
        userId: charlie.id,
        name: 'Mobile App Fuzzer',
        description: 'Advanced fuzzing tool for Android and iOS applications to discover crashes and security vulnerabilities.',
        website: 'https://github.com/charliepentest/mobile-fuzzer',
      },
    }),
    prisma.project.create({
      data: {
        userId: charlie.id,
        name: 'PenTest Automation Suite',
        description: 'Comprehensive penetration testing automation suite with support for web, mobile, and API testing.',
        website: 'https://charliepentest.com/projects/automation-suite',
      },
    }),
    prisma.project.create({
      data: {
        userId: charlie.id,
        name: 'Crypto Wallet Security Audit',
        description: 'Security audit report for a popular cryptocurrency wallet, identifying critical vulnerabilities in key management.',
        website: 'https://charliepentest.com/audits/wallet-security',
      },
    }),
  ]);

  console.log('✅ Created projects');

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
    prisma.company.create({
      data: {
        name: 'NFT Marketplace Pro',
        slug: 'nft-marketplace-pro',
        description: 'Leading NFT marketplace with advanced security features and multi-chain support',
        website: 'https://nftmarketplacepro.io',
        walletAddress: 'So666666666666666666666666666666666666667',
        smartContractAddress: 'SC66666666666666666666666666666666666667',
        industry: 'NFT/Web3',
        companySize: '100-150',
        location: 'Dubai, UAE',
        totalBountiesFunded: new Prisma.Decimal('425.750000000'), // SOL
        totalBountiesPaid: new Prisma.Decimal('298.500000000'), // SOL
        activeBounties: 4,
        resolvedVulnerabilities: 21,
        reputation: 91.8,
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.company.create({
      data: {
        name: 'DeFi Protocol Labs',
        slug: 'defi-protocol-labs',
        description: 'Decentralized finance protocol specializing in yield aggregation and liquidity pools',
        website: 'https://defiprotocol.finance',
        walletAddress: 'So777777777777777777777777777777777777778',
        smartContractAddress: 'SC77777777777777777777777777777777777778',
        industry: 'DeFi',
        companySize: '50-100',
        location: 'Zug, Switzerland',
        totalBountiesFunded: new Prisma.Decimal('890.000000000'), // SOL
        totalBountiesPaid: new Prisma.Decimal('612.450000000'), // SOL
        activeBounties: 5,
        resolvedVulnerabilities: 38,
        reputation: 97.2,
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.company.create({
      data: {
        name: 'CloudSecure Inc',
        slug: 'cloudsecure-inc',
        description: 'Cloud infrastructure security platform with automated vulnerability scanning',
        website: 'https://cloudsecure.com',
        walletAddress: 'So888888888888888888888888888888888888889',
        smartContractAddress: 'SC88888888888888888888888888888888888889',
        industry: 'Cloud Security',
        companySize: '500+',
        location: 'Seattle, WA',
        totalBountiesFunded: new Prisma.Decimal('1250.000000000'), // SOL
        totalBountiesPaid: new Prisma.Decimal('890.250000000'), // SOL
        activeBounties: 7,
        resolvedVulnerabilities: 52,
        reputation: 94.5,
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.company.create({
      data: {
        name: 'GameFi Studios',
        slug: 'gamefi-studios',
        description: 'Blockchain gaming platform with play-to-earn mechanics and NFT integration',
        website: 'https://gamefistudios.gg',
        walletAddress: 'So999999999999999999999999999999999999990',
        smartContractAddress: 'SC99999999999999999999999999999999999990',
        industry: 'Gaming/Web3',
        companySize: '150-250',
        location: 'Seoul, South Korea',
        totalBountiesFunded: new Prisma.Decimal('315.500000000'), // SOL
        totalBountiesPaid: new Prisma.Decimal('178.900000000'), // SOL
        activeBounties: 3,
        resolvedVulnerabilities: 15,
        reputation: 87.6,
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.company.create({
      data: {
        name: 'HealthTech Innovations',
        slug: 'healthtech-innovations',
        description: 'Healthcare technology company building secure patient data management systems',
        website: 'https://healthtech-innovations.com',
        walletAddress: 'SoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB',
        smartContractAddress: 'SCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB',
        industry: 'Healthcare',
        companySize: '250-500',
        location: 'Boston, MA',
        totalBountiesFunded: new Prisma.Decimal('560.000000000'), // SOL
        totalBountiesPaid: new Prisma.Decimal('412.750000000'), // SOL
        activeBounties: 2,
        resolvedVulnerabilities: 28,
        reputation: 92.1,
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.company.create({
      data: {
        name: 'EduChain',
        slug: 'educhain',
        description: 'Blockchain-based education platform for verifiable credentials and certifications',
        website: 'https://educhain.org',
        walletAddress: 'SoBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBC',
        smartContractAddress: 'SCBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBC',
        industry: 'Education/Web3',
        companySize: '25-50',
        location: 'Austin, TX',
        totalBountiesFunded: new Prisma.Decimal('145.250000000'), // SOL
        totalBountiesPaid: new Prisma.Decimal('98.750000000'), // SOL
        activeBounties: 1,
        resolvedVulnerabilities: 11,
        reputation: 83.4,
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.company.create({
      data: {
        name: 'MetaVerse Builders',
        slug: 'metaverse-builders',
        description: 'Virtual reality metaverse platform with decentralized land ownership',
        website: 'https://metaversebuilders.world',
        walletAddress: 'SoCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCD',
        smartContractAddress: 'SCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCD',
        industry: 'Metaverse/VR',
        companySize: '100-150',
        location: 'London, UK',
        totalBountiesFunded: new Prisma.Decimal('275.800000000'), // SOL
        totalBountiesPaid: new Prisma.Decimal('156.400000000'), // SOL
        activeBounties: 2,
        resolvedVulnerabilities: 13,
        reputation: 79.8,
        isVerified: false,
        isActive: true,
      },
    }),
    prisma.company.create({
      data: {
        name: 'AgroTech Solutions',
        slug: 'agrotech-solutions',
        description: 'Agricultural technology company using blockchain for supply chain transparency',
        website: 'https://agrotech-sol.com',
        walletAddress: 'SoDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDE',
        smartContractAddress: 'SCDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDE',
        industry: 'Agriculture/Supply Chain',
        companySize: '50-100',
        location: 'Amsterdam, Netherlands',
        totalBountiesFunded: new Prisma.Decimal('88.500000000'), // SOL
        totalBountiesPaid: new Prisma.Decimal('52.300000000'), // SOL
        activeBounties: 1,
        resolvedVulnerabilities: 6,
        reputation: 76.2,
        isVerified: false,
        isActive: true,
      },
    }),
  ]);

  const [
    techCorp, 
    fintechSolutions, 
    chainGuard, 
    quantumApps, 
    secureLedger,
    nftMarketplacePro,
    defiProtocolLabs,
    cloudSecureInc,
    gameFiStudios,
    healthTechInnovations,
    eduChain,
    metaVerseBuilders,
    agroTechSolutions
  ] = createdCompanies;
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
    // New company members for new companies
    prisma.companyMember.create({
      data: {
        userId: james.id,
        companyId: nftMarketplacePro.id,
        role: 'COMPANY_ADMIN',
        canCreateBounty: true,
        canReviewBounty: true,
        canApprovePayment: true,
        canManageMembers: true,
        invitedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        joinedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.companyMember.create({
      data: {
        userId: lisa.id,
        companyId: defiProtocolLabs.id,
        role: 'COMPANY_ADMIN',
        canCreateBounty: true,
        canReviewBounty: true,
        canApprovePayment: true,
        canManageMembers: true,
        invitedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        joinedAt: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.companyMember.create({
      data: {
        userId: david.id,
        companyId: cloudSecureInc.id,
        role: 'COMPANY_ADMIN',
        canCreateBounty: true,
        canReviewBounty: true,
        canApprovePayment: true,
        canManageMembers: true,
        invitedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        joinedAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.companyMember.create({
      data: {
        userId: sophia.id,
        companyId: gameFiStudios.id,
        role: 'COMPANY_ADMIN',
        canCreateBounty: true,
        canReviewBounty: true,
        canApprovePayment: true,
        canManageMembers: true,
        invitedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        joinedAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.companyMember.create({
      data: {
        userId: rachel.id,
        companyId: healthTechInnovations.id,
        role: 'COMPANY_ADMIN',
        canCreateBounty: true,
        canReviewBounty: true,
        canApprovePayment: true,
        canManageMembers: true,
        invitedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
        joinedAt: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000),
      },
    }),
    // Add some cross-company relationships for realism
    prisma.companyMember.create({
      data: {
        userId: charlie.id,
        companyId: gameFiStudios.id,
        role: 'COMPANY_ADMIN',
        canCreateBounty: false,
        canReviewBounty: true,
        canApprovePayment: false,
        canManageMembers: false,
        invitedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        joinedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.companyMember.create({
      data: {
        userId: alice.id,
        companyId: cloudSecureInc.id,
        role: 'COMPANY_ADMIN',
        canCreateBounty: false,
        canReviewBounty: true,
        canApprovePayment: false,
        canManageMembers: false,
        invitedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        joinedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
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
  console.log(`   Projects: ${createdProjects.length}`);
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
  console.log('   Bounty Hunters:');
  console.log('   - alice.hunter@example.com');
  console.log('   - bob.security@example.com');
  console.log('   - charlie.pentest@example.com');
  console.log('   - dana.mobile@example.com');
  console.log('\n   Company Admins:');
  console.log('   - sarah.ceo@techcorp.com');
  console.log('   - mike.security@fintech.com');
  console.log('   - olivia.ops@chainguard.io');
  console.log('   - james.nft@nftmarketplace.io');
  console.log('   - lisa.defi@defiprotocol.finance');
  console.log('   - david.cloud@cloudsecure.com');
  console.log('   - sophia.game@gamefistudios.gg');
  console.log('   - rachel.health@healthtech.com');
  console.log('\n   Platform Admin:');
  console.log('   - ethan.root@vulnera.dev');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
