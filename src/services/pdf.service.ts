
import { Injectable } from '@angular/core';

// Declare global PDFJS variable provided by the CDN script
declare const pdfjsLib: any;

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() {}

  async convertPdfToImages(file: File): Promise<string[]> {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF file
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    
    const images: string[] = [];
    const maxPages = 8; // Limit to 8 pages to prevent browser freezing on large docs

    // Helper to render a specific page to base64 jpeg
    const renderPage = async (pageNumber: number): Promise<string> => {
      const page = await pdf.getPage(pageNumber);
      const scale = 1.5; // Good balance between quality and token usage
      const viewport = page.getViewport({ scale: scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (!context) throw new Error("Canvas context not available");

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;

      // Convert canvas to base64 string (jpeg to save size)
      const base64String = canvas.toDataURL('image/jpeg', 0.8);
      
      // Remove the data URL prefix to get raw base64
      return base64String.split(',')[1];
    };

    // Process pages sequentially
    for (let i = 1; i <= Math.min(numPages, maxPages); i++) {
      const image = await renderPage(i);
      images.push(image);
    }

    return images;
  }
}
