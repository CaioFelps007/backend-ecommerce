/*
  Warnings:

  - You are about to drop the column `imagePaths` on the `product` table. All the data in the column will be lost.
  - You are about to alter the column `photo` on the `product` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.

*/
-- AlterTable
ALTER TABLE `product` DROP COLUMN `imagePaths`,
    MODIFY `photo` JSON NOT NULL;
