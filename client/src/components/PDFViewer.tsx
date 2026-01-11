import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, X } from 'lucide-react';

interface PDFViewerProps {
  pdfPath: string;
  title?: string;
  trigger?: React.ReactNode;
  watermark?: string;
  inline?: boolean;
}

export function PDFViewer({ pdfPath, title = "Preview PDF", trigger, watermark, inline = false }: PDFViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const handleOpenExternal = () => {
    window.open(pdfPath, '_blank', 'noopener,noreferrer');
  };

  const handleIframeError = () => {
    console.error('Error loading PDF in iframe:', pdfPath);
    setLoadError(true);
  };

  const handleIframeLoad = () => {
    setLoadError(false);
    setTimeout(() => {
      try {
        const iframe = document.querySelector('[data-testid="pdf-iframe"]') as HTMLIFrameElement;
        if (iframe && iframe.contentDocument) {
          const content = iframe.contentDocument.body?.textContent || '';
          if (content.includes('blocked') || content.includes('This page has been blocked')) {
            setLoadError(true);
          }
        }
      } catch (e) { }
    }, 1000);
  };

  const viewerContent = (
    <div className="flex flex-col h-full w-full">
      <div className="relative flex-1 min-h-0 border rounded-lg overflow-hidden bg-gray-100">
        {/* Visual Watermark Overlay */}
        {watermark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden select-none">
            <div className="text-gray-400 opacity-[0.15] text-4xl md:text-7xl font-bold transform -rotate-45 whitespace-nowrap uppercase tracking-widest text-center">
              {watermark}<br />
              <span className="text-xl md:text-2xl opacity-50">{new Date().toLocaleDateString('id-ID')}</span>
            </div>
          </div>
        )}

        {/* Print Watermark (Hidden in UI, Visible when Printing) */}
        {watermark && (
          <div className="hidden print:block fixed inset-0 flex items-center justify-center pointer-events-none z-[9999] overflow-hidden">
            <div className="text-black/10 text-8xl font-bold transform -rotate-45 whitespace-nowrap uppercase tracking-[1em]">
              {watermark}
            </div>
          </div>
        )}

        {loadError ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 p-4 bg-white">
            <FileText className="w-12 h-12 mb-4 text-gray-400" />
            <p className="text-sm mb-2 text-center font-medium">Preview PDF tidak tersedia</p>
            <p className="text-xs text-gray-500 mb-4 text-center max-w-xs">
              Preview dibatasi oleh browser. Silakan buka dokumen di tab baru.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenExternal}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Buka di Tab Baru
            </Button>
          </div>
        ) : (
          <iframe
            src={`${pdfPath}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
            className="w-full h-full border-0"
            title={title}
            data-testid="pdf-iframe"
            onError={handleIframeError}
            onLoad={handleIframeLoad}
          />
        )}
      </div>

      {!inline && (
        <div className="flex-shrink-0 text-[10px] text-gray-500 text-center pt-2">
          💡 Tips: Geser atau gunakan toolbar di dalam preview untuk kontrol PDF lebih lengkap.
        </div>
      )}
    </div>
  );

  if (inline) {
    return viewerContent;
  }

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center space-x-2"
      data-testid="pdf-viewer-trigger"
    >
      <FileText className="w-4 h-4" />
      <span>Preview PDF</span>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col pt-12">
        <DialogHeader className="flex-shrink-0 absolute top-0 left-0 right-0 h-12 flex items-center px-4 border-b bg-white z-20">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="text-base truncate max-w-md">{title}</DialogTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenExternal}
                className="flex items-center space-x-1 h-8"
                data-testid="pdf-external-link"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-xs">Tab Baru</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 pt-2">
          {viewerContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}