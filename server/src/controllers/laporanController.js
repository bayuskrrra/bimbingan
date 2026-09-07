import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import prisma from '../prisma.js';
import { getThresholdSettings, evaluatePointZone } from '../utils/thresholds.js';

export const exportExcel = async (req, res, next) => {
  try {
    const { kelas, startDate, endDate, siswaId } = req.query;
    const thresholds = await getThresholdSettings();

    // Query Siswa
    const siswaWhere = {};
    if (kelas && kelas !== 'SEMUA') siswaWhere.kelas = kelas;
    if (siswaId) siswaWhere.id = siswaId;

    const siswaList = await prisma.siswa.findMany({
      where: siswaWhere,
      orderBy: [{ kelas: 'asc' }, { nama: 'asc' }],
      include: {
        pelanggaran: { select: { poinSaatItu: true } },
        kasusUtama: { select: { id: true, status: true } },
      },
    });

    // Query Pelanggaran
    const pelanggaranWhere = {};
    if (kelas && kelas !== 'SEMUA') pelanggaranWhere.siswa = { kelas };
    if (siswaId) pelanggaranWhere.siswaId = siswaId;
    if (startDate || endDate) {
      pelanggaranWhere.tanggal = {};
      if (startDate) pelanggaranWhere.tanggal.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        pelanggaranWhere.tanggal.lte = end;
      }
    }

    const pelanggaranList = await prisma.pelanggaranSiswa.findMany({
      where: pelanggaranWhere,
      orderBy: { tanggal: 'desc' },
      include: {
        siswa: true,
        jenisPelanggaran: true,
        dicatatOleh: { select: { nama: true } },
      },
    });

    // Query Kasus
    const kasusWhere = {};
    if (siswaId) {
      kasusWhere.OR = [
        { siswaUtamaId: siswaId },
        { pihakTerlibat: { some: { siswaId } } },
      ];
    }
    if (kelas && kelas !== 'SEMUA') {
      kasusWhere.siswaUtama = { kelas };
    }
    if (startDate || endDate) {
      kasusWhere.tanggalKejadian = {};
      if (startDate) kasusWhere.tanggalKejadian.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        kasusWhere.tanggalKejadian.lte = end;
      }
    }

    const kasusList = await prisma.kasus.findMany({
      where: kasusWhere,
      orderBy: { tanggalKejadian: 'desc' },
      include: {
        siswaUtama: true,
        dicatatOleh: { select: { nama: true } },
        pihakTerlibat: { include: { siswa: true } },
        tindakLanjutList: true,
      },
    });

    // Build Excel Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistem Informasi BK Sekolah';
    workbook.created = new Date();

    // Sheet 1: Rekap Siswa & Poin
    const sheet1 = workbook.addWorksheet('Rekap Siswa & Poin');
    sheet1.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'NIS', key: 'nis', width: 14 },
      { header: 'Nama Siswa', key: 'nama', width: 28 },
      { header: 'Kelas', key: 'kelas', width: 14 },
      { header: 'L/P', key: 'jk', width: 6 },
      { header: 'Total Poin', key: 'totalPoin', width: 14 },
      { header: 'Status Zona', key: 'zona', width: 22 },
      { header: 'Kasus Aktif', key: 'kasusAktif', width: 14 },
      { header: 'Nama Wali', key: 'namaWali', width: 24 },
      { header: 'Kontak Wali', key: 'kontakWali', width: 18 },
    ];

    // Style header
    sheet1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet1.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' }, // Blue 800
    };

    siswaList.forEach((s, idx) => {
      const totalPoin = s.pelanggaran.reduce((sum, p) => sum + p.poinSaatItu, 0);
      const zoneInfo = evaluatePointZone(totalPoin, thresholds);
      const kasusAktif = s.kasusUtama.filter((k) => k.status !== 'SELESAI').length;

      sheet1.addRow({
        no: idx + 1,
        nis: s.nis,
        nama: s.nama,
        kelas: s.kelas,
        jk: s.jenisKelamin,
        totalPoin,
        zona: zoneInfo.label,
        kasusAktif,
        namaWali: s.namaWali,
        kontakWali: s.kontakWali,
      });
    });

    // Sheet 2: Riwayat Pelanggaran
    const sheet2 = workbook.addWorksheet('Riwayat Pelanggaran');
    sheet2.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Tanggal', key: 'tanggal', width: 14 },
      { header: 'NIS', key: 'nis', width: 14 },
      { header: 'Nama Siswa', key: 'nama', width: 26 },
      { header: 'Kelas', key: 'kelas', width: 14 },
      { header: 'Nama Pelanggaran', key: 'pelanggaran', width: 30 },
      { header: 'Kategori', key: 'kategori', width: 14 },
      { header: 'Poin', key: 'poin', width: 10 },
      { header: 'Keterangan Tambahan', key: 'keterangan', width: 32 },
      { header: 'Dicatat Oleh', key: 'dicatatOleh', width: 22 },
    ];

    sheet2.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet2.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' },
    };

    pelanggaranList.forEach((p, idx) => {
      sheet2.addRow({
        no: idx + 1,
        tanggal: new Date(p.tanggal).toLocaleDateString('id-ID'),
        nis: p.siswa.nis,
        nama: p.siswa.nama,
        kelas: p.siswa.kelas,
        pelanggaran: p.jenisPelanggaran.namaPelanggaran,
        kategori: p.jenisPelanggaran.kategori,
        poin: p.poinSaatItu,
        keterangan: p.keteranganTambahan || '-',
        dicatatOleh: p.dicatatOleh.nama,
      });
    });

    // Sheet 3: Riwayat Kasus BK
    const sheet3 = workbook.addWorksheet('Daftar Kasus BK');
    sheet3.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Tgl Kejadian', key: 'tanggal', width: 14 },
      { header: 'Siswa Utama', key: 'siswa', width: 26 },
      { header: 'Kelas', key: 'kelas', width: 14 },
      { header: 'Judul Kasus', key: 'judul', width: 30 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Pihak Terlibat', key: 'pihak', width: 28 },
      { header: 'Jml Tindak Lanjut', key: 'jmlTindakLanjut', width: 18 },
      { header: 'Deskripsi Kasus', key: 'deskripsi', width: 40 },
      { header: 'Dicatat Oleh', key: 'dicatatOleh', width: 22 },
    ];

    sheet3.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet3.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' },
    };

    kasusList.forEach((k, idx) => {
      const pihakNames = k.pihakTerlibat.map((pt) => `${pt.siswa.nama} (${pt.peran || 'Terlibat'})`).join(', ');
      sheet3.addRow({
        no: idx + 1,
        tanggal: new Date(k.tanggalKejadian).toLocaleDateString('id-ID'),
        siswa: k.siswaUtama.nama,
        kelas: k.siswaUtama.kelas,
        judul: k.judulKasus,
        status: k.status,
        pihak: pihakNames || '-',
        jmlTindakLanjut: k.tindakLanjutList.length,
        deskripsi: k.deskripsiLengkap,
        dicatatOleh: k.dicatatOleh.nama,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Laporan_BK_${new Date().toISOString().slice(0, 10)}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

export const exportPdf = async (req, res, next) => {
  try {
    const { kelas, startDate, endDate, siswaId } = req.query;
    const thresholds = await getThresholdSettings();

    // Query Siswa or Single Student Report
    let targetSiswa = null;
    if (siswaId) {
      targetSiswa = await prisma.siswa.findUnique({
        where: { id: siswaId },
        include: {
          pelanggaran: {
            include: { jenisPelanggaran: true, dicatatOleh: true },
            orderBy: { tanggal: 'desc' },
          },
          kasusUtama: {
            include: {
              dicatatOleh: true,
              pihakTerlibat: { include: { siswa: true } },
              tindakLanjutList: { include: { dicatatOleh: true } },
            },
            orderBy: { tanggalKejadian: 'desc' },
          },
        },
      });
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Laporan_BK_${targetSiswa ? targetSiswa.nis : 'Umum'}_${new Date().toISOString().slice(0, 10)}.pdf`
    );

    doc.pipe(res);

    // Header KOP Surat Sekolah
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('SISTEM BIMBINGAN DAN KONSELING (BK)', { align: 'center' });
    doc
      .fontSize(12)
      .font('Helvetica')
      .text('LAPORAN REKAPITULASI PELANGGARAN & KASUS SISWA', { align: 'center' });
    doc
      .fontSize(9)
      .fillColor('#64748b')
      .text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, { align: 'center' });
    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#cbd5e1').stroke();
    doc.moveDown(1);

    if (targetSiswa) {
      // Individual Student Report
      const totalPoin = targetSiswa.pelanggaran.reduce((sum, p) => sum + p.poinSaatItu, 0);
      const zoneInfo = evaluatePointZone(totalPoin, thresholds);

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a8a').text('PROFIL SISWA');
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica').fillColor('#0f172a');
      doc.text(`Nama Lengkap   : ${targetSiswa.nama}`);
      doc.text(`NIS            : ${targetSiswa.nis}`);
      doc.text(`Kelas          : ${targetSiswa.kelas}`);
      doc.text(`Jenis Kelamin  : ${targetSiswa.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}`);
      doc.text(`Nama Wali      : ${targetSiswa.namaWali} (${targetSiswa.kontakWali})`);
      doc.text(`Total Poin     : ${totalPoin} Poin (Status: ${zoneInfo.label.toUpperCase()})`);
      doc.moveDown(1);

      // Section Pelanggaran
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a8a').text(`DAFTAR PELANGGARAN (${targetSiswa.pelanggaran.length})`);
      doc.moveDown(0.5);

      if (targetSiswa.pelanggaran.length === 0) {
        doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748b').text('Tidak ada catatan pelanggaran tata tertib.');
      } else {
        targetSiswa.pelanggaran.forEach((p, idx) => {
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a');
          doc.text(`${idx + 1}. [${new Date(p.tanggal).toLocaleDateString('id-ID')}] ${p.jenisPelanggaran.namaPelanggaran} (+${p.poinSaatItu} Poin)`);
          doc.fontSize(9).font('Helvetica').fillColor('#475569');
          doc.text(`   Kategori: ${p.jenisPelanggaran.kategori} | Dicatat Oleh: ${p.dicatatOleh.nama}`);
          if (p.keteranganTambahan) {
            doc.text(`   Catatan: ${p.keteranganTambahan}`);
          }
          doc.moveDown(0.5);
        });
      }

      doc.moveDown(1);

      // Section Kasus
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a8a').text(`DAFTAR KASUS BIMBINGAN (${targetSiswa.kasusUtama.length})`);
      doc.moveDown(0.5);

      if (targetSiswa.kasusUtama.length === 0) {
        doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748b').text('Tidak ada catatan kasus bimbingan konseling.');
      } else {
        targetSiswa.kasusUtama.forEach((k, idx) => {
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a');
          doc.text(`${idx + 1}. [${new Date(k.tanggalKejadian).toLocaleDateString('id-ID')}] ${k.judulKasus} (Status: ${k.status})`);
          doc.fontSize(9).font('Helvetica').fillColor('#475569');
          doc.text(`   Deskripsi: ${k.deskripsiLengkap}`);
          doc.text(`   Dicatat Oleh: ${k.dicatatOleh.nama}`);
          if (k.tindakLanjutList.length > 0) {
            doc.text(`   Riwayat Tindak Lanjut (${k.tindakLanjutList.length}):`);
            k.tindakLanjutList.forEach((tl) => {
              doc.text(`     - [${new Date(tl.tanggal).toLocaleDateString('id-ID')}] ${tl.catatan} (oleh ${tl.dicatatOleh.nama})`);
            });
          }
          doc.moveDown(0.5);
        });
      }
    } else {
      // General Report
      const wherePelanggaran = {};
      if (kelas && kelas !== 'SEMUA') wherePelanggaran.siswa = { kelas };
      if (startDate || endDate) {
        wherePelanggaran.tanggal = {};
        if (startDate) wherePelanggaran.tanggal.gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          wherePelanggaran.tanggal.lte = end;
        }
      }

      const pelanggaranList = await prisma.pelanggaranSiswa.findMany({
        where: wherePelanggaran,
        orderBy: { tanggal: 'desc' },
        take: 100,
        include: {
          siswa: true,
          jenisPelanggaran: true,
          dicatatOleh: { select: { nama: true } },
        },
      });

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text(`FILTER LAPORAN: Kelas: ${kelas || 'Semua'}, Rentang: ${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}`);
      doc.moveDown(0.5);

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a8a').text(`REKAP PELANGGARAN SISWA (${pelanggaranList.length} Catatan)`);
      doc.moveDown(0.5);

      pelanggaranList.forEach((p, idx) => {
        if (doc.y > 720) doc.addPage();
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#0f172a');
        doc.text(`${idx + 1}. [${new Date(p.tanggal).toLocaleDateString('id-ID')}] ${p.siswa.nama} (${p.siswa.kelas}) - NIS: ${p.siswa.nis}`);
        doc.fontSize(9).font('Helvetica').fillColor('#475569');
        doc.text(`   Pelanggaran: ${p.jenisPelanggaran.namaPelanggaran} (+${p.poinSaatItu} Poin) | Kategori: ${p.jenisPelanggaran.kategori}`);
        if (p.keteranganTambahan) {
          doc.text(`   Keterangan: ${p.keteranganTambahan}`);
        }
        doc.moveDown(0.3);
      });
    }

    // Signature Area
    if (doc.y > 680) doc.addPage();
    doc.moveDown(2);
    const startY = doc.y;

    doc.fontSize(10).font('Helvetica').fillColor('#0f172a');
    doc.text('Mengetahui,', 60, startY);
    doc.text('Kepala Sekolah', 60, startY + 15);
    doc.text('( .................................................. )', 60, startY + 80);

    doc.text('Guru Bimbingan Konseling (BK),', 360, startY);
    doc.text(req.user?.nama || 'Petugas BK', 360, startY + 15);
    doc.text('( .................................................. )', 360, startY + 80);

    doc.end();
  } catch (err) {
    next(err);
  }
};
