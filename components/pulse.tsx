import { useState, FC } from 'react'

import { create } from 'zustand';

// Define your store
type PulseState = {
    pulse: boolean;
    triggerPulse: () => void;
};

export const usePulseStore = create<PulseState>((set) => ({
    pulse: false,
    triggerPulse: () => {
        set({ pulse: true })
        setTimeout(() => set({ pulse: false }), 500); // Match pulse animation duration
    },
}));

// The Status component
export const Status: FC<{ connected: boolean }> = ({ connected }) => {
    const pulse = usePulseStore(state => state.pulse);
    const pulseClass = pulse ? 'animate-pulse' : ''

    return (
        <span className={`${connected ? 'text-green-500' : 'text-red-500'} ${pulseClass}`}>
            ·
        </span>
    );
};
