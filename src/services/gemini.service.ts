
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';

export interface ContractData {
  contractType: 'KODING' | 'PM' | 'UNKNOWN'; 
  pihak1: string;
  pihak2: string;
  nomorKksPihak1: string;
  nomorKksPihak2: string;
  kksTentang: string;
  hariKks: string;
  tanggalKks: string;
  
  // Data Personil
  namaPihak1: string;
  nipPihak1: string;
  jabatanPihak1: string;
  alamatPihak1: string;
  hpPihak1: string;
  emailPihak1: string;
  namaPihak2: string;
  nipPihak2: string;
  jabatanPihak2: string;
  alamatPihak2: string;
  hpPihak2: string;
  emailPihak2: string;
  
  // Data Umum / Koding (Legacy)
  sasaran: string; 
  totalBiaya: string;
  biayaPnbp: string;
  biayaNonPnbp: string;

  // Data Khusus PM (Pembelajaran Mendalam) - UPDATED
  sasaranKepsek: string;
  sasaranGuru: string;
  
  // Rincian Biaya Kepsek
  pnbpKepsek: string;
  nonPnbpKepsek: string;
  totalKepsek: string;

  // Rincian Biaya Guru
  pnbpGuru: string;
  nonPnbpGuru: string;
  totalGuru: string; // Total per 1 orang guru

  // Total Keseluruhan PM
  totalBiayaPelatihanPM: string; // NEW: Grand Total Extracted

  // Keuangan Umum
  setoranKasNegara: string;
  rekeningNomor: string;
  rekeningNama: string;
  rekeningBank: string;
  jangkaWaktu: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  
  constructor() {}

