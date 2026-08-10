export interface CepAddress {
    cep: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
}

export async function getAddressByCep(
    cep: string,
): Promise<CepAddress | null> {
    const cleanCep = cep.replace(/\D/g, "");

    if (cleanCep.length !== 8) {
        return null;
    }

    const response = await fetch(
        `https://viacep.com.br/ws/${cleanCep}/json/`,
    );

    if (!response.ok) {
        throw new Error("Erro ao consultar CEP.");
    }

    const data = await response.json();

    if (data.erro) {
        return null;
    }

    return {
        cep: data.cep ?? "",
        street: data.logradouro ?? "",
        neighborhood: data.bairro ?? "",
        city: data.localidade ?? "",
        state: data.uf ?? "",
    };
}