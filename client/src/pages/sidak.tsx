import { Link } from "wouter";
import { ClipboardCheck, Activity, ClipboardList, ArrowLeft, TrafficCone, Truck, Shield, Maximize2, Gauge, Sun, Lock, Tablet, PenTool } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SidakDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container max-w-7xl mx-auto p-4 space-y-8">
        <div className="text-center pt-8 pb-4">
          <div className="flex items-center justify-center gap-3 mb-3 relative">
            <Link href="/workspace/dashboard">
              <Button variant="ghost" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2 lg:hidden">
                <ArrowLeft className="h-6 w-6 text-gray-700 dark:text-gray-200" />
              </Button>
            </Link>
            <ClipboardCheck className="h-12 w-12 text-primary" />
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              SIDAK
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-lg max-w-2xl mx-auto">
            Sistem Inspeksi Data Karyawan PT Borneo Indobara
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/workspace/sidak/fatigue/new" data-testid="link-sidak-fatigue">
            <div className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full flex flex-col cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity className="h-24 w-24 text-blue-600" />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <Activity className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors">
                    Sidak Fatigue
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Kelelahan Karyawan
                  </p>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    Max 20 Orang
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    BIB-HSE-ES-F-3.02-16
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  Pemeriksaan jam tidur, konsumsi obat, dan kondisi fisik.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:ml-2 transition-all">
                  Mulai Sidak
                </span>
                <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/workspace/sidak/roster/new" data-testid="link-sidak-roster">
            <div className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full flex flex-col cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ClipboardList className="h-24 w-24 text-purple-600" />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                  <ClipboardList className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-purple-600 transition-colors">
                    Sidak Roster
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Kesesuaian Roster
                  </p>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                    Max 15 Orang
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    BIB-HSE-PPO-F
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  Pemeriksaan kesesuaian roster dengan jadwal aktual.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 group-hover:ml-2 transition-all">
                  Mulai Sidak
                </span>
                <div className="h-8 w-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/workspace/sidak/seatbelt/new" data-testid="link-sidak-seatbelt">
            <div className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full flex flex-col cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ClipboardCheck className="h-24 w-24 text-green-600" />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                  <ClipboardCheck className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-green-600 transition-colors">
                    Sidak Seatbelt
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Kepatuhan Seatbelt
                  </p>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                    Unlimited
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    BIB-HSE-ES-F-3.02-86
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  Pemeriksaan kelayakan dan kepatuhan penggunaan seatbelt.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-green-600 dark:text-green-400 group-hover:ml-2 transition-all">
                  Mulai Sidak
                </span>
                <div className="h-8 w-8 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/workspace/sidak/rambu/new" data-testid="link-sidak-rambu">
            <div className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full flex flex-col cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrafficCone className="h-24 w-24 text-amber-600" />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <TrafficCone className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-amber-600 transition-colors">
                    Sidak Rambu
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Kepatuhan Rambu Lalu Lintas
                  </p>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    Max 10 Kendaraan
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    BIB-HSE-PPO-F-072-24
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  Observasi kepatuhan rambu lalu lintas untuk kendaraan di area PT Borneo Indobara.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 group-hover:ml-2 transition-all">
                  Mulai Sidak
                </span>
                <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/workspace/sidak/antrian/new" data-testid="link-sidak-antrian">
            <div className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full flex flex-col cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Truck className="h-24 w-24 text-rose-600" />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                  <Truck className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-rose-600 transition-colors">
                    Sidak Antrian
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Observasi Antrian Unit
                  </p>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                    Max 10 Unit
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    BIB-HSE-PPO-F-078-24
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  Pemeriksaan jarak aman dan penggunaan handbrake saat antrian.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 group-hover:ml-2 transition-all">
                  Mulai Sidak
                </span>
                <div className="h-8 w-8 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/workspace/sidak/jarak/new" data-testid="link-sidak-jarak">
            <div className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full flex flex-col cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Maximize2 className="h-24 w-24 text-blue-600" />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <Maximize2 className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors">
                    Sidak Jarak
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Jarak Aman Berkendara
                  </p>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    Min 30-50m
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    BIB-HSE-PPO-F-072-17
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  Observasi jarak aman antar unit operasional (muatan/kosongan).
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:ml-2 transition-all">
                  Mulai Sidak
                </span>
                <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/workspace/sidak/kecepatan/new" data-testid="link-sidak-kecepatan">
            <div className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full flex flex-col cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Gauge className="h-24 w-24 text-orange-600" />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                  <Gauge className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-orange-600 transition-colors">
                    Sidak Kecepatan
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Observasi Kecepatan
                  </p>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                    Max 20 Unit
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    BIB-HSE-PPO-F-072-18
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  Pengukuran kecepatan unit operasional dengan speed gun.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 group-hover:ml-2 transition-all">
                  Mulai Sidak
                </span>
                <div className="h-8 w-8 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/workspace/sidak/apd/new" data-testid="link-sidak-apd">
            <div className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full flex flex-col cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Shield className="h-24 w-24 text-purple-600" />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                  <Shield className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-purple-600 transition-colors">
                    Sidak APD
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Alat Pelindung Diri
                  </p>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                    Personel
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    BIB-HSE-GEN-F-005
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  Checklist kelengkapan APD (Helm, Rompi, Sepatu, dll).
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 group-hover:ml-2 transition-all">
                  Mulai Sidak
                </span>
                <div className="h-8 w-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/workspace/sidak/pencahayaan/new" data-testid="link-sidak-pencahayaan">
            <div className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full flex flex-col cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sun className="h-24 w-24 text-yellow-600" />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform">
                  <Sun className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-yellow-600 transition-colors">
                    Sidak Pencahayaan
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pemeriksaan Pencahayaan
                  </p>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
                    Area Kerja
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    BIB-HSE-GEN-F
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  Pengukuran intensitas cahaya (Lux) di area kerja.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 group-hover:ml-2 transition-all">
                  Mulai Sidak
                </span>
                <div className="h-8 w-8 rounded-full bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/workspace/sidak/loto/new" data-testid="link-sidak-loto">
            <div className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full flex flex-col cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Lock className="h-24 w-24 text-orange-600" />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                  <Lock className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-orange-600 transition-colors">
                    Sidak LOTO
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Inspeksi Kepatuhan LOTO
                  </p>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                    Personal
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    BIB-HSE-GEN-F-003
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  Pemeriksaan penggunaan Lock Out Tag Out (Gembok & Tag) di area kerja.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 group-hover:ml-2 transition-all">
                  Mulai Sidak
                </span>
                <div className="h-8 w-8 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/workspace/sidak/digital/new" data-testid="link-sidak-digital">
            <div className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full flex flex-col cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Tablet className="h-24 w-24 text-blue-600" />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <Tablet className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors">
                    Sidak Digital
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Inspeksi Pengawas Digital
                  </p>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    Aplikasi
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  Pemeriksaan penggunaan aplikasi pengawasan oleh pengawas lapangan.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:ml-2 transition-all">
                  Mulai Sidak
                </span>
                <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/workspace/sidak/workshop/new" data-testid="link-sidak-workshop">
            <div className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full flex flex-col cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <PenTool className="h-24 w-24 text-orange-600" />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                  <PenTool className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-orange-600 transition-colors">
                    Sidak Workshop
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Checklist Peralatan Workshop
                  </p>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                    Area Workshop
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  Inspeksi kondisi dan kelengkapan peralatan workshop.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 group-hover:ml-2 transition-all">
                  Mulai Sidak
                </span>
                <div className="h-8 w-8 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                <ClipboardList className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Riwayat & Laporan
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Lihat hasil inspeksi sebelumnya
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/workspace/sidak/fatigue/history" data-testid="link-fatigue-history">
              <Button variant="outline" className="w-full justify-start h-16 text-sm hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border-gray-200 dark:border-gray-700 rounded-2xl transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center w-full">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl mr-3 group-hover:scale-110 transition-transform">
                    <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-700">Riwayat Fatigue</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Lihat data & PDF</div>
                  </div>
                  <div className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                </div>
              </Button>
            </Link>
            <Link href="/workspace/sidak/roster/history" data-testid="link-roster-history">
              <Button variant="outline" className="w-full justify-start h-16 text-sm hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 border-gray-200 dark:border-gray-700 rounded-2xl transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center w-full">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl mr-3 group-hover:scale-110 transition-transform">
                    <ClipboardList className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-purple-700">Riwayat Roster</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Lihat data & PDF</div>
                  </div>
                  <div className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                </div>
              </Button>
            </Link>
            <Link href="/workspace/sidak/seatbelt/history" data-testid="link-seatbelt-history">
              <Button variant="outline" className="w-full justify-start h-16 text-sm hover:bg-green-50 hover:text-green-700 hover:border-green-200 border-gray-200 dark:border-gray-700 rounded-2xl transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-green-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center w-full">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl mr-3 group-hover:scale-110 transition-transform">
                    <ClipboardCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-green-700">Riwayat Seatbelt</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Lihat data & PDF</div>
                  </div>
                  <div className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                </div>
              </Button>
            </Link>
            <Link href="/workspace/sidak/rambu/history" data-testid="link-rambu-history">
              <Button variant="outline" className="w-full justify-start h-16 text-sm hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 border-gray-200 dark:border-gray-700 rounded-2xl transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center w-full">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl mr-3 group-hover:scale-110 transition-transform">
                    <TrafficCone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-amber-700">Riwayat Rambu</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Lihat data & PDF</div>
                  </div>
                  <div className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                </div>
              </Button>
            </Link>
            <Link href="/workspace/sidak/antrian/history" data-testid="link-antrian-history">
              <Button variant="outline" className="w-full justify-start h-16 text-sm hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border-gray-200 dark:border-gray-700 rounded-2xl transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center w-full">
                  <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl mr-3 group-hover:scale-110 transition-transform">
                    <Truck className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-rose-700">Riwayat Antrian</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Lihat data & PDF</div>
                  </div>
                  <div className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                </div>
              </Button>
            </Link>
            <Link href="/workspace/sidak/jarak/history" data-testid="link-jarak-history">
              <Button variant="outline" className="w-full justify-start h-16 text-sm hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border-gray-200 dark:border-gray-700 rounded-2xl transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center w-full">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl mr-3 group-hover:scale-110 transition-transform">
                    <Maximize2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-700">Riwayat Jarak</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Lihat data & PDF</div>
                  </div>
                  <div className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                </div>
              </Button>
            </Link>
            <Link href="/workspace/sidak/kecepatan/history" data-testid="link-kecepatan-history">
              <Button variant="outline" className="w-full justify-start h-16 text-sm hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border-gray-200 dark:border-gray-700 rounded-2xl transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center w-full">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl mr-3 group-hover:scale-110 transition-transform">
                    <Gauge className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-orange-700">Riwayat Kecepatan</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Lihat data & PDF</div>
                  </div>
                  <div className="text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                </div>
              </Button>
            </Link>
            <Link href="/workspace/sidak/apd/history" data-testid="link-apd-history">
              <Button variant="outline" className="w-full justify-start h-16 text-sm hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 border-gray-200 dark:border-gray-700 rounded-2xl transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center w-full">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl mr-3 group-hover:scale-110 transition-transform">
                    <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-purple-700">Riwayat APD</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Lihat data & PDF</div>
                  </div>
                  <div className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                </div>
              </Button>
            </Link>
            <Link href="/workspace/sidak/pencahayaan/history" data-testid="link-pencahayaan-history">
              <Button variant="outline" className="w-full justify-start h-16 text-sm hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200 border-gray-200 dark:border-gray-700 rounded-2xl transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center w-full">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl mr-3 group-hover:scale-110 transition-transform">
                    <Sun className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-yellow-700">Riwayat Pencahayaan</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Lihat data & PDF</div>
                  </div>
                  <div className="text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                </div>
              </Button>
            </Link>
            <Link href="/workspace/sidak/loto/history" data-testid="link-loto-history">
              <Button variant="outline" className="w-full justify-start h-16 text-sm hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border-gray-200 dark:border-gray-700 rounded-2xl transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center w-full">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl mr-3 group-hover:scale-110 transition-transform">
                    <Lock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-orange-700">Riwayat LOTO</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Lihat data & PDF</div>
                  </div>
                  <div className="text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                </div>
              </Button>
            </Link>
            <Link href="/workspace/sidak/digital/history" data-testid="link-digital-history">
              <Button variant="outline" className="w-full justify-start h-16 text-sm hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border-gray-200 dark:border-gray-700 rounded-2xl transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center w-full">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl mr-3 group-hover:scale-110 transition-transform">
                    <Tablet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-700">Riwayat Digital</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Lihat data & PDF</div>
                  </div>
                  <div className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                </div>
              </Button>
            </Link>
            <Link href="/workspace/sidak/workshop/history" data-testid="link-workshop-history">
              <Button variant="outline" className="w-full justify-start h-16 text-sm hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border-gray-200 dark:border-gray-700 rounded-2xl transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center w-full">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl mr-3 group-hover:scale-110 transition-transform">
                    <PenTool className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-orange-700">Riwayat Workshop</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Lihat data & PDF</div>
                  </div>
                  <div className="text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">→</div>
                </div>
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl p-5 shadow-sm">
          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-0.5 bg-amber-100 dark:bg-amber-800/50 p-2 rounded-xl h-10 w-10 flex items-center justify-center">
              <span className="text-lg">ℹ️</span>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-amber-900 dark:text-amber-100">Catatan Penting</p>
              <ul className="space-y-1.5 text-xs text-amber-800 dark:text-amber-200">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Tidak perlu login untuk menggunakan sistem
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Scan QR karyawan untuk data observer
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Download PDF hasil setelah selesai
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
