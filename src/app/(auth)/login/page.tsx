import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { LoginForm } from "./_components/loginForm";
import { redirect } from "next/navigation";

export default async function LoginPage() {

    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (session) {
        return redirect('/select_roles')
    }
    return (
        <LoginForm />
    )
}
