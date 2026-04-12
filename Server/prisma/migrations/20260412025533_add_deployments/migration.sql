-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "prNumber" INTEGER,
    "branch" TEXT,
    "cause" TEXT,
    "fix" TEXT,
    "rawLogs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeploymentFix" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commitSha" TEXT,
    "diff" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeploymentFix_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeploymentFix" ADD CONSTRAINT "DeploymentFix_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "Deployment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
