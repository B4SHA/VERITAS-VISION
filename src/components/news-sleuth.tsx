
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { newsSleuthAnalysis } from "@/ai/flows/news-sleuth-flow";
import type { NewsSleuthOutput, NewsSleuthError } from "@/ai/schemas";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { ScrollArea } from "./ui/scroll-area";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/context/language-context";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const formSchema = z.object({
  inputType: z.enum(["text", "url", "headline"]).default("text"),
  articleText: z.string().optional(),
  articleUrl: z.string().optional(),
  articleHeadline: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.inputType === 'text') {
    if (!data.articleText || data.articleText.length < 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['articleText'],
        message: 'Article text must be at least 50 characters long.',
      });
    }
    if (data.articleText && data.articleText.length > 15000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['articleText'],
        message: 'Article text must be less than 15,000 characters.',
      });
    }
  }
  if (data.inputType === 'url') {
    if (!data.articleUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['articleUrl'],
        message: 'Article URL is required.',
      });
    } else {
      try {
        new URL(data.articleUrl);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['articleUrl'],
          message: 'Please enter a valid URL.',
        });
      }
    }
  }
  if (data.inputType === 'headline') {
    if (!data.articleHeadline || data.articleHeadline.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['articleHeadline'],
        message: 'Headline must be at least 10 characters long.',
      });
    }
     if (data.articleHeadline && data.articleHeadline.length > 200) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['articleHeadline'],
        message: 'Headline must be less than 200 characters.',
      });
    }
  }
});

