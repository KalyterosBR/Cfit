import Logo from "@/components/branding/Logo";

export default function LoginHeader() {
    return (
        <div className="text-center">
            <div className="flex justify-center">
                <Logo width={180} />
            </div>

            <p className="mt-6 text-lg font-semibold text-slate-800">
                Bem-vindo de volta
            </p>

            <p className="mt-2 text-sm text-slate-500">
                Faça login para acessar sua academia.
            </p>
        </div>
    );
}