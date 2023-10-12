"use client";

import * as React from "react";

import { Progress } from "@/components/ui/progress";

interface EstimatedTimeProps {
    expectedTime: number;
}

export function EstimatedTime({ expectedTime }: EstimatedTimeProps) {
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
        const startTime = Date.now();
        const updateProgress = () => {
            const elapsedTime = Date.now() - startTime;
            const newProgress = Math.min(
                (elapsedTime / expectedTime) * 100,
                100
            );
            setProgress(newProgress);
            if (newProgress < 100) {
                requestAnimationFrame(updateProgress);
            }
        };
        const req = requestAnimationFrame(updateProgress);
        return () => cancelAnimationFrame(req);
    }, [expectedTime]);

    return <Progress value={progress} className="w-full" />;
}
