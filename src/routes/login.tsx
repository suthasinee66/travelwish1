import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane } from "lucide-react";
import { signIn, signInWithGoogle } from "@/services/auth";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ — Travel" },
      { name: "description", content: "เข้าสู่ระบบเพื่อเริ่มวางแผนการเดินทางของคุณ" },
      { property: "og:title", content: "เข้าสู่ระบบ — Travel" },
      { property: "og:description", content: "เข้าสู่ระบบเพื่อเริ่มวางแผนการเดินทางของคุณ" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Login ไม่สำเร็จ: " + error.message);
      return;
    }

    if (data.user) {
      navigate({ to: "/home" });
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-100 via-background to-emerald-50 px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-sky-300/40 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-emerald-300/40 blur-3xl" />
      </div>

      <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-2 lg:items-center">
        <section className="space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur">
            <Plane className="h-4 w-4" />
            Travel Planner
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            ออกเดินทางครั้งต่อไป
            <br />
            <span className="bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              เริ่มต้นที่นี่
            </span>
          </h1>
          <p className="mx-auto max-w-md text-base text-muted-foreground lg:mx-0">
            เข้าสู่ระบบเพื่อวางแผนทริป จองที่พัก และเก็บความทรงจำการเดินทางของคุณไว้ในที่เดียว
          </p>
        </section>

        <Card className="border-border/60 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">เข้าสู่ระบบ</CardTitle>
            <CardDescription>กรอกอีเมลและรหัสผ่านของคุณเพื่อเริ่มต้น</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">รหัสผ่าน</Label>
                  <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
                    ลืมรหัสผ่าน?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" >
                เข้าสู่ระบบ
                
              </Button>
              <Button
  type="button"
  variant="outline"
  className="w-full mt-2"
  onClick={async () => {
    await signInWithGoogle();
  }}
>
  เข้าสู่ระบบด้วย Google
</Button>
              <p className="text-center text-sm text-muted-foreground">
                ยังไม่มีบัญชี?{" "}
                <Link to="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
                  สมัครสมาชิก
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
