"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { analyzeNewsArticleCredibility, type AnalyzeNewsArticleCredibilityOutput } from "@/ai/flows/analyze-news-article-credibility";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/use-language";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  inputType: z.enum(["text", "url"]),
  content: z.string().min(1, "Content cannot be empty."),
});

type FormValues = z.infer<typeof formSchema>;

export function NewsSleuth() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeNewsArticleCredibilityOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inputType: "text",
      content: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);
    try {
      const result = await analyzeNewsArticleCredibility({ articleContent: values.content });
      setAnalysisResult(result);
    } catch (e) {
      setError("An error occurred during analysis. Please try again.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleTabChange = (value: string) => {
    form.setValue("inputType", value as "text" | "url");
    form.setValue("content", "");
    form.clearErrors();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{t('news_sleuth_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="text" className="w-full" onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">{t('text')}</TabsTrigger>
                  <TabsTrigger value="url">{t('url')}</TabsTrigger>
                </TabsList>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <TabsContent value="text" className="mt-4">
                        <FormLabel className="sr-only">{t('paste_article_text')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('paste_article_text') + "..."}
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                      </TabsContent>
                      <TabsContent value="url" className="mt-4">
                        <FormLabel className="sr-only">{t('article_url')}</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/news-article" {...field} />
                        </FormControl>
                      </TabsContent>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Tabs>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('analyze')}
              </Button>
            </form>
          </Form>
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
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-6 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
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

function AnalysisResult({ result }: { result: AnalyzeNewsArticleCredibilityOutput }) {
  const { t } = useLanguage();
  const credibilityPercentage = Math.round(result.credibilityScore * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{t('analysis_report')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{t('credibility_score')}</h3>
          <div className="flex items-center gap-4 mt-1">
            <Progress value={credibilityPercentage} className="w-full" />
            <span className="font-bold text-lg text-primary">{credibilityPercentage}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
                <h3 className="text-sm font-medium text-muted-foreground">{t('misinformation')}</h3>
                {result.misinformationDetected ? (
                    <Badge variant="destructive" className="mt-1">{t('detected')}</Badge>
                ) : (
                    <Badge variant="secondary" className="mt-1">{t('not_detected')}</Badge>
                )}
            </div>
            <div>
                <h3 className="text-sm font-medium text-muted-foreground">{t('bias')}</h3>
                {result.biasDetected ? (
                    <Badge variant="destructive" className="mt-1">{t('detected')}</Badge>
                ) : (
                    <Badge variant="secondary" className="mt-1">{t('not_detected')}</Badge>
                )}
            </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{t('summary')}</h3>
          <p className="mt-1 text-sm leading-relaxed">{result.summary}</p>
        </div>
      </CardContent>
    </Card>
  );
}
