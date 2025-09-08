"use client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Loader, Loader2, Send } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
export function LoginForm() {

    const router = useRouter();
    const [isGooglePending, startGoogleTransition] = useTransition();
    const [isEmailPending, startEmailTransition] = useTransition();
    const [email, setEmail] = useState("");



    async function signInWithGoogle() {
        startGoogleTransition( async () => {
            await authClient.signIn.social({
            provider:'google',
            callbackURL:"/select_roles",
            fetchOptions:{
                onSuccess: () =>{
                    toast.success('Signed in with Google')
                },
                onError:(err) => {
                    toast.error(err.error.message)    
                }
            }
        })
        })
        
    }

    function signInWithEmail(){
        startEmailTransition(async () => {
            await authClient.emailOtp.sendVerificationOtp({
                email:email,
                type:'sign-in',
                fetchOptions:{
                    onSuccess: () =>{
                        toast.success('Email sent! Please check your inbox.')
                        router.push(`/verify-request?email=${email}`)
                    },
                    onError:() => {
                        toast.error('Error sending email')
                    }
                }

            })
            })
        }
    
    return(
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-black via-purple-900 to-purple-600">
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-xl">
                    Welcome 
                </CardTitle>
                <CardDescription>
                    Login with your google account 
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Button disabled={isGooglePending} onClick={signInWithGoogle} className="w-full " variant="outline">
                    
                    {isGooglePending? <Loader className="size-4 animate-spin"/> : 'Sign in with Google'}
                </Button>
                <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                    <span className="relative z-10 bg-card px-2 text-muted-foreground"> 
                        Or continue with
                    </span>
                </div>
                <div className="grid gap-3"> 
                    <div className="grid gap-2">
                        <Label htmlFor="email">
                            Email
                        </Label>
                        <Input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="alan@example.com"/>

                    </div>
                    <Button disabled={isEmailPending} onClick={signInWithEmail}>
                        {isEmailPending?(
                            <>
                            <Loader2 className="size-4 animate-spin"/>
                            <span>Loading..</span>
                            </>
                        ):
                        (
                            <>
                            <Send className="size-4"/>
                            <span>Continue with email</span>
                            </>
                        )}</Button>
                </div>
            </CardContent>
        </Card>
    </div>
    )
}