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
import { Loader2, Eye, EyeOff, QrCode, ArrowLeft } from "lucide-react";
import geclLogo from "@assets/gecl-logo.jpeg";
import bgImage from "@assets/Picture1_1765606128281.jpg";

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
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'toReset' | 'toLogin' | null>(null);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      nik: "",
      password: "",
    },
  });

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      nik: "",
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
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
      toast({
        title: "Login Berhasil",
        description: "Selamat datang kembali!",
      });
      setIsLoading(false);
    } catch (error) {
      toast({
        title: "Login Gagal",
        description: error instanceof Error ? error.message : "NIK atau password salah",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }

  async function onResetSubmit(data: ResetPasswordFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nik: data.nik,
          oldPassword: data.oldPassword,
          newPassword: data.newPassword,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Reset password gagal");
      }

      toast({
        title: "Password Berhasil Direset",
        description: "Silakan login dengan password baru Anda",
      });

      resetForm.reset();
      switchToLogin();
      setIsLoading(false);
    } catch (error) {
      toast({
        title: "Reset Password Gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }

  function switchToReset() {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimationDirection('toReset');
    resetForm.reset();
    setTimeout(() => {
      setMode('reset');
      setIsAnimating(false);
      setAnimationDirection(null);
    }, 500);
  }

  function switchToLogin() {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimationDirection('toLogin');
    loginForm.reset();
    setTimeout(() => {
      setMode('login');
      setIsAnimating(false);
      setAnimationDirection(null);
    }, 500);
  }

  const getLoginAnimation = () => {
    if (mode === 'login' && !isAnimating) return 'none';
    if (animationDirection === 'toReset') return 'slideOutToLeft 0.5s ease-in-out forwards';
    if (animationDirection === 'toLogin') return 'slideInFromLeft 0.5s ease-in-out forwards';
    return 'none';
  };

  const getResetAnimation = () => {
    if (mode === 'reset' && !isAnimating) return 'none';
    if (animationDirection === 'toReset') return 'slideInFromRight 0.5s ease-in-out forwards';
    if (animationDirection === 'toLogin') return 'slideOutToRight 0.5s ease-in-out forwards';
    return 'none';
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-4 relative bg-gradient-to-br from-gray-50 via-red-50 to-rose-50 lg:bg-gradient-to-br lg:from-gray-50 lg:via-red-50 lg:to-rose-50">
      {/* Mobile Background Image */}
      <div
        className="absolute inset-0 lg:hidden"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      {/* Overlay for better readability on mobile */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-600/50 via-red-500/40 to-red-700/50 lg:hidden" />
      <div className="w-full max-w-5xl max-h-[95vh] bg-white/95 backdrop-blur-sm lg:bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-y-auto lg:overflow-hidden relative z-10">
        <div className="grid lg:grid-cols-2">
          {/* Left Panel - Animated Forms */}
          <div className="p-5 sm:p-8 lg:p-12 flex flex-col justify-center relative">
            {/* GECL Logo */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={geclLogo}
                  alt="GECL Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Forms Container - Both forms absolutely positioned for overlapping animations */}
            <div className="relative min-h-[480px] sm:min-h-[500px]">
              {/* Login Form - Always in DOM */}
              <div
                className="w-full absolute top-0 left-0 right-0"
                style={{
                  animation: getLoginAnimation(),
                  opacity: !isAnimating ? (mode === 'login' ? 1 : 0) : undefined,
                  transform: !isAnimating ? 'translateX(0)' : undefined,
                  pointerEvents: mode === 'login' && !isAnimating ? 'auto' : 'none',
                  zIndex: mode === 'login' ? 2 : 1,
                }}
              >
                <div className="text-center mb-5 sm:mb-8">
                  <p className="font-semibold mb-1 lg:hidden text-[#111827] text-[25px]">Selamat Datang di OneTalent</p>
                  <h1 className="sm:text-3xl font-bold text-gray-900 mb-2 text-[22px]">
                    Masuk
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Masukkan NIK dan password untuk melanjutkan
                  </p>
                </div>

                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 sm:space-y-5">
                    <FormField
                      control={loginForm.control}
                      name="nik"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            NIK
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Masukkan NIK Anda"
                              disabled={isLoading}
                              className="h-11 sm:h-12 text-sm sm:text-base border-gray-300 rounded-lg focus:border-red-500 focus:ring-red-500 bg-white"
                              data-testid="input-nik"
                            />
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
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Masukkan password Anda"
                                disabled={isLoading}
                                className="h-11 sm:h-12 text-sm sm:text-base border-gray-300 rounded-lg focus:border-red-500 focus:ring-red-500 pr-12 bg-white"
                                data-testid="input-password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
                                disabled={isLoading}
                                data-testid="button-toggle-password"
                              >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                      data-testid="button-login"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        "Masuk"
                      )}
                    </Button>

                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={switchToReset}
                        disabled={isAnimating}
                        className="text-sm text-red-600 hover:text-red-700 font-medium hover:underline transition-colors disabled:opacity-50"
                        data-testid="link-forgot-password"
                      >
                        Lupa Password?
                      </button>
                    </div>
                  </form>
                </Form>
              </div>

              {/* Reset Password Form - Always in DOM */}
              <div
                className="w-full absolute top-0 left-0 right-0"
                style={{
                  animation: getResetAnimation(),
                  opacity: !isAnimating ? (mode === 'reset' ? 1 : 0) : undefined,
                  transform: !isAnimating ? 'translateX(0)' : undefined,
                  pointerEvents: mode === 'reset' && !isAnimating ? 'auto' : 'none',
                  zIndex: mode === 'reset' ? 2 : 1,
                }}
              >
                <div className="text-center mb-3 sm:mb-8">
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                    Reset Password
                  </h1>
                  <p className="text-xs sm:text-base text-gray-600">
                    Masukkan NIK dan password lama untuk mereset
                  </p>
                </div>

                <Form {...resetForm}>
                  <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-3 sm:space-y-4">
                    <FormField
                      control={resetForm.control}
                      name="nik"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            NIK
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Masukkan NIK Anda"
                              disabled={isLoading}
                              className="h-10 sm:h-11 text-sm sm:text-base border-gray-300 rounded-lg focus:border-red-500 focus:ring-red-500 bg-white"
                              data-testid="input-reset-nik"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={resetForm.control}
                      name="oldPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Password Lama
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Password lama Anda"
                              disabled={isLoading}
                              className="h-10 sm:h-11 text-sm sm:text-base border-gray-300 rounded-lg focus:border-red-500 focus:ring-red-500 bg-white"
                              data-testid="input-old-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={resetForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Password Baru
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Minimal 8 karakter"
                              disabled={isLoading}
                              className="h-10 sm:h-11 text-sm sm:text-base border-gray-300 rounded-lg focus:border-red-500 focus:ring-red-500 bg-white"
                              data-testid="input-new-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={resetForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Konfirmasi Password Baru
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Ulangi password baru"
                              disabled={isLoading}
                              className="h-10 sm:h-11 text-sm sm:text-base border-gray-300 rounded-lg focus:border-red-500 focus:ring-red-500 bg-white"
                              data-testid="input-confirm-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                      data-testid="button-reset-password"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        "Reset Password"
                      )}
                    </Button>

                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={switchToLogin}
                        disabled={isAnimating}
                        className="text-sm text-gray-600 hover:text-gray-800 font-medium hover:underline transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                        data-testid="link-back-to-login"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Login
                      </button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>

            {/* Mobile Credit Footer - Only visible on mobile */}
            <div className="lg:hidden text-center mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Created by <span className="font-medium text-gray-600">Bagus Andyka Firmansyah</span>
              </p>
            </div>
          </div>

          {/* Right Panel - Static Welcome Section with Background Image */}
          <div className="hidden lg:flex p-12 flex-col justify-center items-center text-white relative overflow-hidden">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${bgImage})` }}
            />
            {/* Red Overlay for contrast - more transparent to show background */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/60 to-red-700/65" />
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-700/30 rounded-full blur-3xl" />

            {/* Static Content - Never changes */}
            <div className="relative z-10 text-center">
              <div className="mb-8 flex justify-center">
                <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-xl">
                  <QrCode className="w-20 h-20 text-white" />
                </div>
              </div>

              <h2 className="text-4xl font-bold mb-4">
                Selamat Datang!
              </h2>
              <p className="text-xl mb-6 text-red-50 font-semibold">OneTalent</p>
              <p className="text-base text-red-100 max-w-md leading-relaxed">Sistem Portal karyawan modern menggunakan teknologi QR Code untuk kemudahan dan keamanan pengelolaan data karyawan.</p>
            </div>

            {/* Credit Footer */}
            <div className="absolute bottom-6 left-0 right-0 text-center z-10">
              <p className="text-sm text-white/70">
                Created by <span className="font-medium text-white/90">Bagus Andyka Firmansyah </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
