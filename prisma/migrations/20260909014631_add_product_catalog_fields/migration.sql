/*
  Warnings:

  - A unique constraint covering the columns `[sku]` on the table `products` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "category" VARCHAR(80),
ADD COLUMN     "imageUrl" VARCHAR(255),
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rating" DECIMAL(3,2),
ADD COLUMN     "reviewsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sku" VARCHAR(80),
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "public"."user_addresses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "street" VARCHAR(255) NOT NULL,
    "city" VARCHAR(120) NOT NULL,
    "state" VARCHAR(120) NOT NULL,
    "postal_code" VARCHAR(40) NOT NULL,
    "country" VARCHAR(120) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_addresses_user_id_idx" ON "public"."user_addresses"("user_id");

-- CreateIndex
CREATE INDEX "user_addresses_user_id_is_default_idx" ON "public"."user_addresses"("user_id", "is_default");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "public"."products"("sku");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "public"."products"("category");

-- AddForeignKey
ALTER TABLE "public"."user_addresses" ADD CONSTRAINT "user_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
