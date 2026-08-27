import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/branding/Logo";

const sectionLinks = [["#recursos", "Operação"], ["#sistema", "Produto"], ["#solucoes", "Acesso"]];

export default function HomeFooter() {
    return (
        <footer className="relative overflow-hidden border-t border-white/10 bg-[#06101f] text-white">
            <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" aria-hidden="true" />
            <div className="relative mx-auto max-w-[1600px] px-6 lg:px-10">
                <div className="grid gap-6 border-b border-white/10 py-[26px] lg:grid-cols-[1fr_auto] lg:items-center">
                    <div><div className="flex items-center gap-3"><span className="h-px w-8 bg-gradient-to-r from-blue-500 to-cyan-400" aria-hidden="true" /><span className="text-[9px] font-black uppercase tracking-[0.21em] text-cyan-300">Próximo movimento</span></div><h2 className="mt-3 max-w-3xl text-3xl font-black leading-[1.02] tracking-[-0.05em] sm:text-4xl">Entre na operação da sua academia.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Explore o produto ou acesse o ambiente da sua academia.</p></div>
                    <div className="flex flex-col gap-3 sm:flex-row"><a href="#sistema" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-black text-white transition hover:border-cyan-300/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">Explorar o produto</a><Link to="/login" className="group flex min-h-12 min-w-[190px] items-center justify-between rounded-full bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">Acessar o Cfit <ArrowRight size={17} aria-hidden="true" className="transition-transform group-hover:translate-x-1" /></Link></div>
                </div>
                <div className="grid gap-6 py-6 md:grid-cols-[1fr_auto] md:items-center">
                    <div><Logo width={96} variant="sidebar" /><p className="mt-2 flex items-center gap-2 text-[11px] text-slate-400"><CheckCircle2 size={13} aria-hidden="true" className="text-emerald-400" /> Performance para sua gestão.</p></div>
                    <div className="md:text-right"><nav aria-label="Navegação do rodapé" className="flex flex-wrap gap-x-5 gap-y-3 md:justify-end">{sectionLinks.map(([href, label]) => <a key={href} href={href} className="inline-flex min-h-11 items-center text-xs font-bold text-slate-400 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">{label}</a>)}<Link to="/login" className="inline-flex min-h-11 items-center text-xs font-bold text-slate-400 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">Entrar</Link></nav><p className="mt-3 text-[10px] text-slate-500">© 2026 Cfit. Todos os direitos reservados.</p></div>
                </div>
            </div>
        </footer>
    );
}
