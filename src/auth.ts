import { getCloudflareContext } from "@opennextjs/cloudflare";
import NextAuth from "next-auth";
import Auth0Provider from "next-auth/providers/auth0";

if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET is not set");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH_CLIENT_ID!,
      clientSecret: process.env.AUTH_CLIENT_SECRET!,
      issuer: process.env.AUTH_ISSUER!,
    }),
  ],
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  callbacks: {
    jwt({ token }) {
      return token;
    },
    async session({ session }) {
      return session;
    },
    async signIn({ user }) {
      console.log("Sign in", user);
      const { env } = getCloudflareContext();
      await env.DB.prepare(
        `INSERT INTO users (auth_id, name, email, image)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (auth_id) 
         DO UPDATE SET name = ?, email = ?, image = ?, updated_at = CURRENT_TIMESTAMP`
      )
        .bind(
          user.id,
          user.name,
          user.email,
          user.image,
          user.name,
          user.email,
          user.image
        )
        .run();
      return true;
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
    };
  }
}
