-- CreateTable
CREATE TABLE "AboutMeCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AboutMe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "aboutMeCategoryId" TEXT NOT NULL,
    CONSTRAINT "AboutMe_aboutMeCategoryId_fkey" FOREIGN KEY ("aboutMeCategoryId") REFERENCES "AboutMeCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AboutMeCategory_name_key" ON "AboutMeCategory"("name");

-- CreateIndex
CREATE INDEX "AboutMe_aboutMeCategoryId_idx" ON "AboutMe"("aboutMeCategoryId");
