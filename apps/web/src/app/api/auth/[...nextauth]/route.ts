import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Admin",
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        if (!creds) return null;

        const okEmail = creds.email === process.env.ADMIN_EMAIL;

        const plain = process.env.ADMIN_PASS_PLAIN || "";
        const hash  = process.env.ADMIN_PASS_HASH  || "";

        let okPass = false;
        if (plain) {
          okPass = creds.password === plain;
        } else if (hash) {
          okPass = await bcrypt.compare(creds.password, hash);
        }

        // console.log({ okEmail, okPass, mode: plain ? "PLAIN" : hash ? "HASH" : "NONE" });

        return okEmail && okPass
          ? { id: "admin", name: "Jucelino", email: creds.email }
          : null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
