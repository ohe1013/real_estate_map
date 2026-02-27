import { NextResponse } from "next/server";
import { auth } from "@/auth";

function hasValidName(name: unknown) {
  return typeof name === "string" && name.trim().length > 0;
}

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = Boolean(req.auth);
  const pathname = nextUrl.pathname;

  const isSignInPage = pathname === "/auth/signin";
  const isSignUpPage = pathname === "/auth/signup";
  const isCompleteProfilePage = pathname === "/auth/complete-profile";

  if (isAuthenticated && (isSignInPage || isSignUpPage)) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (!isAuthenticated && isCompleteProfilePage) {
    const signInUrl = new URL("/auth/signin", nextUrl);
    signInUrl.searchParams.set("callbackUrl", "/auth/complete-profile");
    return NextResponse.redirect(signInUrl);
  }

  if (
    isAuthenticated &&
    isCompleteProfilePage &&
    hasValidName(req.auth?.user?.name)
  ) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/auth/signin", "/auth/signup", "/auth/complete-profile"],
};
