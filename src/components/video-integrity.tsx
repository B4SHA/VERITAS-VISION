
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { videoIntegrityAnalysis, type VideoIntegrityOutput } from "@/ai/flows/video-integrity-flow";
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
import { cn } from "@/lib/utils";


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
    
    try {
      const videoDataUri = await fileToDataUri(values.videoFile[0]);
      const analysisResult = await videoIntegrityAnalysis({ videoDataUri, language });
      setResult(analysisResult);
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

  const analysisItems = result ? [
    { label: "Deepfake", detected: result.analysis.deepfake },
    { label: "Video Manipulation", detected: result.analysis.videoManipulation },
    { label: "Synthetic Voice", detected: result.analysis.syntheticVoice },
    { label: "Fully AI-Generated", detected: result.analysis.fullyAIGenerated },
    { label: "Satire or Parody", detected: result.analysis.satireOrParody },
    { label: "Misleading Context", detected: result.analysis.misleadingContext },
  ] : [];

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
                        {!isLoading && !result && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                            <Icons.barChart className="h-10 w-10 mx-auto mb-4" />
                            <p>{t('videoIntegrity.pendingText')}</p>
                        </div>
                        )}
                        {result && (
                          <div className="flex-1 flex flex-col min-h-0">
                            <div className="px-1 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-lg">Analysis Confidence</h3>
                                    <span className="font-bold text-2xl text-primary">{result.analysisConfidence.toFixed(0)}%</span>
                                </div>
                                <Progress value={result.analysisConfidence} />
                            </div>
                            <Separator className="my-4" />
                            <ScrollArea className="flex-1 -mr-4 pr-4">
                                <div className="space-y-3">
                                  {analysisItems.map((item) => (
                                    <div key={item.label} className="flex items-center justify-between text-sm">
                                      <p>{item.label}</p>
                                      {item.detected ? (
                                        <div className="flex items-center gap-2 text-destructive">
                                          <Icons.alert className="h-4 w-4" />
                                          <span>Detected</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                          <Icons.checkCircle className="h-4 w-4 text-primary" />
                                          <span>Not Detected</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {result.detectedText && (
                                    <>
                                      <Separator className="my-4" />
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
                                    </>
                                )}
                            </ScrollArea>
                          </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
