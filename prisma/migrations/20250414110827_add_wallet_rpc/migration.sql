-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "rpcUrlId" TEXT,
    CONSTRAINT "Wallet_rpcUrlId_fkey" FOREIGN KEY ("rpcUrlId") REFERENCES "RpcUrl" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Wallet" ("address", "createdAt", "id", "privateKey", "updatedAt") SELECT "address", "createdAt", "id", "privateKey", "updatedAt" FROM "Wallet";
DROP TABLE "Wallet";
ALTER TABLE "new_Wallet" RENAME TO "Wallet";
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
