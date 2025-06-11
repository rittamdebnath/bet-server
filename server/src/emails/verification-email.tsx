import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

interface VerificationEmailProps {
	verificationLink: string;
	userName?: string;
	expiresIn?: string;
}

export const VerificationEmail = ({
	verificationLink,
	userName = "there",
	expiresIn = "24 hours",
}: VerificationEmailProps) => {
	return (
		<Html>
			<Head />
			<Preview>Verify your email address</Preview>
			<Tailwind>
				<Body className="bg-white font-sans">
					<Container className="mx-auto py-8 px-4 max-w-[600px]">
						<Section className="bg-white border border-gray-200 p-6 mb-4">
							<Heading className="text-2xl font-bold text-gray-900 mb-2">
								Email Verification
							</Heading>
							<Hr className="border-t border-gray-200 my-4" />
							<Text className="text-gray-700 text-base mb-4">
								Hello {userName},
							</Text>
							<Text className="text-gray-700 text-base mb-4">
								Thanks for signing up! Please verify your email address to
								complete your registration and access all features.
							</Text>
							<Section className="text-center my-6">
								<Button
									className="bg-violet-600 px-6 py-3 text-white font-medium"
									style={{ backgroundColor: "#7C3AED", color: "white" }}
									href={verificationLink}
								>
									Verify Email Address
								</Button>
							</Section>
							<Text className="text-gray-700 text-sm mb-4">
								Alternatively, you can copy and paste the following link into
								your browser:
							</Text>
							<Text
								className="text-xs text-violet-600 mb-4"
								style={{ color: "#7C3AED" }}
							>
								<Link
									href={verificationLink}
									className="text-violet-600"
									style={{ color: "#7C3AED" }}
								>
									{verificationLink}
								</Link>
							</Text>
							<Text className="text-gray-500 text-sm mb-4">
								This verification link will expire in {expiresIn}.
							</Text>
							<Hr className="border-t border-gray-200 my-4" />
							<Text className="text-gray-500 text-sm">
								If you didn't create an account, you can ignore this email.
							</Text>
						</Section>
						<Text className="text-gray-500 text-xs text-center">
							© {new Date().getFullYear()} Your Company. All rights reserved.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

export default VerificationEmail;

// Preview for email development
VerificationEmail.PreviewProps = {
	verificationLink: "https://example.com/verify?token=abc123def456",
	userName: "John Doe",
	expiresIn: "24 hours",
};
