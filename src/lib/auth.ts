import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins"
import { prisma } from "./db";
import { env } from "./env";
import { resend } from "./resend";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,

    }
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const { data, error } = await resend.emails.send({
          from: 'MINDMATE <onboarding@resend.dev>',
          to: [email],
          subject: 'MINDMATE - Verify your email',
          html:`<p>Your OTP is <strong>${otp}</strong></p>`
        });
      },
    })
  ]
});

