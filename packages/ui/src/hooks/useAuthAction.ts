import { useState } from "react";
import { isAuthenticated as checkAuthenticated } from "../api/podcast";

/**
 * Гейт для действий, требующих входа: для гостя открывает popup
 * «Добро пожаловать в Podcast!» вместо выполнения действия.
 *
 * Источник истины — наличие access-токена на момент клика (а не проп), поэтому
 * ни одна страница не «забудет» передать состояние авторизации и поведение
 * везде одинаковое. Параметр оставлен для обратной совместимости вызовов и
 * больше ни на что не влияет.
 */
export const useAuthAction = (_isAuthenticated?: boolean) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const guard =
        (action?: () => void) =>
        () => {
            if (!checkAuthenticated()) {
                setIsModalOpen(true);
                return;
            }

            action?.();
        };

    return {
        isModalOpen,
        closeModal: () => setIsModalOpen(false),
        guard,
    };
};