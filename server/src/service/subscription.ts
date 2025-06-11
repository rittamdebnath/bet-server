import { eq } from "drizzle-orm";
import { db } from "../db";
import { subscription } from "../db/schema/auth";

export interface UserSubscription {
  id: string;
  userId: string;
  plan: "basic" | "pro";
  status: "active" | "inactive" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class SubscriptionService {
  static async getUserSubscription(
    userId: string
  ): Promise<UserSubscription | null> {
    const result = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  }

  static async createDefaultSubscription(
    userId: string
  ): Promise<UserSubscription> {
    const now = new Date();
    const newSubscription = {
      id: crypto.randomUUID(),
      userId,
      plan: "basic" as const,
      status: "active" as const,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(subscription).values(newSubscription);
    return newSubscription;
  }

  static async upgradeToPro(userId: string): Promise<UserSubscription> {
    const now = new Date();
    const existingSubscription = await this.getUserSubscription(userId);

    if (!existingSubscription) {
      // Create new pro subscription if none exists
      const newSubscription = {
        id: crypto.randomUUID(),
        userId,
        plan: "pro" as const,
        status: "active" as const,
        createdAt: now,
        updatedAt: now,
      };
      await db.insert(subscription).values(newSubscription);
      return newSubscription;
    }
    // Update existing subscription to pro
    const updatedSubscription = {
      ...existingSubscription,
      plan: "pro" as const,
      updatedAt: now,
    };
    await db
      .update(subscription)
      .set({ plan: "pro", updatedAt: now })
      .where(eq(subscription.userId, userId));
    return updatedSubscription;
  }

  static async downgradeToBasic(
    userId: string
  ): Promise<UserSubscription | null> {
    const now = new Date();
    const existingSubscription = await this.getUserSubscription(userId);

    if (!existingSubscription) {
      return null;
    }

    const updatedSubscription = {
      ...existingSubscription,
      plan: "basic" as const,
      updatedAt: now,
    };

    await db
      .update(subscription)
      .set({ plan: "basic", updatedAt: now })
      .where(eq(subscription.userId, userId));

    return updatedSubscription;
  }

  static async canCreateOrganizations(userId: string): Promise<boolean> {
    const userSubscription = await this.getUserSubscription(userId);
    console.log("User subscription:", userSubscription);
    return (
      userSubscription?.plan === "pro" && userSubscription?.status === "active"
    );
  }
}
