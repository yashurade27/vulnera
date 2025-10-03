DELETE FROM "Bounty" WHERE "companyId" IN (SELECT "companyId" FROM "CompanyMember" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'yash.urade_comp23@pccoer.in'))
