-- CreateEnum
CREATE TYPE "ThirdPartyType" AS ENUM ('CLIENT', 'SUPPLIER');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('SALE', 'PURCHASE', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdParty" (
    "id" TEXT NOT NULL,
    "type" "ThirdPartyType" NOT NULL,
    "name" TEXT NOT NULL,
    "nif" TEXT NOT NULL,
    "euVatNumber" TEXT,
    "countryCode" TEXT NOT NULL,

    CONSTRAINT "ThirdParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceOut" (
    "id" TEXT NOT NULL,
    "issueDate" DATE NOT NULL,
    "series" TEXT,
    "number" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "base" DECIMAL(18,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL,
    "vatAmount" DECIMAL(18,2) NOT NULL,
    "total" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "fxToEUR" DECIMAL(18,6) NOT NULL,
    "notes" TEXT,
    "euOperation" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "InvoiceOut_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceIn" (
    "id" TEXT NOT NULL,
    "issueDate" DATE NOT NULL,
    "supplierId" TEXT NOT NULL,
    "base" DECIMAL(18,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL,
    "vatAmount" DECIMAL(18,2) NOT NULL,
    "total" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "fxToEUR" DECIMAL(18,6) NOT NULL,
    "deductible" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "euOperation" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "InvoiceIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "LedgerType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "fxToEUR" DECIMAL(18,6) NOT NULL,
    "invoiceInId" TEXT,
    "invoiceOutId" TEXT,
    "notes" TEXT,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FxRate" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "base" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "rate" DECIMAL(18,6) NOT NULL,

    CONSTRAINT "FxRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "InvoiceOut_issueDate_idx" ON "InvoiceOut"("issueDate");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceOut_series_number_key" ON "InvoiceOut"("series", "number");

-- CreateIndex
CREATE INDEX "InvoiceIn_issueDate_idx" ON "InvoiceIn"("issueDate");

-- CreateIndex
CREATE INDEX "LedgerEntry_date_idx" ON "LedgerEntry"("date");

-- CreateIndex
CREATE INDEX "FxRate_date_idx" ON "FxRate"("date");

-- CreateIndex
CREATE INDEX "FxRate_quote_idx" ON "FxRate"("quote");

-- AddForeignKey
ALTER TABLE "InvoiceOut" ADD CONSTRAINT "InvoiceOut_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ThirdParty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceOut" ADD CONSTRAINT "InvoiceOut_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceIn" ADD CONSTRAINT "InvoiceIn_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "ThirdParty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceIn" ADD CONSTRAINT "InvoiceIn_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_invoiceInId_fkey" FOREIGN KEY ("invoiceInId") REFERENCES "InvoiceIn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_invoiceOutId_fkey" FOREIGN KEY ("invoiceOutId") REFERENCES "InvoiceOut"("id") ON DELETE SET NULL ON UPDATE CASCADE;
