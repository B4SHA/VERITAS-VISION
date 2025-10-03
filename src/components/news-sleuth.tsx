
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
    if (score < 2) return "bg-destructive";
    if (score < 3.5) return "bg-accent";
    return "bg-primary";
  };
  
  const getAssessmentBadgeVariant = (assessment: string) => {
    const lowerAssessment = assessment.toLowerCase();
    if (lowerAssessment.includes('very low') || lowerAssessment.includes('unreliable') || lowerAssessment.includes('sensationalist')) return 'destructive';
    if (lowerAssessment.includes('low') || lowerAssessment.includes('weak')) return 'destructive';
    if (lowerAssessment.includes('medium') || lowerAssessment.includes('moderate')) return 'secondary';
    if (lowerAssessment.includes('high') || lowerAssessment.includes('reliable') || lowerAssessment.includes('neutral')) return 'default';
    return 'secondary';
  };

  const AnalysisItem = ({ title, assessment, points }: { title: string, assessment: string, points: string[] }) => (
    <AccordionItem value={title.toLowerCase().replace(/\s/g, '-')}>
      <AccordionTrigger>
        <div className="flex items-center justify-between w-full">
          <span>{title}</span>
          <Badge variant={getAssessmentBadgeVariant(assessment)}>{assessment}</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
          {points.map((point, i) => <li key={i}>{point}</li>)}
        </ul>
      </AccordionContent>
    </AccordionItem>
  );

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
              <CardTitle className="text-xl">{result ? result.report_title : t('newsSleuth.reportTitle')}</CardTitle>
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
                 <ScrollArea className="h-full pr-4">
                  <div className="space-y-6">

                      <Card>
                          <CardHeader>
                              <CardTitle className="text-lg">Overall Score</CardTitle>
                          </CardHeader>
                          <CardContent>
                              <div className="flex items-baseline gap-4">
                                <span className="font-bold text-5xl text-primary">{result.overall_credibility_score.score.toFixed(1)}</span>
                                <span className="text-muted-foreground text-lg">/ 5.0</span>
                              </div>
                              <Progress value={result.overall_credibility_score.score * 20} indicatorClassName={getProgressIndicatorClassName(result.overall_credibility_score.score)} className="my-3"/>
                              <p className="text-sm text-muted-foreground">{result.overall_credibility_score.reasoning}</p>
                          </CardContent>
                      </Card>

                      <Accordion type="multiple" defaultValue={['analysis']} className="w-full">
                        <AccordionItem value="analysis">
                          <AccordionTrigger className="text-lg font-semibold">Detailed Analysis</AccordionTrigger>
                          <AccordionContent>
                              <Accordion type="multiple" className="w-full space-y-1">
                                <AnalysisItem title="Factual Accuracy" assessment={result.analysis.factual_accuracy.assessment} points={result.analysis.factual_accuracy.supporting_points} />
                                <AnalysisItem title="Source Reliability" assessment={result.analysis.source_reliability.assessment} points={result.analysis.source_reliability.supporting_points} />
                                <AnalysisItem title="Bias & Manipulation" assessment={result.analysis.bias_manipulation.assessment} points={result.analysis.bias_manipulation.supporting_points} />
                                <AnalysisItem title="Author Expertise" assessment={result.analysis.author_expertise.assessment} points={result.analysis.author_expertise.supporting_points} />
                              </Accordion>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="recommendations">
                          <AccordionTrigger className="text-lg font-semibold">Recommendations</AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                                {result.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="details">
                          <AccordionTrigger className="text-lg font-semibold">Article & Publication Details</AccordionTrigger>
                          <AccordionContent className="space-y-4">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Article Details</CardTitle>
                              </CardHeader>
                              <CardContent className="text-sm space-y-1">
                                <p><span className="font-semibold text-foreground">Title:</span> {result.article_details.title}</p>
                                <p><span className="font-semibold text-foreground">Author:</span> {result.article_details.author}</p>
                                <p><span className="font-semibold text-foreground">Date:</span> {result.article_details.publication_date}</p>
                                <p><span className="font-semibold text-foreground">Main Claim:</span> {result.article_details.main_claim}</p>
                                <p><span className="font-semibold text-foreground">URL:</span> <Link href={result.article_details.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{result.article_details.url}</Link></p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                  <span className="font-semibold text-foreground">Keywords:</span>
                                  {result.article_details.keywords.map(kw => <Badge key={kw} variant="secondary">{kw}</Badge>)}
                                </div>
                              </CardContent>
                            </Card>
                             <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Publication Details</CardTitle>
                              </CardHeader>
                              <CardContent className="text-sm space-y-1">
                                <p><span className="font-semibold text-foreground">Name:</span> <Link href={result.publication_details.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{result.publication_details.name}</Link></p>
                                <p><span className="font-semibold text-foreground">Type:</span> {result.publication_details.publication_type}</p>
                                <p><span className="font-semibold text-foreground">Reputation:</span> {result.publication_details.reputation}</p>
                              </CardContent>
                            </Card>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>

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
