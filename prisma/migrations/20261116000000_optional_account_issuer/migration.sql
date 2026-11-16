-- Better Auth 1.7.3+ no longer writes account.issuer. Keep the column so
-- existing rows stay readable, and key new accounts on provider + account id.
ALTER TABLE "account" ALTER COLUMN "issuer" DROP NOT NULL;

CREATE UNIQUE INDEX "account_providerId_accountId_uidx" ON "account"("providerId", "accountId");
