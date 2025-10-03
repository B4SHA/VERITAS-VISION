"use client";

import { useState } from "react";
import { analyzeImageAuthenticity, type AnalyzeImageAuthenticityOutput } from "@/ai/flows/analyze-image-authenticity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/use-language";
import { Loader2 } from "lucide-react";
import { FileUploader } from "./file-uploader";

export function ImageVerifier() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeImageAuthenticityOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string>("");

  async function handleAnalyze() {
    if (!imageDataUri) return;
    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);
    try {
      const result = await analyzeImageAuthenticity({ imageDataUri });
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
          <CardTitle className="font-headline">{t('image_verifier_title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileUploader
            onFileRead={setImageDataUri}
            acceptedMimeTypes={["image/jpeg", "image/png", "image/webp", "image/gif"]}
            fileType="image"
          />
          <Button onClick={handleAnalyze} disabled={isLoading || !imageDataUri} className="w-full">
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
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    )
}

function AnalysisResult({ result }: { result: AnalyzeImageAuthenticityOutput }) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{t('analysis_report')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
            <h3 className="text-sm font-medium text-muted-foreground">Verdict</h3>
            <div className="mt-1">
                {result.isAuthentic ? (
                    <Badge variant="secondary">{t('authentic')}</Badge>
                ) : (
                    <Badge variant="destructive">{t('potential_manipulation')}</Badge>
                )}
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
