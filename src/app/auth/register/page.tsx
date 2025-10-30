"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { PublicKey } from "@solana/web3.js"
import { registerSchema, type RegisterInput } from "@/lib/types"
import { useAuthFlowStore } from "@/stores/auth-flow-store"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSolana } from "@/components/solana/use-solana"
import { Check, Loader2, Wallet } from "lucide-react"

const roleOptions: Array<{ label: string; value: RegisterInput["role"]; description: string }> = [
  {
    label: "Bounty Hunter",
    value: "BOUNTY_HUNTER",
    description: "Find vulnerabilities, submit detailed reports, and earn rewards.",
  },
  {
    label: "Company Admin",
    value: "COMPANY_ADMIN",
    description: "Launch programs, review submissions, and handle secure payouts.",
  },
]

export default function RegisterPage() {
  const router = useRouter()
  const { account } = useSolana()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const setPendingVerification = useAuthFlowStore((state) => state.setPendingVerification)
  const startResendCooldown = useAuthFlowStore((state) => state.startResendCooldown)
  const clearResendCooldown = useAuthFlowStore((state) => state.clearResendCooldown)

  const defaultValues = useMemo<RegisterInput>(
    () => ({
      email: "",
      username: "",
      password: "",
      role: "BOUNTY_HUNTER",
      walletAddress: "",
    }),
    [],
  )

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues,
  })

  useEffect(() => {
    clearResendCooldown()
  }, [clearResendCooldown])

  useEffect(() => {
    if (!account?.address) {
      return
    }

    const current = form.getValues("walletAddress")
    if (!current) {
      form.setValue("walletAddress", account.address, {
        shouldDirty: false,
        shouldValidate: true,
      })
    }
  }, [account?.address, form])

  const handleUseWallet = useCallback(() => {
    if (!account?.address) {
      toast.info("Connect your Solana wallet using the header controls first.")
      return
    }

    form.setValue("walletAddress", account.address, {
      shouldDirty: true,
      shouldValidate: true,
    })
    toast.success("Wallet address added from your connected account.")
  }, [account?.address, form])

  const handleSubmit = useCallback(
    async (values: RegisterInput) => {
      try {
        // Validate wallet address if provided
        if (values.walletAddress && values.walletAddress.trim()) {
          try {
            new PublicKey(values.walletAddress.trim())
          } catch (error) {
            toast.error("Invalid Solana wallet address. Please check and try again.")
            return
          }
        }

        setIsSubmitting(true)
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        })

        const data = await response.json().catch(() => null)

        if (!response.ok) {
          const message =
            data?.error ??
            (Array.isArray(data?.details)
              ? data.details.map((detail: { message?: string }) => detail?.message).filter(Boolean).join(", ")
              : null) ??
            "We could not create your account. Please try again."
          toast.error(message)
          return
        }

        toast.success(
          data?.message ?? "Account created. Check your inbox for verification instructions.",
        )

        setPendingVerification({
          email: values.email,
          username: values.username,
          role: values.role,
          createdAt: Date.now(),
        })
        startResendCooldown(60)

        router.push(`/auth/verify-otp?email=${encodeURIComponent(values.email)}`)
      } catch (error) {
        console.error("Register submit error", error)
        toast.error("Something went wrong while creating your account.")
      } finally {
        setIsSubmitting(false)
      }
    },
    [router],
  )

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6">
        <span className="badge-dark inline-flex w-fit items-center gap-2 rounded-full bg-yellow-50 border border-yellow-400/20 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
          Create Account
        </span>
        <div className="space-y-4">
          <h1 className="text-4xl font-serif sm:text-5xl">Join the Vulnera network</h1>
          <p className="max-w-xl text-muted-foreground">
            Align with a community built around transparent security workflows and on-chain accountability. Choose your role to get started.
          </p>
        </div>
        <ul className="grid gap-3 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Check className="size-4 text-primary" /> End-to-end bounty lifecycle management with on-chain escrows.
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-primary" /> AI-enhanced triage to accelerate reviews and payouts.
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-primary" /> Granular dashboards tailored for both hunters and companies.
          </li>
        </ul>
      </section>

      <Card className="border border-border/60 bg-card/80 shadow-lg backdrop-blur hover:border-yellow-400/20 transition-colors">
        <CardHeader className="space-y-1">
          <CardTitle className="font-serif text-2xl font-medium">Create your Vulnera account</CardTitle>
          <CardDescription>
            Share basic details, select your role, and optionally link a Solana wallet for payouts.
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
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Choose a unique username" className="focus:border-yellow-400/50" {...field} />
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
                      <Input placeholder="Minimum 8 characters" type="password" className="focus:border-yellow-400/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full h-full">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col text-left">
                              <span className="font-medium">{option.label}</span>
                              <span className="text-muted-foreground text-xs">{option.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="walletAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet address (optional)</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input placeholder="Paste or use your connected wallet" className="focus:border-yellow-400/50" {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0"
                        onClick={handleUseWallet}
                      >
                        <Wallet className="size-4" />
                        Use connected
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-3">
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link className="text-primary underline-offset-4 hover:underline" href="/auth/login">
              Sign in instead
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            We will send a one-time verification code to confirm your email before activating your profile.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
