
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { newsSleuthAnalysis, type NewsSleuthOutput, type NewsSleuthError } from "@/ai/flows/news-sleuth-flow";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ScrollArea } from "./ui/scroll-area";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/context/language-context";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

const formSchema = z.object({
  inputType: z.enum(["text", "url", "headline"]).default("text"),
  articleText: z.string().optional(),
  articleUrl: z.string().optional(),
  articleHeadline: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.inputType === 'text') {
    if (!data.articleText || data.articleText.length < 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['articleText'],
        message: 'Article text must be at least 100 characters long.',
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
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['articleUrl'], message: 'URL is required.' });
    } else {
      try {
        new URL(data.articleUrl);
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['articleUrl'], message: 'Please enter a valid URL.' });
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
  const [rawErrorResponse, setRawErrorResponse] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { language } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inputType: "text",
      articleText: "",
      articleUrl: "",
      articleHeadline: "",
    },
  });

  const inputType = form.watch("inputType");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setRawErrorResponse(null);

    let analysisInput: { [key: string]: string | undefined } = { language };
    if (values.inputType === 'text') {
      analysisInput = { ...analysisInput, articleText: values.articleText };
    } else if (values.inputType === 'url') {
      analysisInput = { ...analysisInput, articleUrl: values.articleUrl };
    } else if (values.inputType === 'headline') {
      analysisInput = { ...analysisInput, articleHeadline: values.articleHeadline };
    }
    
    try {
      const analysisResult = await newsSleuthAnalysis(analysisInput);
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
  
  const getAssessmentBadgeVariant = (assessment: string) => {
    const lowerAssessment = assessment.toLowerCase();
    if (lowerAssessment.includes('very low') || lowerAssessment.includes('unreliable') || lowerAssessment.includes('sensationalist')) return 'destructive';
    if (lowerAssessment.includes('low') || lowerAssessment.includes('weak')) return 'destructive';
    if (lowerAssessment.includes('medium')) return 'secondary';
    if (lowerAssessment.includes('high') || lowerAssessment.includes('reliable') || lowerAssessment.includes('neutral')) return 'default';
    return 'secondary';
  };

  return (
    <div className="w-full flex-1 bg-gradient-to-br from-background to-muted/40 py-8 px-4">
      <div className="container mx-auto flex flex-col items-center gap-8 max-w-5xl">
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
                                <RadioGroupItem value="text" id="text" />
                              </FormControl>
                              <FormLabel htmlFor="text" className="font-normal cursor-pointer">{t('newsSleuth.inputTextLabel')}</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="url" id="url" />
                              </FormControl>
                              <FormLabel htmlFor="url" className="font-normal cursor-pointer">{t('newsSleuth.inputUrlLabel')}</FormLabel>
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
              <CardTitle className="text-xl">{t('newsSleuth.reportTitle')}</CardTitle>
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
              {!isLoading && !result && !rawErrorResponse && (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                  <Icons.barChart className="mx-auto mb-4 h-10 w-10" />
                  <p>{t('newsSleuth.pendingText')}</p>
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
                 <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-1 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">Overall Credibility Score</h3>
                            <span className="font-bold text-2xl text-primary">{result.overall_credibility_score.score}/100</span>
                        </div>
                        <Progress value={result.overall_credibility_score.score} indicatorClassName={getProgressIndicatorClassName(result.overall_credibility_score.score)} />
                         <p className="text-sm text-muted-foreground">{result.overall_credibility_score.description}</p>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex-1 min-h-0">
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-6">

                              <Accordion type="single" collapsible defaultValue="item-1">
                                <AccordionItem value="item-1">
                                  <AccordionTrigger>
                                    <div className="flex items-center justify-between w-full">
                                      <span>Factual Accuracy</span>
                                      <Badge variant={getAssessmentBadgeVariant(result.credibility_analysis.factual_accuracy.assessment)}>{result.credibility_analysis.factual_accuracy.assessment}</Badge>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <p className="text-sm text-muted-foreground">{result.credibility_analysis.factual_accuracy.details}</p>
                                  </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2">
                                  <AccordionTrigger>
                                     <div className="flex items-center justify-between w-full">
                                      <span>Sourcing</span>
                                      <Badge variant={getAssessmentBadgeVariant(result.credibility_analysis.sourcing.assessment)}>{result.credibility_analysis.sourcing.assessment}</Badge>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <p className="text-sm text-muted-foreground">{result.credibility_analysis.sourcing.details}</p>
                                  </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3">
                                  <AccordionTrigger>
                                     <div className="flex items-center justify-between w-full">
                                      <span>Bias and Tone</span>
                                      <Badge variant={getAssessmentBadgeVariant(result.credibility_analysis.bias_and_tone.assessment)}>{result.credibility_analysis.bias_and_tone.assessment}</Badge>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <p className="text-sm text-muted-foreground">{result.credibility_analysis.bias_and_tone.details}</p>
                                  </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-4">
                                  <AccordionTrigger>Author and Publication Reputation</AccordionTrigger>
                                  <AccordionContent>
                                    <div className="space-y-2">
                                      <p className="text-sm font-semibold">Publication Reputation:</p>
                                      <p className="text-sm text-muted-foreground">{result.credibility_analysis.author_and_publication_reputation.publication_reputation}</p>
                                      <p className="text-sm font-semibold mt-2">Author Expertise:</p>
                                      <p className="text-sm text-muted-foreground">{result.credibility_analysis.author_and_publication_reputation.author_expertise}</p>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-5">
                                  <AccordionTrigger>
                                    <div className="flex items-center justify-between w-full">
                                      <span>Logical Fallacies</span>
                                       <Badge variant={result.credibility_analysis.logical_fallacies.present ? 'destructive' : 'default'}>{result.credibility_analysis.logical_fallacies.present ? "Present" : "Not Present"}</Badge>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <p className="text-sm text-muted-foreground">{result.credibility_analysis.logical_fallacies.details}</p>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>

                                <Separator />
                                <Alert>
                                  <Icons.shield className="h-4 w-4" />
                                  <AlertTitle>Conclusion & Recommendation</AlertTitle>
                                  <AlertDescription>
                                    <p className="font-semibold mt-2">Summary:</p>
                                    <p className="text-sm text-muted-foreground mt-1">{result.conclusion_and_recommendation.summary}</p>
                                    <p className="font-semibold mt-4">Reader Advice:</p>
                                    <p className="text-sm text-muted-foreground mt-1">{result.conclusion_and_recommendation.reader_advice}</p>
                                  </AlertDescription>
                                </Alert>

                                <Separator />
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Article Information</h3>
                                     <div className="text-sm text-muted-foreground space-y-1">
                                        <p><span className="font-semibold text-foreground">Title:</span> {result.article_info.title}</p>
                                        {result.article_info.url && <p><span className="font-semibold text-foreground">URL:</span> <Link href={result.article_info.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{result.article_info.url}</Link></p>}
                                        {result.article_info.publication && <p><span className="font-semibold text-foreground">Publication:</span> {result.article_info.publication}</p>}
                                        {result.article_info.author && <p><span className="font-semibold text-foreground">Author:</span> {result.article_info.author}</p>}
                                        {result.article_info.publication_date && <p><span className="font-semibold text-foreground">Date:</span> {result.article_info.publication_date}</p>}
                                        {result.article_info.category && <p><span className="font-semibold text-foreground">Category:</span> {result.article_info.category}</p>}
                                     </div>
                                </div>

                            </div>
                        </ScrollArea>
                    </div>
                 </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
