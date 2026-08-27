import HomeAccess from "@/features/auth/components/HomeAccess";
import HomeBenefits from "@/features/auth/components/HomeBenefits";
import HomeFeatures from "@/features/auth/components/HomeFeatures";
import HomeFooter from "@/features/auth/components/HomeFooter";
import HomeHeader from "@/features/auth/components/HomeHeader";
import HomeHero from "@/features/auth/components/HomeHero";
import HomeProductPreview from "@/features/auth/components/HomeProductPreview";
import HomeSystem from "@/features/auth/components/HomeSystem";

export default function Home() {
    return (
        <div className="min-h-screen overflow-x-hidden bg-[#f4f7fb]">
            <HomeHeader />
            <main><section className="relative isolate overflow-hidden border-b border-slate-200 bg-[#f4f7fb]">
                <div className="pointer-events-none absolute inset-0" aria-hidden="true"><div className="absolute -right-48 -top-48 h-[34rem] w-[34rem] rounded-full bg-cyan-300/15 blur-[120px]" /><div className="absolute -left-48 bottom-0 h-[30rem] w-[30rem] rounded-full bg-blue-400/10 blur-[120px]" /></div>
                <div className="relative mx-auto grid w-full max-w-[1600px] gap-9 px-6 py-10 md:py-12 lg:min-h-[590px] lg:grid-cols-[minmax(0,1.05fr)_minmax(430px,0.95fr)] lg:items-center lg:px-10">
                    <HomeHero />
                    <div className="flex justify-center lg:justify-end"><HomeProductPreview /></div>
                </div>
            </section>
            <HomeFeatures />
            <HomeSystem />
            <HomeBenefits />
            <HomeAccess />
            </main>
            <HomeFooter />
        </div>
    );
}
