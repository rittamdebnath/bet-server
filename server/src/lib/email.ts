import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");

// await resend.emails.send({
//         	from: 'ibuki@gehenna.sh',
//            	to: body,
//            	subject: 'Verify your email address',
//             html: <OTPEmail otp={otp} />,
//         })

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  await resend.emails.send({
    from: process.env.FROM_EMAIL || "noreply@yourdomain.com", // Replace with your verified domain
    to,
    subject,
    html,
  });
  return true;
};
