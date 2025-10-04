"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { verifyOtpFormSchema, type VerifyOtpFormInput } from "@/lib/types"
import { useAuthFlowHydration, useAuthFlowStore } from "@/stores/auth-flow-store"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Check, Loader2, RefreshCw } from "lucide-react"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export default function VerifyOtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailFromQuery = searchParams.get("email") ?? ""
  const isHydrated = useAuthFlowHydration()
  const pendingVerification = useAuthFlowStore((state) => state.pendingVerification)
  const resendCooldownEndsAt = useAuthFlowStore((state) => state.resendCooldownEndsAt)
  const clearPendingVerification = useAuthFlowStore((state) => state.clearPendingVerification)
  const startResendCooldown = useAuthFlowStore((state) => state.startResendCooldown)
  const clearResendCooldown = useAuthFlowStore((state) => state.clearResendCooldown)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [remainingCooldown, setRemainingCooldown] = useState(0)

  const defaultValues = useMemo<VerifyOtpFormInput>(
    () => ({
      otp: "",
    }),
    [],
  )

  const form = useForm<VerifyOtpFormInput>({
    resolver: zodResolver(verifyOtpFormSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset({ otp: "" })
  }, [form])

  useEffect(() => {
    if (!resendCooldownEndsAt) {
      setRemainingCooldown(0)
      return
    }

    const updateRemaining = () => {
      const diff = Math.max(0, Math.ceil((resendCooldownEndsAt - Date.now()) / 1000))
      setRemainingCooldown(diff)
      if (diff <= 0) {
        clearResendCooldown()
      }
    }

    updateRemaining()
    const timer = setInterval(updateRemaining, 500)
    return () => clearInterval(timer)
  }, [resendCooldownEndsAt, clearResendCooldown])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    if (!pendingVerification?.email && !emailFromQuery) {
      toast.error("We could not find a pending verification. Please register again.")
      router.replace("/auth/register")
    }
  }, [isHydrated, pendingVerification?.email, emailFromQuery, router])

  const email = pendingVerification?.email || emailFromQuery

  const handleSubmit = useCallback(
    async (values: VerifyOtpFormInput) => {
      if (!email) {
        toast.error("No email provided. Please go back and register again.")
        return
      }

      try {
        setIsSubmitting(true)
        // const response = await fetch("/api/auth/verify-otp", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   body: JSON.stringify({
        //     email,
        //     otp: values.otp,
        //   }),
        // });

        // const data = await response.json().catch(() => null);

        // if (!response.ok) {
        //   const message = data?.error ?? "Failed to verify OTP. Please try again.";
        //   toast.error(message);
        //   return;
        // }
        const response = { ok: true };
        const data = { message: "Email verified successfully!" };
        if (!response.ok) {
          const message = data?.error ?? "Failed to verify OTP. Please try again.";
          toast.error(message);
          return;
        }

        toast.success(data?.message ?? "Email verified successfully!")
        clearPendingVerification()
        clearResendCooldown()
        router.push(`/auth/login?email=${encodeURIComponent(email)}`)
      } catch (error) {
        console.error("OTP verification submit error", error)
        toast.error("Something went wrong while verifying your OTP.")
      } finally {
        setIsSubmitting(false)
      }
    },
    [email, clearPendingVerification, clearResendCooldown, emailFromQuery, router],
  )

  const handleResendOtp = useCallback(async () => {
    if (!email) {
      toast.error("No email provided. Please go back and register again.")
      return
    }

    try {
      setIsResending(true)
      // const response = await fetch("/api/auth/resend-otp", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ email }),
      // });

      // const data = await response.json().catch(() => null);

      // if (!response.ok) {
      //   const message = data?.error ?? "Failed to resend OTP.";
      //   toast.error(message);
      //   return;
      // }
      const response = { ok: true };
      const data = { message: "New OTP sent to your email." };
      if (!response.ok) {
        const message = data?.error ?? "Failed to resend OTP.";
        toast.error(message);
        return;
      }

      toast.success("New OTP sent to your email.")
      startResendCooldown(60)
    } catch (error) {
      toast.error("Something went wrong while resending OTP.")
    } finally {
      setIsResending(false)
    }
  }, [email, startResendCooldown])

  const isCooldownActive = remainingCooldown > 0

  return (
    <div className="grid items-center gap-45 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6">
        <span className="badge-dark inline-flex w-fit items-center gap-2 rounded-full bg-yellow-50 border border-yellow-400/20 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
          Verify Email
        </span>
        <div className="space-y-4">
          <h1 className="text-4xl font-serif sm:text-5xl">Verify your email</h1>
          <p className="max-w-xl text-muted-foreground">
            We've sent a 6-digit verification code to your email. Enter it below to activate your Vulnera account and start securing the web.
          </p>
        </div>
        <ul className="grid gap-3 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Check className="size-4 text-primary" /> Secure one-time verification code
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-primary" /> Code expires in 10 minutes
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-primary" /> Check your spam folder if you don't see it
          </li>
        </ul>
      </section>

      <Card className="border border-border/60 bg-card/80 shadow-lg backdrop-blur hover:border-yellow-400/20 transition-colors">
        <CardHeader className="space-y-1">
          <CardTitle className="font-serif text-2xl font-medium">Enter verification code</CardTitle>
          <CardDescription>
            Check your inbox for the 6-digit code we sent to <span className="font-medium text-foreground">{email || "your email"}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-center block">Verification Code</FormLabel>
                    <FormControl>
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value)
                          }}
                          className="focus-within:ring-2 focus-within:ring-yellow-400/50 focus-within:border-yellow-400/50"
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} className="border-yellow-400/30 focus:border-yellow-400 data-[active=true]:border-yellow-400 data-[active=true]:ring-yellow-400/50" />
                            <InputOTPSlot index={1} className="border-yellow-400/30 focus:border-yellow-400 data-[active=true]:border-yellow-400 data-[active=true]:ring-yellow-400/50" />
                            <InputOTPSlot index={2} className="border-yellow-400/30 focus:border-yellow-400 data-[active=true]:border-yellow-400 data-[active=true]:ring-yellow-400/50" />
                            <InputOTPSlot index={3} className="border-yellow-400/30 focus:border-yellow-400 data-[active=true]:border-yellow-400 data-[active=true]:ring-yellow-400/50" />
                            <InputOTPSlot index={4} className="border-yellow-400/30 focus:border-yellow-400 data-[active=true]:border-yellow-400 data-[active=true]:ring-yellow-400/50" />
                            <InputOTPSlot index={5} className="border-yellow-400/30 focus:border-yellow-400 data-[active=true]:border-yellow-400 data-[active=true]:ring-yellow-400/50" />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </FormControl>
                    <FormMessage className="text-center" />
                  </FormItem>
                )}
              />

              <Button
                className="w-full"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Verify & Continue"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-3">
          <p className="text-center text-sm text-muted-foreground">
            Didn't receive the code?{" "}
            <Button
              variant="link"
              className="h-auto p-0 text-primary underline-offset-4 hover:underline"
              onClick={handleResendOtp}
              disabled={isResending || isCooldownActive}
            >
              {isResending ? <RefreshCw className="mr-1 size-4 animate-spin" /> : null}
              {isCooldownActive ? `Resend in ${remainingCooldown}s` : "Resend code"}
            </Button>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Need to change your email?{" "}
            <Link className="text-primary underline-offset-4 hover:underline" href="/auth/register">
              Register again
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}