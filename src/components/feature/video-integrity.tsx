"use client";

import { useState } from "react";
import { analyzeVideoIntegrity, type AnalyzeVideoIntegrityOutput } from "@/ai/flows/analyze-video-integrity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/use-language";
import { Loader2 } from "lucide-react";
import { FileUploader } from "./file-uploader";

export function VideoIntegrity() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeVideoIntegrityOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoDataUri, setVideoDataUri] = useState<string>("");

  async function handleAnalyze() {
    if (!videoDataUri) return;
    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);
    try {
      const result = await analyzeVideoIntegrity({ videoDataUri });
      setAnalysisResult(result);
    } catch (e) {
      setError("An error occurred during analysis. Please try again.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{t('video_integrity_title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileUploader
            onFileRead={setVideoDataUri}
            acceptedMimeTypes={["video/mp4", "video/webm", "video/mov"]}
            fileType="video"
          />
          <Button onClick={handleAnalyze} disabled={isLoading || !videoDataUri} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('analyze')}
          </Button>
        </CardContent>
      </Card>

      {isLoading && <LoadingState />}
      {error && <p className="text-destructive">{error}</p>}
      {analysisResult && <AnalysisResult result={analysisResult} />}
    </div>
  );
}

function LoadingState() {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{t('analysis_report')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-1/2" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-1/2" />
            </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-20 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function AnalysisResult({ result }: { result: AnalyzeVideoIntegrityOutput }) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{t('analysis_report')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
                <h3 className="text-sm font-medium text-muted-foreground">{t('deepfake')}</h3>
                {result.isDeepfake ? (
                    <Badge variant="destructive" className="mt-1">{t('detected')}</Badge>
                ) : (
                    <Badge variant="secondary" className="mt-1">{t('not_detected')}</Badge>
                )}
            </div>
            <div>
                <h3 className="text-sm font-medium text-muted-foreground">{t('ai_generated')}</h3>
                {result.isAiGenerated ? (
                    <Badge variant="destructive" className="mt-1">{t('detected')}</Badge>
                ) : (
                    <Badge variant="secondary" className="mt-1">{t('not_detected')}</Badge>
                )}
            </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{t('misleading_speech')}</h3>
          <p className="mt-1 text-sm leading-relaxed">{result.misleadingSpeechAnalysis}</p>
        </div>
      </CardContent>
    </Card>
  );
}
