interface StudentSearchProps {
    value: string;
    onChange: (value: string) => void;
}

export default function StudentSearch({
    value,
    onChange,
}: StudentSearchProps) {
    return (
        <div className="mb-6">
            <input
                type="text"
                placeholder="Pesquisar por nome ou CPF..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full max-w-sm rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
}