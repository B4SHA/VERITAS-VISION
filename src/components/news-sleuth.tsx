
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
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { ScrollArea } from "./ui/scroll-area";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/context/language-context";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const formSchema = z.object({
  inputType: z.enum(["text", "headline"]).default("text"),
  articleText: z.string().optional(),
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
      inputType: "text",
      articleText: "",
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
    } else if (values.inputType === 'headline') {
      analysisInput = { ...analysisInput, articleHeadline: values.articleHeadline };
    }
    
    try {
      const analysisResult = await newsSleuthAnalysis(analysisInput);
      if ('error' in analysisResult) {
        setErrorResponse(analysisResult);
        toast({
            variant: "destructive",
            title: "Analysis Failed",
            description: analysisResult.details || "The AI model failed to generate a response.",
        });
      } else {
        setResult(analysisResult);
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

  const getProgressIndicatorClassName = (score: number) => {
    if (score < 40) return "bg-destructive";
    if (score < 70) return "bg-accent";
    return "bg-primary";
  };
  
  const getVerdictBadgeVariant = (verdict: string) => {
    const lowerVerdict = verdict.toLowerCase();
    if (lowerVerdict.includes('real')) return 'default';
    if (lowerVerdict.includes('fake')) return 'destructive';
    return 'secondary';
  };

  const AnalysisItem = ({ title, content }: { title: string, content: string | string[] }) => (
    <AccordionItem value={title.toLowerCase().replace(/\s/g, '-')}>
      <AccordionTrigger>
        <div className="flex items-center justify-between w-full">
          <span>{title}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {Array.isArray(content) ? (
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            {content.map((point, i) => <li key={i}>{point}</li>)}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{content}</p>
        )}
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
                                form.clearErrors(['articleText', 'articleHeadline']);
                            }}
                            defaultValue={field.value}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                          >
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
              {!isLoading && !result && !errorResponse && (
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
                          {errorResponse.details || 'The AI model failed to generate a response.'}
                      </pre>
                  </ScrollArea>
                </div>
              )}
              {result && (
                 <ScrollArea className="h-full pr-4">
                  <div className="space-y-6">

                      <Card>
                          <CardHeader>
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Overall Score</CardTitle>
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

                      <Accordion type="multiple" defaultValue={['reasoning', 'flagged-content']} className="w-full">
                        <AnalysisItem title="Reasoning" content={result.reasoning} />
                        <AnalysisItem title="Biases" content={result.biases} />
                        <AnalysisItem title="Flagged Content" content={result.flaggedContent} />
                        
                        {result.sources && result.sources.length > 0 && (
                          <AccordionItem value="sources">
                             <AccordionTrigger>
                                <div className="flex items-center justify-between w-full">
                                  <span>Sources Used</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                                  {result.sources.map((source, i) => (
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
