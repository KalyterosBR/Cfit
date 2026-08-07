import toast from "react-hot-toast";

export const Toast = {
    success: {
        created(entity: string) {
            toast.success(`${entity} cadastrado com sucesso!`);
        },

        updated(entity: string) {
            toast.success(`${entity} atualizado com sucesso!`);
        },

        deleted(entity: string) {
            toast.success(`${entity} excluído com sucesso!`);
        },
    },

    error: {
        created(entity: string) {
            toast.error(`Erro ao cadastrar ${entity.toLowerCase()}.`);
        },

        updated(entity: string) {
            toast.error(`Erro ao atualizar ${entity.toLowerCase()}.`);
        },

        deleted(entity: string) {
            toast.error(`Erro ao excluir ${entity.toLowerCase()}.`);
        },
    },
};