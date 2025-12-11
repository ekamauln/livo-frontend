import { LoginForm } from "@/components/forms/login-form";
import { GuestRoute } from "@/contexts/guest-route";
// import { Snowy } from "@/components/modules/snowy";

export default function LoginPage() {
  return (
    <GuestRoute>
      {/* <div className="bg-background flex min-h-svh flex-col items-center justify-center p-10 relative"> */}
      <div className="bg-background flex min-h-svh flex-col items-center justify-center p-10">
        {/* <Snowy /> */}
        {/* <div className="w-full max-w-3xl relative z-10"> */}
        <div className="w-full max-w-3xl">
          <LoginForm />
        </div>
        {/* </div> */}
      </div>
      {/* </div> */}
    </GuestRoute>
  );
}
