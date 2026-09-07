import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Memulai Seeding Data Sistem BK Sesuai Peraturan Resmi Sekolah ---');

  // 1. Clear existing data
  await prisma.tindakLanjutKasus.deleteMany();
  await prisma.kasusPihakTerlibat.deleteMany();
  await prisma.kasus.deleteMany();
  await prisma.pelanggaranSiswa.deleteMany();
  await prisma.jenisPelanggaran.deleteMany();
  await prisma.siswa.deleteMany();
  await prisma.guruBk.deleteMany();
  await prisma.pengaturan.deleteMany();

  // 2. Seed Pengaturan Threshold Sesuai Pasal 19
  await prisma.pengaturan.create({
    data: {
      key: 'threshold_poin',
      value: JSON.stringify({
        tier1: 1,  // Peringatan
        tier2: 2,  // Peringatan dengan sanksi ringan
        tier3: 4,  // Surat perjanjian siswa + walas
        tier4: 6,  // Surat perjanjian siswa + ortu + walas + BK
        tier5: 8,  // Surat perjanjian siswa + ortu + walas + BK + Kepsek
        tier6: 10, // Surat pernyataan + skorsing belajar di rumah
        tierMax: 30, // Dikembalikan ke orang tua / dikeluarkan
      }),
      keterangan: 'Ketentuan Penanganan Berdasarkan Jumlah Skor (Pasal 19)',
    },
  });

  // 3. Seed Guru BK & Admin (Hanya 1 User Resmi)
  const salt = await bcrypt.genSalt(10);
  const passwordAdmin = await bcrypt.hash('admin123', salt);

  const admin = await prisma.guruBk.create({
    data: {
      nama: 'Administrator BK',
      username: 'admin',
      passwordHash: passwordAdmin,
      noHp: '081234567890',
      role: 'ADMIN',
      isAktif: true,
    },
  });

  // 4. Seed Semua Skor Jenis Pelanggaran (Pasal 18: A. Kerajinan, B. Kelakuan, C. Kerapian)
  const masterPelanggaran = [
    // === A. KERAJINAN ===
    { namaPelanggaran: '[A.1] Terlambat masuk sekolah', kategori: 'A. KERAJINAN', poin: 2 },
    { namaPelanggaran: '[A.2] Terlambat masuk kelas', kategori: 'A. KERAJINAN', poin: 2 },
    { namaPelanggaran: '[A.3] Tidak mengerjakan tugas', kategori: 'A. KERAJINAN', poin: 1 },
    { namaPelanggaran: '[A.4] Tidak masuk tanpa surat', kategori: 'A. KERAJINAN', poin: 2 },
    { namaPelanggaran: '[A.5] Tidak ikut pelajaran/bolos', kategori: 'A. KERAJINAN', poin: 4 },
    { namaPelanggaran: '[A.6] Tidak ikut upacara bendera', kategori: 'A. KERAJINAN', poin: 2 },

    // === B. KELAKUAN ===
    { namaPelanggaran: '[B.1] Melompat tembok', kategori: 'B. KELAKUAN', poin: 5 },
    { namaPelanggaran: '[B.2] Meninggalkan kelas tanpa seizin guru', kategori: 'B. KELAKUAN', poin: 2 },
    { namaPelanggaran: '[B.3] Tidak sopan terhadap guru/pegawai', kategori: 'B. KELAKUAN', poin: 10 },
    { namaPelanggaran: '[B.4] Buang sampah sembarangan', kategori: 'B. KELAKUAN', poin: 2 },
    { namaPelanggaran: '[B.5] Menyalahgunakan dispensasi', kategori: 'B. KELAKUAN', poin: 2 },
    { namaPelanggaran: '[B.6] Merokok/membawa rokok', kategori: 'B. KELAKUAN', poin: 10 },
    { namaPelanggaran: '[B.7] Melakukan corat-coret', kategori: 'B. KELAKUAN', poin: 10 },
    { namaPelanggaran: '[B.8] Melakukan pertaruhan/perjudian', kategori: 'B. KELAKUAN', poin: 10 },
    { namaPelanggaran: '[B.9] Membawa senjata tajam', kategori: 'B. KELAKUAN', poin: 10 },
    { namaPelanggaran: '[B.10] Mengancam keselamatan orang', kategori: 'B. KELAKUAN', poin: 10 },
    { namaPelanggaran: '[B.11] Membawa petasan', kategori: 'B. KELAKUAN', poin: 10 },
    { namaPelanggaran: '[B.12] Membuat gaduh', kategori: 'B. KELAKUAN', poin: 6 },
    { namaPelanggaran: '[B.13] Melakukan modifikasi motor knalpot bersuara bising', kategori: 'B. KELAKUAN', poin: 4 },
    { namaPelanggaran: '[B.14] Membuat surat palsu', kategori: 'B. KELAKUAN', poin: 4 },
    { namaPelanggaran: '[B.15] Melecehkan lawan jenis/berzina', kategori: 'B. KELAKUAN', poin: 10 },
    { namaPelanggaran: '[B.16] Membully', kategori: 'B. KELAKUAN', poin: 10 },
    { namaPelanggaran: '[B.17] Mencuri', kategori: 'B. KELAKUAN', poin: 10 },
    { namaPelanggaran: '[B.18] Membawa buku/CD porno', kategori: 'B. KELAKUAN', poin: 10 },
    { namaPelanggaran: '[B.19] Mengunggah foto atau menulis status tidak santun', kategori: 'B. KELAKUAN', poin: 6 },
    { namaPelanggaran: '[B.20] Membawa/mengkonsumsi minuman keras', kategori: 'B. KELAKUAN', poin: 10 },
    { namaPelanggaran: '[B.21] Memakai tato', kategori: 'B. KELAKUAN', poin: 10 },
    { namaPelanggaran: '[B.22] Menindik/melubangi kuping (untuk putra)', kategori: 'B. KELAKUAN', poin: 10 },
    { namaPelanggaran: '[B.23] Memalsu tanda tangan', kategori: 'B. KELAKUAN', poin: 10 },
    { namaPelanggaran: '[B.24] Melakukan pemerasan', kategori: 'B. KELAKUAN', poin: 10 },
    { namaPelanggaran: '[B.25] Melakukan perkelahian ringan', kategori: 'B. KELAKUAN', poin: 10 },
    { namaPelanggaran: '[B.26] Melakukan perkelahian dengan menyebabkan korban luka ringan-sedang', kategori: 'B. KELAKUAN', poin: 20 },
    { namaPelanggaran: '[B.27] Melakukan perkelahian dengan menyebabkan korban luka parah', kategori: 'B. KELAKUAN', poin: 30 },
    { namaPelanggaran: '[B.28] Buronan pihak berwajib (Dikeluarkan dari sekolah)', kategori: 'B. KELAKUAN', poin: 100 },
    { namaPelanggaran: '[B.29] Membawa/mengkonsumsi narkoba (Dikeluarkan dari sekolah)', kategori: 'B. KELAKUAN', poin: 100 },
    { namaPelanggaran: '[B.30] Hamil (Dikeluarkan dari sekolah)', kategori: 'B. KELAKUAN', poin: 100 },
    { namaPelanggaran: '[B.31] Menikah selama sekolah (Dikeluarkan dari sekolah)', kategori: 'B. KELAKUAN', poin: 100 },
    { namaPelanggaran: '[B.32] Terlibat geng KO6 atau geng dengan nama lain (Dikeluarkan dari sekolah)', kategori: 'B. KELAKUAN', poin: 100 },

    // === C. KERAPIAN ===
    { namaPelanggaran: '[C.1] Tidak memakai topi / dasi saat upacara', kategori: 'C. KERAPIAN', poin: 2 },
    { namaPelanggaran: '[C.2] Tidak menggunakan atribut sekolah', kategori: 'C. KERAPIAN', poin: 2 },
    { namaPelanggaran: '[C.3] Ikat pinggang tidak sesuai ketentuan', kategori: 'C. KERAPIAN', poin: 2 },
    { namaPelanggaran: '[C.4] Sepatu / kaos tidak sesuai ketentuan', kategori: 'C. KERAPIAN', poin: 2 },
    { namaPelanggaran: '[C.5] Tidak memasukkan baju', kategori: 'C. KERAPIAN', poin: 2 },
    { namaPelanggaran: '[C.6] Pakaian tidak sesuai ketentuan', kategori: 'C. KERAPIAN', poin: 2 },
    { namaPelanggaran: '[C.7] Memakai jaket ke kelas kecuali sakit', kategori: 'C. KERAPIAN', poin: 2 },
    { namaPelanggaran: '[C.8] Menggunakan perhiasan berlebihan', kategori: 'C. KERAPIAN', poin: 2 },
    { namaPelanggaran: '[C.9] Rambut tidak sesuai ketentuan', kategori: 'C. KERAPIAN', poin: 4 },
    { namaPelanggaran: '[C.10] Memakai anting/kalung untuk putra', kategori: 'C. KERAPIAN', poin: 10 },
    { namaPelanggaran: '[C.11] Rambut dicat/disemir', kategori: 'C. KERAPIAN', poin: 10 },
  ];

  const createdJenis = [];
  for (const item of masterPelanggaran) {
    const res = await prisma.jenisPelanggaran.create({ data: item });
    createdJenis.push(res);
  }
  console.log(`Seeded ${createdJenis.length} Master Pelanggaran (A. Kerajinan, B. Kelakuan, C. Kerapian)`);

  // 5. Seed Siswa Data
  const siswaData = [
    { nama: 'Aditya Pratama', nis: '20241001', kelas: 'VII-A', jenisKelamin: 'L', namaWali: 'Bambang Pratama', kontakWali: '08123456001' },
    { nama: 'Annisa Maharani', nis: '20241002', kelas: 'VII-A', jenisKelamin: 'P', namaWali: 'Hendra Maharani', kontakWali: '08123456002' },
    { nama: 'Bima Satria Wicaksana', nis: '20241003', kelas: 'VII-B', jenisKelamin: 'L', namaWali: 'Joko Wicaksana', kontakWali: '08123456003' },
    { nama: 'Cantika Dewi Lestari', nis: '20241004', kelas: 'VII-B', jenisKelamin: 'P', namaWali: 'Surya Lestari', kontakWali: '08123456004' },
    { nama: 'Dimas Bagus Saputra', nis: '20241005', kelas: 'VIII-A', jenisKelamin: 'L', namaWali: 'Agus Saputra', kontakWali: '08123456005' },
    { nama: 'Fajar Nugraha', nis: '20241006', kelas: 'VIII-A', jenisKelamin: 'L', namaWali: 'Dedi Nugraha', kontakWali: '08123456006' },
    { nama: 'Gita Permata', nis: '20241007', kelas: 'VIII-B', jenisKelamin: 'P', namaWali: 'Gunawan Permata', kontakWali: '08123456007' },
    { nama: 'Haikal Rabbani', nis: '20231011', kelas: 'VIII-C', jenisKelamin: 'L', namaWali: 'Irwan Rabbani', kontakWali: '08123456011' },
    { nama: 'Indah Kusuma Wardani', nis: '20231012', kelas: 'IX-A', jenisKelamin: 'P', namaWali: 'Kusuma Wardani', kontakWali: '08123456012' },
    { nama: 'Kevin Aditya Wijaya', nis: '20231013', kelas: 'IX-A', jenisKelamin: 'L', namaWali: 'Wijaya Tan', kontakWali: '08123456013' },
    { nama: 'Luthfi Hakim', nis: '20231014', kelas: 'IX-B', jenisKelamin: 'L', namaWali: 'Lukman Hakim', kontakWali: '08123456014' },
    { nama: 'Muhammad Rizky Ramadhan', nis: '20231015', kelas: 'IX-B', jenisKelamin: 'L', namaWali: 'Rahmat Ramadhan', kontakWali: '08123456015' },
    { nama: 'Nadia Salsabila', nis: '20231016', kelas: 'IX-C', jenisKelamin: 'P', namaWali: 'Syahril', kontakWali: '08123456016' },
    { nama: 'Reza Fahlevi', nis: '20221024', kelas: 'IX-C', jenisKelamin: 'L', namaWali: 'Fahlevi Rahman', kontakWali: '08123456024' },
  ];

  const createdSiswa = [];
  for (const s of siswaData) {
    const res = await prisma.siswa.create({ data: s });
    createdSiswa.push(res);
  }
  console.log(`Seeded ${createdSiswa.length} Siswa`);

  // 6. Seed Sample Pelanggaran dengan Skor Baru
  const dimas = createdSiswa.find((s) => s.nama.includes('Dimas'));
  const reza = createdSiswa.find((s) => s.nama.includes('Reza'));
  const kevin = createdSiswa.find((s) => s.nama.includes('Kevin'));
  const aditya = createdSiswa.find((s) => s.nama.includes('Aditya'));

  const jpMerokok = createdJenis.find((j) => j.namaPelanggaran.includes('B.6'));
  const jpBolos = createdJenis.find((j) => j.namaPelanggaran.includes('A.5'));
  const jpTerlambat = createdJenis.find((j) => j.namaPelanggaran.includes('A.1'));
  const jpAtribut = createdJenis.find((j) => j.namaPelanggaran.includes('C.2'));
  const jpRambut = createdJenis.find((j) => j.namaPelanggaran.includes('C.9'));

  if (dimas && jpMerokok && jpBolos) {
    await prisma.pelanggaranSiswa.create({
      data: {
        siswaId: dimas.id,
        jenisPelanggaranId: jpMerokok.id,
        dicatatOlehId: admin.id,
        tanggal: new Date(),
        keteranganTambahan: 'Merokok di area belakang sekolah saat jam istirahat',
        poinSaatItu: jpMerokok.poin,
      },
    });
    await prisma.pelanggaranSiswa.create({
      data: {
        siswaId: dimas.id,
        jenisPelanggaranId: jpBolos.id,
        dicatatOlehId: admin.id,
        tanggal: new Date(),
        keteranganTambahan: 'Tidak masuk jam pelajaran Matematika',
        poinSaatItu: jpBolos.poin,
      },
    });
  }

  if (reza && jpMerokok) {
    await prisma.pelanggaranSiswa.create({
      data: {
        siswaId: reza.id,
        jenisPelanggaranId: jpMerokok.id,
        dicatatOlehId: admin.id,
        tanggal: new Date(),
        keteranganTambahan: 'Membawa rokok dalam saku celana',
        poinSaatItu: jpMerokok.poin,
      },
    });
  }

  if (kevin && jpBolos && jpTerlambat) {
    await prisma.pelanggaranSiswa.create({
      data: {
        siswaId: kevin.id,
        jenisPelanggaranId: jpBolos.id,
        dicatatOlehId: admin.id,
        tanggal: new Date(),
        keteranganTambahan: 'Bolos jam ke-5 dan ke-6',
        poinSaatItu: jpBolos.poin,
      },
    });
    await prisma.pelanggaranSiswa.create({
      data: {
        siswaId: kevin.id,
        jenisPelanggaranId: jpTerlambat.id,
        dicatatOlehId: admin.id,
        tanggal: new Date(),
        keteranganTambahan: 'Terlambat 15 menit',
        poinSaatItu: jpTerlambat.poin,
      },
    });
  }

  if (aditya && jpTerlambat && jpAtribut) {
    await prisma.pelanggaranSiswa.create({
      data: {
        siswaId: aditya.id,
        jenisPelanggaranId: jpTerlambat.id,
        dicatatOlehId: admin.id,
        tanggal: new Date(),
        keteranganTambahan: 'Terlambat upacara bendera',
        poinSaatItu: jpTerlambat.poin,
      },
    });
  }

  console.log('--- Seeding Selesai Sukses! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
