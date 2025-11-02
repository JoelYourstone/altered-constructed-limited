import NextAuth from "next-auth";
import Auth0Provider from "next-auth/providers/auth0";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH_CLIENT_ID!,
      clientSecret: process.env.AUTH_CLIENT_SECRET!,
      issuer: process.env.AUTH_ISSUER!,
    }),
  ],

  callbacks: {
    jwt({ token }) {
      return token;
    },
    async session({ session }) {
      return session;
    },
  },
});

declare module "next-auth" {
  interface User {
    alteredId?: string;
  }

  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      alteredId?: string | null;
    };
  }
}
