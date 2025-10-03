
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { audioAuthenticatorAnalysis, type AudioAuthenticatorOutput, type AudioAuthenticatorError } from "@/ai/flows/audio-authenticator-flow";
import { fileToDataUri } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "./ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/context/language-context";

const formSchema = z.object({
  audioFile: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, "Audio file is required.")
    .refine((files) => files?.[0]?.type.startsWith("audio/"), "Please upload a valid audio file.")
    .refine((files) => files?.[0]?.size <= 10 * 1024 * 1024, "File size should be less than 10MB."),
});


export function AudioAuthenticator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AudioAuthenticatorOutput | null>(null);
  const [rawErrorResponse, setRawErrorResponse] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { language } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("audioFile", event.target.files as FileList);
      const objectUrl = URL.createObjectURL(file);
      setAudioPreview(objectUrl);
    }
  };
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setRawErrorResponse(null);

    try {
      const audioDataUri = await fileToDataUri(values.audioFile[0]);
      const analysisResult = await audioAuthenticatorAnalysis({ audioDataUri, language });
      
      if ('error' in analysisResult) {
        setRawErrorResponse(analysisResult.rawResponse);
        toast({
            variant: "destructive",
            title: "AI Response Error",
            description: "The AI returned a response that could not be parsed. See the raw output.",
        });
      } else {
        setResult(analysisResult);
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const getProgressIndicatorClassName = (score: number) => {
    if (score < 40) return "bg-destructive";
    if (score < 70) return "bg-accent";
    return "bg-primary";
  };

  const getVerdictBadgeVariant = (verdict: string) => {
    const lowerVerdict = verdict.toLowerCase();
    if (lowerVerdict.includes('authentic')) return 'default';
    if (lowerVerdict.includes('ai') || lowerVerdict.includes('manipulation')) return 'destructive';
    return 'secondary';
  };

  const getVerdictIcon = (verdict: string) => {
    const lowerVerdict = verdict.toLowerCase();
    if (lowerVerdict.includes('authentic')) return <Icons.check className="mr-1.5" />;
    if (lowerVerdict.includes('ai') || lowerVerdict.includes('manipulation')) return <Icons.alert className="mr-1.5" />;
    return <Icons.help className="mr-1.5" />;
  };

  return (
     <div className="w-full flex-1 bg-gradient-to-br from-background to-muted/40 py-8 px-4">
      <div className="container mx-auto flex flex-col items-center gap-8 max-w-5xl">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-foreground mb-2">
            {t('audioAuthenticator.title')}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('audioAuthenticator.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-start gap-8 w-full">
            <Card className="w-full shadow-lg border-2 border-border/80 bg-background/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                <Icons.audio className="h-6 w-6" />
                {t('audioAuthenticator.inputTitle')}
                </CardTitle>
                <CardDescription>
                {t('audioAuthenticator.inputDescription')}
                </CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="audioFile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('audioAuthenticator.inputFileLabel')}</FormLabel>
                          <FormControl>
                              <Input
                              type="file"
                              accept="audio/*"
                              onChange={handleFileChange}
                              className="file:text-foreground h-12 text-base"
                              />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {audioPreview && (
                    <div className="mt-4 border-2 shadow-inner rounded-lg p-2">
                        <audio controls src={audioPreview} className="w-full">
                        Your browser does not support the audio element.
                        </audio>
                    </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg font-semibold">
                    {isLoading && <Icons.spinner className="mr-2" />}
                    {t('audioAuthenticator.analyzeButton')}
                    </Button>
                </CardFooter>
                </form>
            </Form>
            </Card>
            
            <Card className="w-full shadow-lg border-2 border-border/80 bg-background/80 backdrop-blur-sm flex flex-col min-h-[500px] lg:min-h-auto">
              <CardHeader>
                  <CardTitle className="text-xl">{t('audioAuthenticator.reportTitle')}</CardTitle>
                  <CardDescription>
                  {t('audioAuthenticator.reportDescription')}
                  </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                  {isLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
                      <Icons.spinner className="h-10 w-10 text-primary" />
                      <p className="text-center text-muted-foreground">{t('audioAuthenticator.analyzingText')}</p>
                  </div>
                  )}
                  {!isLoading && !result && !rawErrorResponse && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                      <Icons.barChart className="mx-auto mb-4 h-10 w-10" />
                      <p>{t('audioAuthenticator.pendingText')}</p>
                  </div>
                  )}
                  {rawErrorResponse && (
                      <div className="flex-1 flex flex-col min-h-0">
                        <h3 className="font-semibold text-lg mb-2 px-1 text-destructive">Raw AI Response</h3>
                        <ScrollArea className="flex-1 pr-4 -mr-4">
                            <pre className="text-sm leading-relaxed text-destructive/80 whitespace-pre-wrap break-words bg-destructive/10 p-4 rounded-md">
                                {rawErrorResponse}
                            </pre>
                        </ScrollArea>
                      </div>
                  )}
                  {result && (
                  <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="flex-1 flex flex-col min-h-0 space-y-4">
                        <div>
                          <div className="px-1 space-y-4">
                              <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-lg">Verdict</h3>
                                  <Badge variant={getVerdictBadgeVariant(result.verdict)} className="px-3 py-1 text-sm">
                                  {getVerdictIcon(result.verdict)}
                                  {result.verdict}
                                  </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-lg">Confidence Score</h3>
                                  <span className="font-bold text-2xl text-primary">{result.confidenceScore}/100</span>
                              </div>
                              <Progress value={result.confidenceScore} indicatorClassName={getProgressIndicatorClassName(result.confidenceScore)} />
                          </div>
                        </div>
                        <Separator/>

                        {result.detectedText && (
                            <>
                                <Alert>
                                    <Icons.news className="h-4 w-4" />
                                    <AlertTitle>Speech Analysis</AlertTitle>
                                    <AlertDescription className="mt-2">
                                        <p className="font-semibold mb-2">Transcript:</p>
                                        <blockquote className="border-l-2 pl-4 italic my-2 text-sm max-h-24 overflow-y-auto">
                                            {result.detectedText}
                                        </blockquote>
                                    </AlertDescription>
                                </Alert>
                                <Separator />
                            </>
                        )}
                        
                        <div className="flex-1 flex flex-col min-h-0">
                          <h3 className="font-semibold text-lg mb-2 px-1">Detailed Forensic Report</h3>
                          <div className="flex-1">
                                <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap break-words">
                                    {result.report}
                                </p>
                          </div>
                        </div>
                    </div>
                  </ScrollArea>
                  )}
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
