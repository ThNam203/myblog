"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";

type StoriesOpenContextValue = {
    isOpen: boolean;
    setOpen: (open: boolean) => void;
};

const StoriesOpenContext = createContext<StoriesOpenContextValue>({
    isOpen: false,
    setOpen: () => {},
});

export function StoriesOpenProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const setOpen = useCallback((open: boolean) => setIsOpen(open), []);
    const value = useMemo(() => ({ isOpen, setOpen }), [isOpen, setOpen]);
    return <StoriesOpenContext.Provider value={value}>{children}</StoriesOpenContext.Provider>;
}

export function useStoriesOpen(): StoriesOpenContextValue {
    return useContext(StoriesOpenContext);
}
