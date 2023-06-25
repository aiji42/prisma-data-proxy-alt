-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "attr" JSONB NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_id_key" ON "Product"("id");
