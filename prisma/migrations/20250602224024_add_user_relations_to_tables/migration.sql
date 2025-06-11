/*
  Warnings:

  - Added the required column `userId` to the `AboutMe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Skill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `SocialLink` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AboutMe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "aboutMeCategoryId" TEXT NOT NULL,
    CONSTRAINT "AboutMe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AboutMe_aboutMeCategoryId_fkey" FOREIGN KEY ("aboutMeCategoryId") REFERENCES "AboutMeCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AboutMe" ("aboutMeCategoryId", "content", "createdAt", "description", "id", "isPublished", "name", "updatedAt") SELECT "aboutMeCategoryId", "content", "createdAt", "description", "id", "isPublished", "name", "updatedAt" FROM "AboutMe";
DROP TABLE "AboutMe";
ALTER TABLE "new_AboutMe" RENAME TO "AboutMe";
CREATE INDEX "AboutMe_userId_idx" ON "AboutMe"("userId");
CREATE INDEX "AboutMe_aboutMeCategoryId_idx" ON "AboutMe"("aboutMeCategoryId");
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "liveDemoUrl" TEXT,
    "sourceCodeUrl" TEXT,
    "comments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("comments", "createdAt", "description", "id", "isPublished", "liveDemoUrl", "sourceCodeUrl", "title", "updatedAt") SELECT "comments", "createdAt", "description", "id", "isPublished", "liveDemoUrl", "sourceCodeUrl", "title", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_title_key" ON "Project"("title");
CREATE INDEX "Project_userId_idx" ON "Project"("userId");
CREATE TABLE "new_Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "skillCategoryId" TEXT NOT NULL,
    CONSTRAINT "Skill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Skill_skillCategoryId_fkey" FOREIGN KEY ("skillCategoryId") REFERENCES "SkillCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Skill" ("createdAt", "description", "icon", "id", "isPublished", "name", "skillCategoryId", "updatedAt") SELECT "createdAt", "description", "icon", "id", "isPublished", "name", "skillCategoryId", "updatedAt" FROM "Skill";
DROP TABLE "Skill";
ALTER TABLE "new_Skill" RENAME TO "Skill";
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");
CREATE INDEX "Skill_userId_idx" ON "Skill"("userId");
CREATE INDEX "Skill_skillCategoryId_idx" ON "Skill"("skillCategoryId");
CREATE TABLE "new_SocialLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "href" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "SocialLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SocialLink" ("createdAt", "href", "icon", "id", "isPublished", "label", "text", "updatedAt") SELECT "createdAt", "href", "icon", "id", "isPublished", "label", "text", "updatedAt" FROM "SocialLink";
DROP TABLE "SocialLink";
ALTER TABLE "new_SocialLink" RENAME TO "SocialLink";
CREATE UNIQUE INDEX "SocialLink_href_key" ON "SocialLink"("href");
CREATE INDEX "SocialLink_userId_idx" ON "SocialLink"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
