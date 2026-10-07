import { prisma } from "@/lib/prisma";

export async function createNotification({
  type,
  title,
  message,
  link = null,
  userId = null,
}) {
  try {
    return await prisma.notification.create({
      data: {
        type,
        title,
        message,
        link,
        userId,
      },
    });
  } catch (error) {
    console.error("CREATE NOTIFICATION ERROR:", error);
    return null;
  }
}
