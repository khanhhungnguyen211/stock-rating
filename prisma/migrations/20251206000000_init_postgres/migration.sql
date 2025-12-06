-- CreateTable
CREATE TABLE "Stock" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "eps" DOUBLE PRECISION NOT NULL,
    "pe" DOUBLE PRECISION NOT NULL,
    "roe" DOUBLE PRECISION NOT NULL,
    "growth_rate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stock_symbol_key" ON "Stock"("symbol");

