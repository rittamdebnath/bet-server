import {
  Body,
  Container,
  Html,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export default function OTPEmail({ otp }: { otp: number | string }) {
  return (
    <Html>
      <Tailwind>
        <Body
          className="font-sans bg-white"
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          <Container
            className="w-full max-w-md mx-auto p-6"
            style={{
              width: "100%",
              maxWidth: "400px",
              margin: "0 auto",
              padding: "24px",
            }}
          >
            <Section
              className="text-center w-full bg-gray-50 px-6 py-8"
              style={{
                textAlign: "center",
                width: "100%",
                backgroundColor: "#f9fafb",
                padding: "24px",
              }}
            >
              <Text
                className="text-xs font-medium"
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#8b5cf6",
                  margin: "0 0 8px 0",
                }}
              >
                Verify your Email Address
              </Text>
              <Text
                className="text-gray-500 my-0"
                style={{ color: "#6b7280", margin: "0 0 16px 0" }}
              >
                Use the following code to verify your email address
              </Text>
              <Text
                className="text-5xl font-bold"
                style={{
                  fontSize: "36px",
                  fontWeight: "700",
                  margin: "8px 0",
                  color: "#111827",
                }}
              >
                {otp}
              </Text>
              <Text
                className="text-gray-400 font-light text-xs"
                style={{
                  fontSize: "12px",
                  fontWeight: "300",
                  color: "#9ca3af",
                  margin: "16px 0",
                }}
              >
                This code is valid for 10 minutes
              </Text>
              <Text
                className="text-gray-600 text-xs"
                style={{ fontSize: "12px", color: "#4b5563", margin: "0" }}
              >
                Thank you joining us
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

OTPEmail.PreviewProps = {
  otp: 123456,
};
