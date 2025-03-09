import { PrismaClient, LogType } from '@prisma/client';

const prisma = new PrismaClient();

export async function logMessage(message: string, jobId: number, logType: LogType): Promise<void> {
  await prisma.jobLog.create({
    data: {
      message,
      createdAt: new Date(),
      jobId,
      logType,
    },
  });
}