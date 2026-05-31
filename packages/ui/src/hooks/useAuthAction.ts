import { useState } from "react";

export const useAuthAction = (isAuthenticated: boolean) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const guard =
        (action?: () => void) =>
        () => {
            if (!isAuthenticated) {
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