export function NewsSleuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<NewsSleuthOutput | null>(null);
  const [errorResponse, setErrorResponse] = useState<NewsSleuthError | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { language } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inputType: "url",
      articleText: "",
      articleUrl: "",
      articleHeadline: "",
    },
  });

  const inputType = form.watch("inputType");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setErrorResponse(null);

    let analysisInput: { [key: string]: any } = { language };
    if (values.inputType === 'text') {
      analysisInput = { ...analysisInput, articleText: values.articleText };
    } else if (values.inputType === 'url') {
      analysisInput = { ...analysisInput, articleUrl: values.articleUrl };
    } else if (values.inputType === 'headline') {
      analysisInput = { ...analysisInput, articleHeadline: values.articleHeadline };
    }
    
    try {
      const analysisResult = await newsSleuthAnalysis(analysisInput);
      if (analysisResult && 'error' in analysisResult) {
        setErrorResponse(analysisResult);
        toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: analysisResult.details || "The AI model failed to generate a response.",
        });
      } else if (analysisResult) {
        setResult(analysisResult as NewsSleuthOutput);
      } else {
        setErrorResponse({error: "NO_RESPONSE", details: "An unexpected response was received from the server."});
      }
    } catch (error) {
      console.error(error);
      const errorDetails = error instanceof Error ? error.message : "An unexpected error occurred.";
      setErrorResponse({ error: "UNEXPECTED_ERROR", details: errorDetails });
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: errorDetails,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const getProgressValue = (score: number) => (score / 5) * 100;
  
  const getProgressIndicatorClassName = (score: number) => {
    if (score < 2.5) return "bg-destructive";
    if (score < 4.0) return "bg-accent";
    return "bg-primary";
  };
  
  const AnalysisSection = ({ title, data, assessment }: { title: string; data: string[]; assessment: string }) => {
    if (!data) return null;
    return (
        <AccordionItem value={title.toLowerCase().replace(/\s/g, '-')}>
        <AccordionTrigger>
            <div className="flex items-center justify-between w-full">
            <span>{title}</span>
            <span className="text-sm font-medium text-muted-foreground">{assessment}</span>
            </div>
        </AccordionTrigger>
        <AccordionContent>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                {data.map((point, i) => <li key={i}>{point}</li>)}
            </ul>
        </AccordionContent>
        </AccordionItem>
    );
  };

  const report = result;

  return (
    <div className="w-full flex-1 bg-gradient-to-br from-background to-muted/40 py-8 px-4">
      <div className="container mx-auto flex flex-col items-center gap-8 max-w-7xl">
        <div className="text-center w-full">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-foreground mb-2">
            {t('newsSleuth.title')}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('newsSleuth.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-start gap-8 w-full">
          <Card className="w-full shadow-lg border-2 border-border/80 bg-background/80 backdrop-blur-sm flex flex-col">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Icons.news className="h-6 w-6" />
                    {t('newsSleuth.inputTitle')}
                  </CardTitle>
                  <CardDescription>
                    {t('newsSleuth.inputDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                  <FormField
                    control={form.control}
                    name="inputType"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => {
                                field.onChange(value);
                                form.clearErrors(['articleText', 'articleUrl', 'articleHeadline']);
                            }}
                            defaultValue={field.value}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="url" id="url" />
                              </FormControl>
                              <FormLabel htmlFor="url" className="font-normal cursor-pointer">{t('newsSleuth.inputUrlLabel')}</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="text" id="text" />
                              </FormControl>
                              <FormLabel htmlFor="text" className="font-normal cursor-pointer">{t('newsSleuth.inputTextLabel')}</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="headline" id="headline" />
                              </FormControl>
                              <FormLabel htmlFor="headline" className="font-normal cursor-pointer">{t('newsSleuth.inputHeadlineLabel')}</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div>
                    {inputType === "text" && (
                      <FormField
                        control={form.control}
                        name="articleText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('newsSleuth.inputTextLabel')}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={t('newsSleuth.inputTextPlaceholder')}
                                className="h-[250px] resize-y"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {inputType === "url" && (
                      <FormField
                        control={form.control}
                        name="articleUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('newsSleuth.inputUrlLabel')}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={t('newsSleuth.inputUrlPlaceholder')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {inputType === "headline" && (
                      <FormField
                        control={form.control}
                        name="articleHeadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('newsSleuth.inputHeadlineLabel')}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={t('newsSleuth.inputHeadlinePlaceholder')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg font-semibold">
                    {isLoading && <Icons.spinner className="mr-2" />}
                    {t('newsSleuth.analyzeButton')}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
          
          <Card className="w-full shadow-lg border-2 border-border/80 bg-background/80 backdrop-blur-sm flex flex-col min-h-[500px] lg:min-h-[700px]">
            <CardHeader>
              <CardTitle className="text-xl">{report?.report_title || t('newsSleuth.reportTitle')}</CardTitle>
              <CardDescription>
                {t('newsSleuth.reportDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              {isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
                  <Icons.spinner className="h-10 w-10 text-primary" />
                  <p className="text-center text-muted-foreground">{t('newsSleuth.analyzingText')}</p>
                </div>
              )}
              {!isLoading && !report && !errorResponse && (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                  <Icons.barChart className="mx-auto mb-4 h-10 w-10" />
                  <p>{t('newsSleuth.pendingText')}</p>
                </div>
              )}
              {errorResponse && (
                <div className="flex-1 flex flex-col min-h-0">
                  <h3 className="font-semibold text-lg mb-2 px-1 text-destructive">Analysis Failed</h3>
                  <ScrollArea className="flex-1 pr-4 -mr-4">
                      <pre className="text-sm leading-relaxed text-destructive/80 whitespace-pre-wrap break-words bg-destructive/10 p-4 rounded-md">
                          {errorResponse.details || 'An unexpected error occurred.'}
                      </pre>
                  </ScrollArea>
                </div>
              )}
              {report && (
                 <ScrollArea className="h-full pr-4">
                  <div className="space-y-6">
                    {report.overall_credibility_score && (
                      <Card>
                          <CardHeader>
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Overall Score</CardTitle>
                              </div>
                          </CardHeader>
                          <CardContent>
                              <div className="flex items-baseline gap-4">
                                <span className="font-bold text-5xl text-primary">{report.overall_credibility_score.score.toFixed(1)}</span>
                                <span className="text-muted-foreground text-lg">/ 5.0</span>
                              </div>
                              <Progress value={getProgressValue(report.overall_credibility_score.score)} indicatorClassName={getProgressIndicatorClassName(report.overall_credibility_score.score)} className="my-3"/>
                              <p className="text-sm text-muted-foreground">{report.overall_credibility_score.reasoning}</p>
                          </CardContent>
                      </Card>
                    )}

                    {report.article_details && (
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">{report.article_details.title}</h3>
                        <p className="text-sm text-muted-foreground italic">
                            <strong>Main Claim:</strong> {report.article_details.main_claim}
                        </p>
                      </div>
                    )}

                    {report.analysis && (
                      <Accordion type="multiple" defaultValue={['factual-accuracy', 'source-reliability', 'bias-manipulation', 'recommendations', 'sources']} className="w-full">
                        {report.analysis.factual_accuracy && <AnalysisSection title="Factual Accuracy" data={report.analysis.factual_accuracy.supporting_points} assessment={report.analysis.factual_accuracy.assessment} />}
                        {report.analysis.source_reliability && <AnalysisSection title="Source Reliability" data={report.analysis.source_reliability.supporting_points} assessment={report.analysis.source_reliability.assessment} />}
                        {report.analysis.bias_manipulation && <AnalysisSection title="Bias & Manipulation" data={report.analysis.bias_manipulation.supporting_points} assessment={report.analysis.bias_manipulation.assessment} />}
                        
                        {report.recommendations && (
                          <AccordionItem value="recommendations">
                              <AccordionTrigger>Recommendations</AccordionTrigger>
                              <AccordionContent>
                                  <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                                      {report.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                                  </ul>
                              </AccordionContent>
                          </AccordionItem>
                        )}

                        {report.sources && report.sources.length > 0 && (
                          <AccordionItem value="sources">
                             <AccordionTrigger>
                                <div className="flex items-center justify-between w-full">
                                  <span>Sources Used</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                                  {report.sources.map((source, i) => (
                                    <li key={i}>
                                      <Link href={source} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                                        {source}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </AccordionContent>
                          </AccordionItem>
                        )}
                      </Accordion>
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
