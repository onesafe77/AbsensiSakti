import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Hexagon, ArrowLeft } from "lucide-react";
import { ParticleBackground } from "@/components/ui/particle-background";

const loginFormSchema = z.object({
  nik: z.string().min(1, "NIK wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

const resetPasswordSchema = z.object({
  nik: z.string().min(1, "NIK wajib diisi"),
  oldPassword: z.string().min(1, "Password lama wajib diisi"),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password baru dan konfirmasi tidak cocok",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginFormSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'login' | 'reset'>('login');

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { nik: "", password: "" },
  });

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { nik: "", oldPassword: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setLocation("/workspace");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  async function onLoginSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      await login(data.nik, data.password);
      toast({ title: "Login Berhasil", description: "Selamat datang kembali!" });
      setIsLoading(false);
    } catch (error) {
      toast({ title: "Login Gagal", description: error instanceof Error ? error.message : "NIK atau password salah", variant: "destructive" });
      setIsLoading(false);
    }
  }

  async function onResetSubmit(data: ResetPasswordFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(await response.text() || "Reset password gagal");

      toast({ title: "Password Berhasil Direset", description: "Silakan login dengan password baru Anda" });
      resetForm.reset();
      setMode('login');
      setIsLoading(false);
    } catch (error) {
      toast({ title: "Reset Password Gagal", description: error instanceof Error ? error.message : "Terjadi kesalahan", variant: "destructive" });
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative bg-slate-50 overflow-hidden font-sans selection:bg-red-100">

      {/* Background Layer 1: Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100 -z-20"></div>

      {/* Background Layer 2: Moving Particles */}
      <ParticleBackground variant="login" />

      {/* Main Glassmorphism Card */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-[32px] shadow-2xl overflow-hidden relative z-10 border border-white/50 ring-1 ring-slate-900/5 transition-all duration-500 hover:shadow-red-900/5">

        <div className="p-8 sm:p-10 relative">

          {/* Logo Section */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 ring-1 ring-slate-50 mb-4 transform transition-transform hover:scale-105 duration-300">
              <Hexagon className="w-10 h-10 text-red-600 fill-red-600/5" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">OneTalent</h1>
            <p className="text-sm text-slate-500 font-medium">Portal K3 & Produktivitas</p>
          </div>

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-slate-900">Selamat Datang</h2>
                <p className="text-slate-500 text-sm mt-1">Masuk untuk mengakses workspace anda</p>
              </div>

              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                  <FormField
                    control={loginForm.control}
                    name="nik"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">NIK</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="NIK Karyawan" disabled={isLoading} className="h-12 bg-white/60 border-slate-200 focus:border-red-500 focus:ring-red-500/20 rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input {...field} type={showPassword ? "text" : "password"} placeholder="Password" disabled={isLoading} className="h-12 bg-white/60 border-slate-200 focus:border-red-500 focus:ring-red-500/20 rounded-xl pr-10" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isLoading} className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Masuk Workspace"}
                  </Button>

                  <div className="text-center pt-2">
                    <button type="button" onClick={() => setMode('reset')} className="text-sm text-slate-500 hover:text-red-600 transition-colors font-medium">Lupa Password?</button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* MODE: RESET */}
          {mode === 'reset' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Reset Password</h2>
                <p className="text-slate-500 text-sm mt-1">Verifikasi identitas anda</p>
              </div>

              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                  <FormField
                    control={resetForm.control}
                    name="nik"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormControl>
                          <Input {...field} placeholder="NIK" className="h-11 bg-white/60 rounded-xl border-slate-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={resetForm.control}
                    name="oldPassword"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormControl>
                          <Input {...field} type="password" placeholder="Password Lama" className="h-11 bg-white/60 rounded-xl border-slate-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={resetForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormControl>
                            <Input {...field} type="password" placeholder="Pass Baru" className="h-11 bg-white/60 rounded-xl border-slate-200" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={resetForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormControl>
                            <Input {...field} type="password" placeholder="Konfirmasi" className="h-11 bg-white/60 rounded-xl border-slate-200" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-md">
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Reset Sekarang"}
                  </Button>

                  <div className="text-center">
                    <button type="button" onClick={() => setMode('login')} className="flex items-center justify-center w-full text-sm text-slate-500 hover:text-slate-900 gap-2">
                      <ArrowLeft className="w-4 h-4" /> Kembali
                    </button>
                  </div>
                </form>
              </Form>
            </div>
          )}

        </div>

        {/* Footer inside card */}
        <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} PT. Goden Energi Cemerlang Lestari</p>
        </div>
      </div>
    </div>
  );
}
