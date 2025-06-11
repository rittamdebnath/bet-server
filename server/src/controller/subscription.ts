import { Elysia } from "elysia";
import { SubscriptionService } from "../service/subscription";
import { auth } from "../lib/auth";

export const subscriptionController = new Elysia({
  prefix: "/api/subscription",
})
  .get("/status", async ({ request }) => {
    try {
      // Get user from session
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session?.user) {
        return {
          success: false,
          error: "Unauthorized",
        };
      }

      let subscription = await SubscriptionService.getUserSubscription(
        session.user.id
      );

      // Create default basic subscription if none exists
      if (!subscription) {
        subscription = await SubscriptionService.createDefaultSubscription(
          session.user.id
        );
      }

      return {
        success: true,
        data: subscription,
      };
    } catch (error) {
      console.error("Error getting subscription:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  })
  .post("/upgrade", async ({ request }) => {
    try {
      // Get user from session
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session?.user) {
        return {
          success: false,
          error: "Unauthorized",
        };
      }

      console.log("💳 Upgrading subscription to Pro:", {
        userId: session.user.id,
        userEmail: session.user.email,
      });

      // This is a mock upgrade - in real app you'd integrate with payment processor
      const subscription = await SubscriptionService.upgradeToPro(
        session.user.id
      );

      console.log("✅ Subscription upgraded successfully:", {
        userId: session.user.id,
        plan: subscription.plan,
      });

      return {
        success: true,
        data: subscription,
        message: "Successfully upgraded to Pro plan!",
      };
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  })
  .post("/downgrade", async ({ request }) => {
    try {
      // Get user from session
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session?.user) {
        return {
          success: false,
          error: "Unauthorized",
        };
      }

      console.log("📉 Downgrading subscription to Basic:", {
        userId: session.user.id,
        userEmail: session.user.email,
      });

      const subscription = await SubscriptionService.downgradeToBasic(
        session.user.id
      );

      if (!subscription) {
        return {
          success: false,
          error: "Subscription not found",
        };
      }

      console.log("✅ Subscription downgraded successfully:", {
        userId: session.user.id,
        plan: subscription.plan,
      });

      return {
        success: true,
        data: subscription,
        message: "Successfully downgraded to Basic plan",
      };
    } catch (error) {
      console.error("Error downgrading subscription:", error);
      return {
        success: false,
        error: "Internal server error",
      };
    }
  });
