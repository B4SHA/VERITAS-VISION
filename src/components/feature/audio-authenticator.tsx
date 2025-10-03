"use client";

import { useState } from "react";
import { analyzeAudioAuthenticity, type AnalyzeAudioAuthenticityOutput } from "@/ai/flows/analyze-audio-authenticity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/use-language";
import { Loader2 } from "lucide-react";
import { FileUploader } from "./file-uploader";
import { Progress } from "../ui/progress";

export function AudioAuthenticator() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeAudioAuthenticityOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioDataUri, setAudioDataUri] = useState<string>("");

  async function handleAnalyze() {
    if (!audioDataUri) return;
    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);
    try {
      const result = await analyzeAudioAuthenticity({ audioDataUri });
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
          <CardTitle className="font-headline">{t('audio_authenticator_title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileUploader
            onFileRead={setAudioDataUri}
            acceptedMimeTypes={["audio/mpeg", "audio/wav", "audio/ogg"]}
            fileType="audio"
          />
          <Button onClick={handleAnalyze} disabled={isLoading || !audioDataUri} className="w-full">
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
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-1/2" />
            </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    )
}

function AnalysisResult({ result }: { result: AnalyzeAudioAuthenticityOutput }) {
  const { t } = useLanguage();
  const confidencePercentage = Math.round(result.confidence * 100);

  const getVerdictBadge = (verdict: string) => {
    const v = verdict.toLowerCase();
    if (v.includes("authentic")) return <Badge variant="secondary">{t('likely_authentic')}</Badge>;
    if (v.includes("ai-generated") || v.includes("manipulated")) return <Badge variant="destructive">{t('likely_ai_generated')}</Badge>;
    return <Badge>{verdict}</Badge>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{t('analysis_report')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
            <h3 className="text-sm font-medium text-muted-foreground">Verdict</h3>
            <div className="mt-1">
                {getVerdictBadge(result.verdict)}
            </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{t('confidence')}</h3>
          <div className="flex items-center gap-4 mt-1">
            <Progress value={confidencePercentage} className="w-full" />
            <span className="font-bold text-lg text-primary">{confidencePercentage}%</span>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{t('analysis')}</h3>
          <p className="mt-1 text-sm leading-relaxed">{result.analysis}</p>
        </div>
      </CardContent>
    </Card>
  );
}
