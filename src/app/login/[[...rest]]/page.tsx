import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <SignIn path="/login" routing="path" forceRedirectUrl="/admin" />
    </div>
  );
}
