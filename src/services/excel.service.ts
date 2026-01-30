
import { Injectable } from '@angular/core';
import { ContractData } from './gemini.service';

declare const XLSX: any;

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  exportToExcel(data: ContractData[], filename: string = 'Rekap_KKS.xlsx') {
    // Map data to headers
    const wsData = data.map(item => ({
      'Tipe Kontrak': item.contractType,
      'Pihak 1': item.pihak1,
      'Pihak 2': item.pihak2,
      'Nomor KKS Pihak 1': item.nomorKksPihak1,
      'Nomor KKS Pihak 2': item.nomorKksPihak2,
      'KKS Tentang': item.kksTentang,
      'Hari KKS': item.hariKks,
      'Tanggal KKS': item.tanggalKks,
      'Nama Pihak 1': item.namaPihak1,
      'NIP Pihak 1': item.nipPihak1,
      'Jabatan Pihak 1': item.jabatanPihak1,
      'Alamat Pihak 1': item.alamatPihak1,
      'HP Pihak 1': item.hpPihak1,
      'Email Pihak 1': item.emailPihak1,
      'Nama Pihak 2': item.namaPihak2,
      'NIP Pihak 2': item.nipPihak2,
      'Jabatan Pihak 2': item.jabatanPihak2,
      'Alamat Pihak 2': item.alamatPihak2,
      'HP Pihak 2': item.hpPihak2,
      'Email Pihak 2': item.emailPihak2,
      
      // General / Legacy Format
      'Sasaran (Koding)': item.sasaran,
      'Total Biaya (Koding)': item.totalBiaya,
      'Biaya PNBP (Koding)': item.biayaPnbp,
      'Biaya Non-PNBP (Koding)': item.biayaNonPnbp,

      // PM Format - KEPSEK
      'Sasaran Kepsek (PM)': item.sasaranKepsek,
      'PNBP Kepsek (PM)': item.pnbpKepsek,
      'Non-PNBP Kepsek (PM)': item.nonPnbpKepsek,
      'Total Kepsek (PM)': item.totalKepsek,

      // PM Format - GURU
      'Sasaran Guru (PM)': item.sasaranGuru,
      'PNBP 1 Guru (PM)': item.pnbpGuru,
      'Non-PNBP 1 Guru (PM)': item.nonPnbpGuru,
      'Total Biaya Per 1 Guru (PM)': item.totalGuru,

      // PM Format - GRAND TOTAL
      'Total Biaya Pelatihan (PM)': item.totalBiayaPelatihanPM,

      'Setoran ke Kas Negara': item.setoranKasNegara,
      'Nomor Rekening RPL': item.rekeningNomor,
      'Nama Rekening RPL': item.rekeningNama,
      'Bank Rekening RPL': item.rekeningBank,
      'Jangka Waktu Kontrak Sampai Tanggal': item.jangkaWaktu,
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    
    // Auto-width columns (basic logic)
    const wscols = Object.keys(wsData[0] || {}).map(() => ({ wch: 25 }));
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap KKS");

    XLSX.writeFile(wb, filename);
  }
}
