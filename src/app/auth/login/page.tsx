"use client"

import { Suspense } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { loginSchema, type LoginInput } from "@/lib/types"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailFromQuery = searchParams.get("email") ?? ""
  const callbackUrl = searchParams.get("callbackUrl") ?? undefined
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultValues = useMemo(
    () => ({
      email: emailFromQuery,
      password: "",
    }),
    [emailFromQuery],
  )

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset({ email: emailFromQuery, password: "" })
  }, [emailFromQuery, form])

  const handleSubmit = useCallback(
    async (values: LoginInput) => {
      try {
        setIsSubmitting(true)
        const result = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
          callbackUrl,
        })

        if (result?.error) {
          const message =
            result.error === "CredentialsSignin"
              ? "Invalid email or password."
              : result.error
          toast.error(message)
          return
        }

        const profileResponse = await fetch("/api/auth/me", {
          cache: "no-store",
        })

        let nextUrl = callbackUrl ?? "/dashboard/hunter"
        if (profileResponse.ok) {
          const data = await profileResponse.json()
          const role = data?.user?.role as
            | "BOUNTY_HUNTER"
            | "COMPANY_ADMIN"
            | "ADMIN"
            | undefined
          if (!callbackUrl) {
            if (role === "ADMIN") {
              nextUrl = "/admin"
            } else if (role === "COMPANY_ADMIN") {
              nextUrl = "/dashboard/company"
            }
          }
        }

        toast.success("Welcome back to Vulnera.")
        router.replace(nextUrl)
        router.refresh()
      } catch (error) {
        console.error("Login submit error", error)
        toast.error("We could not sign you in. Please try again.")
      } finally {
        setIsSubmitting(false)
      }
    },
    [callbackUrl, router],
  )

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6">
        <span className="badge-dark inline-flex w-fit items-center gap-2 rounded-full border border-yellow-400/20 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
          Platform Access
        </span>
        <div className="space-y-4">
          <h1 className="text-4xl font-serif sm:text-5xl">Sign in to Vulnera</h1>
          <p className="max-w-xl text-muted-foreground">
            Manage your programs, review submissions, and keep payouts flowing with a secure dashboard experience designed for both bounty hunters and companies.
          </p>
        </div>
        <ul className="grid gap-3 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Check className="size-4 text-primary" /> Access personalized hunter or company dashboards.
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-primary" /> Track submissions, payments, and AI analysis in real time.
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-primary" /> Connect your Solana wallet to streamline payouts.
          </li>
        </ul>
      </section>

      <Card className="border border-border/60 bg-card/80 shadow-lg backdrop-blur hover:border-yellow-400/20 transition-colors">
        <CardHeader className="space-y-1">
          <CardTitle className="font-serif text-2xl font-medium">Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to continue to your Vulnera workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input inputMode="email" placeholder="you@example.com" type="email" className="focus:border-yellow-400/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your password" type="password" className="focus:border-yellow-400/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Need an account?{' '}
                  <Link className="text-primary underline-offset-4 hover:underline" href="/auth/register">
                    Register instead
                  </Link>
                </span>
                <Link className="text-primary underline-offset-4 hover:underline" href="/auth/forgot-password">
                  Forgot password?
                </Link>
              </div>

              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-3">
          <p className="text-center text-xs text-muted-foreground">
            Use the wallet controls in the header to connect your Solana wallet for seamless payouts.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}