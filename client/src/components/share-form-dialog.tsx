import { useState, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, Link as LinkIcon, Check, Copy, QrCode, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";

interface ShareFormDialogProps {
  formId: string;
  formTitle: string;
  trigger?: React.ReactNode;
}

export function ShareFormDialog({ formId, formTitle, trigger }: ShareFormDialogProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const qrRef = useRef<SVGSVGElement>(null);
  
  const shareUrl = `${window.location.origin}/forms/${formId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Form link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try selecting the text and copying manually.",
        variant: "destructive",
      });
    }
  };

  const downloadQR = () => {
    if (!qrRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width || 180;
      canvas.height = img.height || 180;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${formTitle.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2 px-2 sm:px-3">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] overflow-y-auto rounded-2xl bg-card/95 text-foreground border border-border/60 shadow-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Form</DialogTitle>
          <DialogDescription>
            Share "{formTitle}" with your audience.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Form Link</label>
            <div className="flex items-center gap-2">
              <Input 
                readOnly 
                value={shareUrl} 
                className="min-w-0 flex-1 bg-muted/40 border-border/60 text-sm"
                data-testid="input-share-url"
              />
              <Button 
                size="icon" 
                variant="outline" 
                onClick={copyToClipboard}
                data-testid="button-copy-link"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 p-6 bg-muted/20 rounded-xl border border-border/60">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <QRCodeSVG 
                ref={qrRef}
                value={shareUrl} 
                size={160}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#0f172a"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">QR Code</p>
              <p className="text-xs text-muted-foreground mt-1">Scan to open the form instantly</p>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="gap-2" 
              onClick={downloadQR}
              data-testid="button-download-qr"
            >
              <Download className="h-4 w-4" />
              Download QR
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2"
            onClick={() => window.open(shareUrl, '_blank')}
          >
            <LinkIcon className="h-4 w-4" />
            Open in new tab
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
