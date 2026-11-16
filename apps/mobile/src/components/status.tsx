import {
  ORDER_STATUS_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  type OrderStatus,
  type SubscriptionStatus,
} from "@patipaket/shared";
import { router } from "expo-router";
import { View } from "react-native";
import { useAuth } from "@/lib/auth";
import { Badge, Button, EmptyState, Screen, type BadgeTone, type IconName } from "./ui";

const ORDER_TONES: Record<OrderStatus, BadgeTone> = {
  pending: "warn",
  paid: "brand",
  preparing: "brand",
  shipped: "accent",
  delivered: "muted",
  cancelled: "muted",
  payment_failed: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge label={ORDER_STATUS_LABELS[status]} tone={ORDER_TONES[status]} />;
}

const SUBSCRIPTION_TONES: Record<SubscriptionStatus, BadgeTone> = {
  active: "brand",
  paused: "warn",
  cancelled: "muted",
};

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  return <Badge label={SUBSCRIPTION_STATUS_LABELS[status]} tone={SUBSCRIPTION_TONES[status]} />;
}

/** Giriş gerektiren ekranlarda, oturum yoksa gösterilen davet. */
export function SignInPrompt({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <Screen>
      <EmptyState
        icon={icon}
        title={title}
        text={text}
        action={
          <View style={{ alignSelf: "stretch" }}>
            <Button title="Giriş yap veya hesap oluştur" icon="person" onPress={() => router.push("/giris")} />
          </View>
        }
      />
    </Screen>
  );
}

export function useSignedIn(): boolean {
  return useAuth((state) => state.token !== null);
}