  async extractDataFromImages(images: string[], apiKey: string): Promise<ContractData> {
    // Initialize AI with the provided key per request
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const modelId = 'gemini-2.5-flash';

    const schema = {
      type: Type.OBJECT,
      properties: {
        contractType: { 
          type: Type.STRING, 
          enum: ['KODING', 'PM', 'UNKNOWN'],
          description: "Klasifikasi jenis kontrak. 'PM' jika ada kata 'Pembelajaran Mendalam' atau rincian biaya terpisah Guru vs Kepsek. 'KODING' jika terkait pelatihan 'Koding dan Kecerdasan Artifisial'." 
        },
        // PIHAK INSTANSI (HEADER)
        pihak1: { type: Type.STRING, description: "Nama INSTANSI Pihak 1 (Bukan nama orang). Contoh: 'Balai Guru Penggerak Provinsi Maluku Utara'." },
        pihak2: { type: Type.STRING, description: "Nama INSTANSI Pihak 2 (Bukan nama orang). Contoh: 'SMA Negeri 1 Ternate'." },
        
        // NOMOR KONTRAK
        nomorKksPihak1: { type: Type.STRING, description: "Nomor Dokumen Pihak 1. Ambil lengkap dengan garis miringnya. Biasanya di bagian atas kiri/tengah." },
        nomorKksPihak2: { type: Type.STRING, description: "Nomor Dokumen Pihak 2. Ambil lengkap dengan garis miringnya. Biasanya di bawah nomor pihak 1." },
        
        kksTentang: { type: Type.STRING, description: "Judul KKS / TENTANG ... (Ambil teks setelah kata TENTANG)" },
        hariKks: { type: Type.STRING, description: "Hari penandatanganan." },
        tanggalKks: { type: Type.STRING, description: "Tanggal penandatanganan." },
        
        // DETAIL PERSONAL PIHAK 1 (PEJABAT)
        namaPihak1: { type: Type.STRING, description: "Nama JELAS Pejabat Penandatangan Pihak 1 (Tanpa Gelar jika bisa). Cek bagian 'Yang bertanda tangan di bawah ini:' poin 1, ATAU lihat Tanda Tangan di halaman terakhir." },
        nipPihak1: { type: Type.STRING, description: "NIP Pihak 1 (18 digit). Pastikan akurat." },
        jabatanPihak1: { type: Type.STRING, description: "Jabatan Pihak 1." },
        alamatPihak1: { type: Type.STRING, description: "Alamat Kantor Pihak 1." },
        hpPihak1: { type: Type.STRING, description: "Nomor HP Pihak 1. WAJIB cari di Pasal 12 atau 'PEMBERITAHUAN' atau di bawah tanda tangan." },
        emailPihak1: { type: Type.STRING, description: "Email Pihak 1. WAJIB cari di Pasal 12 atau 'PEMBERITAHUAN'." },
        
        // DETAIL PERSONAL PIHAK 2 (PEJABAT SEKOLAH)
        namaPihak2: { type: Type.STRING, description: "Nama JELAS Pejabat Penandatangan Pihak 2 (Kepala Sekolah/Rektor). Cek bagian 'Yang bertanda tangan di bawah ini:' poin 2, ATAU lihat Tanda Tangan di halaman terakhir." },
        nipPihak2: { type: Type.STRING, description: "NIP Pihak 2." },
        jabatanPihak2: { type: Type.STRING, description: "Jabatan Pihak 2." },
        alamatPihak2: { type: Type.STRING, description: "Alamat Kantor Pihak 2." },
        hpPihak2: { type: Type.STRING, description: "Nomor HP Pihak 2. WAJIB cari di Pasal 12 atau 'PEMBERITAHUAN' atau di bawah tanda tangan." },
        emailPihak2: { type: Type.STRING, description: "Email Pihak 2. WAJIB cari di Pasal 12 atau 'PEMBERITAHUAN'." },
        
        // Data Koding (Legacy)
        sasaran: { type: Type.STRING, description: "Jumlah peserta/sasaran (KODING)." },
        totalBiaya: { type: Type.STRING, description: "Total Biaya Kontrak (KODING)." },
        biayaPnbp: { type: Type.STRING, description: "Biaya PNBP (KODING)." },
        biayaNonPnbp: { type: Type.STRING, description: "Biaya Non PNBP (KODING)." },

        // Data PM (Pembelajaran Mendalam)
        sasaranKepsek: { type: Type.STRING, description: "Jumlah Sasaran Kepala Sekolah (Cari di Pasal 3)." },
        sasaranGuru: { type: Type.STRING, description: "Jumlah Sasaran Guru (Cari di Pasal 3)." },
        
        // Cost Breakdown Kepsek
        pnbpKepsek: { type: Type.STRING, description: "Nilai PNBP Fungsional PER ORANG untuk Kepala Sekolah." },
        nonPnbpKepsek: { type: Type.STRING, description: "Nilai diluar komponen PNBP Fungsional PER ORANG untuk Kepala Sekolah." },
        totalKepsek: { type: Type.STRING, description: "Total Biaya PER ORANG untuk Kepala Sekolah." },

        // Cost Breakdown Guru
        pnbpGuru: { type: Type.STRING, description: "Nilai PNBP Fungsional PER ORANG untuk Guru." },
        nonPnbpGuru: { type: Type.STRING, description: "Nilai diluar komponen PNBP Fungsional PER ORANG untuk Guru." },
        totalGuru: { type: Type.STRING, description: "Total Biaya PER ORANG untuk Guru." },

        // Grand Total PM
        totalBiayaPelatihanPM: { type: Type.STRING, description: "TOTAL Biaya pelatihan yang dibayarkan (Cari di Pasal 5 - Tabel Paling Bawah/Kanan)." },

        // Keuangan Umum (CRITICAL ACCURACY)
        setoranKasNegara: { type: Type.STRING, description: "KHUSUS TIPE KODING. Nominal di Pasal 5 Pembiayaan, kalimat '...disetorkan ke kas negara sebesar...'. Jika tipe PM, biarkan kosong." },
        rekeningNomor: { type: Type.STRING, description: "Nomor Rekening Tujuan. Ekstrak HANYA ANGKA digit rekeningnya. Cek Pasal 6." },
        rekeningNama: { type: Type.STRING, description: "Nama Pemilik Rekening (Account Holder Name). Ambil string lengkap setelah 'atas nama' atau 'a.n'. Jangan disingkat. Cek Pasal 6." },
        rekeningBank: { type: Type.STRING, description: "Nama Bank (Contoh: BNI, BRI, Bank Mandiri). Cek Pasal 6." },
        jangkaWaktu: { type: Type.STRING, description: "Tanggal berakhir kontrak." },
      },
      required: ["contractType", "pihak1", "pihak2"],
    };

    // Prepare content parts (images + prompt)
    const parts: any[] = images.map(img => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: img
      }
    }));

    parts.push({
      text: `Anda adalah auditor kontrak legal yang sangat teliti. Ekstrak data dari gambar dokumen berikut ke dalam format JSON.
      
      ### INSTRUKSI KHUSUS UNTUK AKURASI TINGGI ###

      1. **PIHAK 1 & PIHAK 2 (JANGAN TERTUKAR)**:
         - **Nama Instansi** (field 'pihak1'/'pihak2'): Adalah nama Lembaga/Sekolah (Contoh: "SMA N 1...").
         - **Nama Pejabat** (field 'namaPihak1'/'namaPihak2'): Adalah nama ORANG yang menandatangani.
         - **Validasi**: Periksa bagian awal dokumen ("Yang bertanda tangan di bawah ini...") DAN bagian Tanda Tangan di halaman terakhir. Jika nama di awal berbeda dengan tanda tangan, **gunakan nama yang ada di Tanda Tangan**.
         - **NIP**: Pastikan NIP terdiri dari 18 digit angka jika tersedia.

      2. **NOMOR KONTRAK (KKS)**:
         - Cari di bagian Header (atas) dokumen.
         - Biasanya ada dua nomor: 
           - Nomor Pihak 1 (Milik Dinas/Balai).
           - Nomor Pihak 2 (Milik Sekolah/Mitra).
         - Salin nomor lengkap dengan tanda baca (misal: 1234/BGP.MU/2024).

      3. **DATA REKENING (PASAL 6)**:
         - Cari "Pasal 6" atau "Tata Cara Pembayaran".
         - **Nomor Rekening**: Ambil angka digitnya saja. Pastikan tidak ada angka yang terlewat.
         - **Nama Rekening**: Salin persis apa yang tertulis setelah kata "atas nama" atau "a.n.". 
           - Contoh: Jika tertulis "RPL 062 PS KGTK...", salin seluruhnya "RPL 062 PS KGTK...". Jangan dipotong.
         - **Bank**: Cari nama bank (BNI, BRI, Mandiri, BSI, dll).

      4. **KEUANGAN & TIPE KONTRAK**:
         - **TIPE 'PM'**: Jika judul mengandung "Pembelajaran Mendalam" atau ada tabel biaya terpisah Guru vs Kepsek.
           - Biaya Guru: Ambil biaya **SATUAN (PER ORANG)**. Jangan ambil total perkalian.
           - Total Biaya Pelatihan PM: Ambil angka Grand Total dari tabel biaya.
           - **Setoran Kas Negara**: UNTUK PM TIDAK ADA. Biarkan kosong string "".
         - **TIPE 'KODING'**: Jika judul "Koding dan Kecerdasan Artifisial".
           - **Setoran Kas Negara**: Cari di Pasal 5, kalimat "...disetorkan ke kas negara sebesar...". Ambil nominal Rupiahnya.

      5. **KONTAK (HP & EMAIL)**:
         - Wajib cari di **Pasal 12** atau pasal berjudul **"PEMBERITAHUAN"**.
         - Jika tidak ada di pasal tersebut, cari di bawah blok tanda tangan.
      
      Jika data tidak ditemukan sama sekali, isi dengan string kosong "".`
    });

    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      return JSON.parse(text) as ContractData;

    } catch (error) {
      console.error("Gemini Extraction Error:", error);
      // Return safer default
      return {
        contractType: 'UNKNOWN',
        pihak1: "", pihak2: "", nomorKksPihak1: "", nomorKksPihak2: "", kksTentang: "",
        hariKks: "", tanggalKks: "", namaPihak1: "", nipPihak1: "", jabatanPihak1: "",
        alamatPihak1: "", hpPihak1: "", emailPihak1: "", namaPihak2: "", nipPihak2: "",
        jabatanPihak2: "", alamatPihak2: "", hpPihak2: "", emailPihak2: "", 
        sasaran: "", totalBiaya: "", biayaPnbp: "", biayaNonPnbp: "",
        
        // New PM Defaults
        sasaranKepsek: "", sasaranGuru: "",
        pnbpKepsek: "", nonPnbpKepsek: "", totalKepsek: "",
        pnbpGuru: "", nonPnbpGuru: "", totalGuru: "",
        totalBiayaPelatihanPM: "",

        setoranKasNegara: "", rekeningNomor: "", rekeningNama: "", rekeningBank: "", jangkaWaktu: ""
      };
    }
  }
}
