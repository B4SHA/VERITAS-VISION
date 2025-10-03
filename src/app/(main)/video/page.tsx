"use client"

import { useState } from "react";
import { VideoIntegrity as VideoIntegrityTool } from "@/components/feature/video-integrity";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Video } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function VideoPage() {
    const [showTool, setShowTool] = useState(false);
    const { t } = useLanguage();

    if (showTool) {
        return <VideoIntegrityTool />;
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-foreground">
            <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                <div className="space-y-8">
                    <h1 className="text-4xl md:text-6xl font-bold font-heading">
                        {t('video_integrity_title')}
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        In the age of deepfakes, seeing isn't always believing. Upload a video, and our tool will perform a deep analysis to detect signs of manipulation, giving you a confidence score on its authenticity.
                    </p>
                    <ul className="space-y-4 text-base">
                        <li className="flex items-start gap-3">
                            <CheckCircle className="size-5 text-primary mt-1 shrink-0" />
                            <span><span className="font-semibold">Deepfake Detection:</span> Identifies common artifacts of AI-generated or manipulated video.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="size-5 text-primary mt-1 shrink-0" />
                            <span><span className="font-semibold">Frame-by-Frame Scrutiny:</span> Analyzes video for visual inconsistencies and manipulation.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="size-5 text-primary mt-1 shrink-0" />
                            <span><span className="font-semibold">Audio-Visual Sync:</span> Detects synthetic voices and audio that doesn't match the visuals.</span>
                        </li>
                    </ul>
                    <Button size="lg" onClick={() => setShowTool(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg">
                        Launch Video Integrity <ArrowRight className="ml-2" />
                    </Button>
                </div>
                <div className="hidden md:flex items-center justify-center">
                    <Video className="w-64 h-64 text-primary" />
                </div>
            </div>
        </div>
    );
}
