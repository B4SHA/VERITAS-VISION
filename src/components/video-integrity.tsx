
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { videoIntegrityAnalysis, type VideoIntegrityOutput, type VideoIntegrityError } from "@/ai/flows/video-integrity-flow";
import { fileToDataUri } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { Progress } from "@/components/ui/progress";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/context/language-context";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "./ui/badge";

const formSchema = z.object({
  videoFile: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, "Video file is required.")
    .refine((files) => files?.[0]?.type.startsWith("video/"), "Please upload a valid video file.")
    .refine((files) => files?.[0]?.size <= 50 * 1024 * 1024, "File size should be less than 50MB."),
});

export function VideoIntegrity() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VideoIntegrityOutput | null>(null);
  const [rawErrorResponse, setRawErrorResponse] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { language } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("videoFile", event.target.files as FileList);
      const objectUrl = URL.createObjectURL(file);
      setVideoPreview(objectUrl);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setRawErrorResponse(null);
    
    try {
      const videoDataUri = await fileToDataUri(values.videoFile[0]);
      const analysisResult = await videoIntegrityAnalysis({ videoDataUri, language });

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

  const getVerdictBadgeVariant = (verdict: string) => {
    const lowerVerdict = verdict.toLowerCase();
    if (lowerVerdict.includes('authentic')) return 'default';
    if (lowerVerdict.includes('manipulation')) return 'destructive';
    return 'secondary';
  };
  
  const getProgressIndicatorClassName = (score: number) => {
    if (score < 40) return "bg-destructive";
    if (score < 70) return "bg-accent";
    return "bg-primary";
  };

  const AnalysisItem = ({ title, content }: { title: string, content: string }) => {
    const isDetected = content.toLowerCase().startsWith('detected');
    return (
       <AccordionItem value={title.toLowerCase().replace(/\s/g, '-')}>
        <AccordionTrigger>
          <div className="flex items-center justify-between w-full">
            <span>{title}</span>
            <div className={`flex items-center gap-2 text-sm ${isDetected ? 'text-destructive' : 'text-primary'}`}>
                {isDetected ? <Icons.alert className="h-4 w-4" /> : <Icons.checkCircle className="h-4 w-4" />}
                <span>{isDetected ? 'Detected' : 'Not Detected'}</span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
           <p className="text-sm text-muted-foreground">{content.substring(content.indexOf(' ') + 1)}</p>
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <div className="w-full flex-1 bg-gradient-to-br from-background to-muted/40 py-8 px-4">
        <div className="container mx-auto flex flex-col items-center gap-8 max-w-5xl">
            <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-foreground mb-2">
                    {t('videoIntegrity.title')}
                </h1>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                    {t('videoIntegrity.description')}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-start gap-8 w-full">
                <Card className="w-full shadow-lg border-2 border-border/80 bg-background/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Icons.video className="h-6 w-6" />
                            {t('videoIntegrity.inputTitle')}
                        </CardTitle>
                        <CardDescription>
                            {t('videoIntegrity.inputDescription')}
                        </CardDescription>
                    </CardHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="videoFile"
                                    render={() => (
                                    <FormItem>
                                        <FormLabel>{t('videoIntegrity.inputFileLabel')}</FormLabel>
                                        <FormControl>
                                        <Input
                                            type="file"
                                            accept="video/*"
                                            onChange={handleFileChange}
                                            className="file:text-foreground h-12 text-base"
                                        />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                {videoPreview && (
                                    <div className="mt-4 rounded-lg overflow-hidden border-2 shadow-inner">
                                    <video controls src={videoPreview} className="w-full aspect-video" />
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg font-semibold">
                                    {isLoading && <Icons.spinner className="mr-2" />}
                                    {t('videoIntegrity.analyzeButton')}
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>

                <Card className="w-full shadow-lg border-2 border-border/80 bg-background/80 backdrop-blur-sm flex flex-col min-h-[500px] lg:min-h-auto">
                    <CardHeader>
                        <CardTitle className="text-xl">Analysis Report</CardTitle>
                        <CardDescription>
                          The results of the video analysis will appear here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col min-h-0">
                        {isLoading && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
                            <Icons.spinner className="h-10 w-10 text-primary" />
                            <p className="text-muted-foreground text-center">{t('videoIntegrity.analyzingText')}</p>
                        </div>
                        )}
                        {!isLoading && !result && !rawErrorResponse && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                            <Icons.barChart className="h-10 w-10 mx-auto mb-4" />
                            <p>{t('videoIntegrity.pendingText')}</p>
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
                          <ScrollArea className="flex-1 -mr-4 pr-4">
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                      <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg">Overall Authenticity</CardTitle>
                                        <Badge variant={getVerdictBadgeVariant(result.verdict)}>{result.verdict}</Badge>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-baseline gap-4">
                                            <span className="font-bold text-5xl text-primary">{result.overallScore}</span>
                                            <span className="text-muted-foreground text-lg">/ 100</span>
                                        </div>
                                        <Progress value={result.overallScore} indicatorClassName={getProgressIndicatorClassName(result.overallScore)} className="my-3"/>
                                        <p className="text-sm text-muted-foreground">{result.summary}</p>
                                    </CardContent>
                                </Card>

                                <Accordion type="multiple" defaultValue={['reasoning']} className="w-full">
                                    <AccordionItem value="reasoning">
                                        <AccordionTrigger>Reasoning</AccordionTrigger>
                                        <AccordionContent>{result.reasoning}</AccordionContent>
                                    </AccordionItem>
                                    <AnalysisItem title="Deepfake Analysis" content={result.deepfake} />
                                    <AnalysisItem title="Video Manipulation" content={result.videoManipulation} />
                                    <AnalysisItem title="Synthetic Voice" content={result.syntheticVoice} />
                                </Accordion>

                                {result.detectedText && (
                                    <Alert className="mt-4">
                                    <Icons.audio className="h-4 w-4" />
                                    <AlertTitle>Speech Detected in Video</AlertTitle>
                                    <AlertDescription className="mt-2">
                                        <p className="font-semibold mb-2">Transcript:</p>
                                        <blockquote className="border-l-2 pl-4 italic my-2 text-sm max-h-32 overflow-y-auto">
                                            {result.detectedText}
                                        </blockquote>
                                    </AlertDescription>
                                    </Alert>
                                )}
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
