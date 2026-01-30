
import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService, ContractData } from './services/gemini.service';
import { PdfService } from './services/pdf.service';
import { ExcelService } from './services/excel.service';

interface FileQueueItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
}

interface ProcessedItem {
  id: string;
  fileName: string;
  data: ContractData;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private geminiService = inject(GeminiService);
  private pdfService = inject(PdfService);
  private excelService = inject(ExcelService);

  // Signals for state management
  apiKey = signal('');
  showApiKeyInput = signal(false);
  showHelp = signal(false); // New signal for help modal
  fileList = signal<FileQueueItem[]>([]);
  processedFiles = signal<ProcessedItem[]>([]);
  isDragging = signal(false);
  isProcessingQueue = signal(false);

  // Computed values
  pendingCount = computed(() => this.fileList().filter(f => f.status === 'pending').length);

  constructor() {
    // Load API Key from LocalStorage on Init
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      this.apiKey.set(storedKey);
    } else {
      // Safe access to process.env for development/build environments
      try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
           // @ts-ignore
           this.apiKey.set(process.env.API_KEY);
        }
      } catch (e) {
        // Ignore errors if process is not defined
      }
    }

    // Effect to save API Key when changed
    effect(() => {
      const key = this.apiKey();
      if (key) {
        localStorage.setItem('gemini_api_key', key);
      }
    });
  }

  toggleApiKey() {
    this.showApiKeyInput.update(v => !v);
  }

  toggleHelp() {
    this.showHelp.update(v => !v);
  }

  // Generate a random ID
  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  // Handle drag and drop visuals
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    
    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
    input.value = ''; // Reset input
  }

  private handleFiles(files: File[]) {
    const pdfFiles = files.filter(f => f.type === 'application/pdf');
    
    if (pdfFiles.length === 0) return;

    // Add to queue
    const newQueueItems: FileQueueItem[] = pdfFiles.map(file => ({
      id: this.generateId(),
      file,
      status: 'pending'
    }));

    this.fileList.update(list => [...list, ...newQueueItems]);
  }

  // Helper to check if item was removed (e.g. by Reset)
  private itemExists(id: string): boolean {
    return this.fileList().some(item => item.id === id);
  }

  async startProcessing() {
    if (!this.apiKey()) {
      alert("Harap masukkan Google Gemini API Key terlebih dahulu di pojok kanan atas.");
      this.showApiKeyInput.set(true);
      return;
    }

    if (this.isProcessingQueue()) return; // Already running
    if (this.pendingCount() === 0) return; // Nothing to do

    this.isProcessingQueue.set(true);
    await this.processQueue();
  }

  private async processQueue() {
    // Find next pending item
    const currentList = this.fileList();
    const pendingItem = currentList.find(item => item.status === 'pending');

    if (!pendingItem) {
      // All done
      this.isProcessingQueue.set(false);
      return; 
    }

    // Update status to processing
    this.updateStatus(pendingItem.id, 'processing');

    try {
      // 1. Convert PDF Pages
      const images = await this.pdfService.convertPdfToImages(pendingItem.file);

      // CHECK: If reset was clicked during PDF conversion, stop here.
      if (!this.itemExists(pendingItem.id)) {
        this.isProcessingQueue.set(false);
        return;
      }

      // 2. Send all images to Gemini with the current API Key
      const data = await this.geminiService.extractDataFromImages(images, this.apiKey());

      // CHECK: If reset was clicked during AI extraction, stop here.
      if (!this.itemExists(pendingItem.id)) {
        this.isProcessingQueue.set(false);
        return;
      }

      // 3. Add to processed list
      this.processedFiles.update(files => [
        ...files, 
        { 
          id: pendingItem.id, 
          fileName: pendingItem.file.name, 
          data 
        }
      ]);

      this.updateStatus(pendingItem.id, 'done');

    } catch (error) {
      // Only update error status if item still exists
      if (this.itemExists(pendingItem.id)) {
        console.error(`Error processing ${pendingItem.file.name}:`, error);
        this.updateStatus(pendingItem.id, 'error');
      }
    }

    // Process next item recursively
    await this.processQueue();
  }

  private updateStatus(id: string, status: FileQueueItem['status']) {
    this.fileList.update(list => 
      list.map(item => item.id === id ? { ...item, status } : item)
    );
  }

  removeFile(id: string) {
    this.processedFiles.update(files => files.filter(f => f.id !== id));
  }

  reset() {
    if(confirm("Apakah Anda yakin ingin menghapus semua data dan mulai ulang?")) {
      this.isProcessingQueue.set(false);
      this.fileList.set([]);
      this.processedFiles.set([]);
    }
  }

  downloadExcel() {
    const dataToExport = this.processedFiles().map(p => p.data);
    this.excelService.exportToExcel(dataToExport);
  }
}
