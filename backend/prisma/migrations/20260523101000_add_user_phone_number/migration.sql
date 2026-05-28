ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_phoneNumber_key" ON "User"("phoneNumber");
