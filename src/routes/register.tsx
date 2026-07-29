import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle } from "@/services/auth";
export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "สมัครสมาชิก — Travel" },
      { name: "description", content: "สมัครสมาชิกเพื่อเริ่มวางแผนการเดินทางของคุณ" },
      { property: "og:title", content: "สมัครสมาชิก — Travel" },
      { property: "og:description", content: "สมัครสมาชิกเพื่อเริ่มวางแผนการเดินทางของคุณ" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: เชื่อมต่อระบบยืนยันตัวตนจริงเมื่อเปิดใช้งาน Lovable Cloud
    if (password !== confirmPassword) {
      console.error("รหัสผ่านไม่ตรงกัน");
      return;
    }
    console.log("register", { name, email, password });
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
            เริ่มต้นการเดินทาง
            <br />
            <span className="bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              ของคุณวันนี้
            </span>
          </h1>
          <p className="mx-auto max-w-md text-base text-muted-foreground lg:mx-0">
            สมัครสมาชิกฟรีเพื่อวางแผนทริป บันทึกสถานที่โปรด และแชร์ประสบการณ์เดินทางกับเพื่อนๆ
          </p>
        </section>

        <Card className="border-border/60 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">สมัครสมาชิก</CardTitle>
            <CardDescription>กรอกข้อมูลเพื่อสร้างบัญชีใหม่</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อ</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="ชื่อของคุณ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
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
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">ยืนยันรหัสผ่าน</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <UserPlus className="h-4 w-4" />
                สมัครสมาชิก
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
                มีบัญชีอยู่แล้ว?{" "}
                <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
                  เข้าสู่ระบบ
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
