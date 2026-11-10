import type { Metadata } from 'next';
import { SignIn } from '@clerk/nextjs';

// A entrada do admin não tem por que aparecer no Google.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <SignIn path="/login" routing="path" forceRedirectUrl="/admin" />
    </div>
  );
}
