import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function VideoPage() {
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
            Video Integrity Check
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            In an age of sophisticated digital manipulation, verifying the authenticity of video content is crucial. Our advanced AI-powered tool analyzes video files to detect deepfakes, alterations, and other forms of tampering, ensuring you can trust what you see.
          </p>
          <Button size="lg" asChild>
            <Link href="/video/analysis">Launch Video Integrity</Link>
          </Button>
        </div>
        <Card className="bg-card/50">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold font-heading mb-6">Key Features</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-4 mt-1 shrink-0" />
                <div>
                  <h4 className="font-semibold">Deepfake Detection</h4>
                  <p className="text-muted-foreground text-sm">
                    Utilizes cutting-edge neural networks to identify AI-generated or manipulated faces and voices.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-4 mt-1 shrink-0" />
                <div>
                  <h4 className="font-semibold">Content Provenance</h4>
                  <p className="text-muted-foreground text-sm">
                    Traces the origin and history of the video content to verify its source and authenticity.
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-primary mr-4 mt-1 shrink-0" />
                <div>
                  <h4 className="font-semibold">Manipulation Analysis</h4>
                  <p className="text-muted-foreground text-sm">
                    Scans for signs of editing, splicing, or other alterations that could distort the original context.
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
