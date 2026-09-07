import prisma from '../prisma.js';
import { getThresholdSettings, evaluatePointZone } from '../utils/thresholds.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const thresholds = await getThresholdSettings();
    const now = new Date();

    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      totalSiswa,
      pelanggaranBulanIniCount,
      pelanggaranBulanLaluCount,
      kasusBaruCount,
      kasusProsesCount,
      kasusSelesaiCount,
      allSiswaWithPoin,
      allPelanggaranPerKelas,
    ] = await Promise.all([
      prisma.siswa.count(),
      prisma.pelanggaranSiswa.count({
        where: { tanggal: { gte: startOfCurrentMonth } },
      }),
      prisma.pelanggaranSiswa.count({
        where: {
          tanggal: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),
      prisma.kasus.count({ where: { status: 'BARU' } }),
      prisma.kasus.count({ where: { status: 'PROSES' } }),
      prisma.kasus.count({ where: { status: 'SELESAI' } }),
      prisma.siswa.findMany({
        select: {
          id: true,
          nama: true,
          nis: true,
          kelas: true,
          pelanggaran: {
            select: { poinSaatItu: true },
          },
        },
      }),
      prisma.pelanggaranSiswa.findMany({
        select: {
          siswa: { select: { kelas: true } },
          jenisPelanggaran: { select: { kategori: true } },
          poinSaatItu: true,
        },
      }),
    ]);

    // Risk zones evaluation
    let siswaZonaPeringatanCount = 0;
    const studentPoints = allSiswaWithPoin.map((s) => {
      const totalPoin = s.pelanggaran.reduce((sum, p) => sum + p.poinSaatItu, 0);
      const zoneInfo = evaluatePointZone(totalPoin, thresholds);

      // Skor >= 4 is considered needing parent/headmaster agreement or skorsing
      if (totalPoin >= 4) {
        siswaZonaPeringatanCount++;
      }

      return {
        id: s.id,
        nama: s.nama,
        nis: s.nis,
        kelas: s.kelas,
        totalPoin,
        zoneInfo,
      };
    });

    const top5Siswa = [...studentPoints]
      .filter((s) => s.totalPoin > 0)
      .sort((a, b) => b.totalPoin - a.totalPoin)
      .slice(0, 5);

    // 6-month trend
    const monthsData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

      const monthViolations = await prisma.pelanggaranSiswa.findMany({
        where: {
          tanggal: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: {
          jenisPelanggaran: { select: { kategori: true } },
        },
      });

      const kerajinan = monthViolations.filter((v) => v.jenisPelanggaran.kategori.includes('KERAJINAN')).length;
      const kelakuan = monthViolations.filter((v) => v.jenisPelanggaran.kategori.includes('KELAKUAN')).length;
      const kerapian = monthViolations.filter((v) => v.jenisPelanggaran.kategori.includes('KERAPIAN')).length;

      monthsData.push({
        month: label,
        total: monthViolations.length,
        kerajinan,
        kelakuan,
        kerapian,
      });
    }

    // Category Distribution (A. Kerajinan, B. Kelakuan, C. Kerapian)
    const allViolationsCount = await prisma.pelanggaranSiswa.findMany({
      include: { jenisPelanggaran: { select: { kategori: true } } },
    });

    const kategoriCounts = {
      KERAJINAN: 0,
      KELAKUAN: 0,
      KERAPIAN: 0,
    };
    allViolationsCount.forEach((v) => {
      const kat = v.jenisPelanggaran?.kategori || '';
      if (kat.includes('KERAJINAN')) kategoriCounts.KERAJINAN++;
      else if (kat.includes('KELAKUAN')) kategoriCounts.KELAKUAN++;
      else if (kat.includes('KERAPIAN')) kategoriCounts.KERAPIAN++;
    });

    const totalKategori = allViolationsCount.length;
    const kategoriDistribution = [
      {
        name: 'A. Kerajinan',
        key: 'KERAJINAN',
        value: kategoriCounts.KERAJINAN,
        percentage: totalKategori > 0 ? Math.round((kategoriCounts.KERAJINAN / totalKategori) * 100) : 0,
        color: '#3b82f6',
      },
      {
        name: 'B. Kelakuan',
        key: 'KELAKUAN',
        value: kategoriCounts.KELAKUAN,
        percentage: totalKategori > 0 ? Math.round((kategoriCounts.KELAKUAN / totalKategori) * 100) : 0,
        color: '#ef4444',
      },
      {
        name: 'C. Kerapian',
        key: 'KERAPIAN',
        value: kategoriCounts.KERAPIAN,
        percentage: totalKategori > 0 ? Math.round((kategoriCounts.KERAPIAN / totalKategori) * 100) : 0,
        color: '#f59e0b',
      },
    ];

    // Case Status Data
    const caseStatusData = [
      { status: 'Kasus Baru', key: 'BARU', count: kasusBaruCount, color: '#ef4444' },
      { status: 'Dalam Pembinaan', key: 'PROSES', count: kasusProsesCount, color: '#f59e0b' },
      { status: 'Selesai', key: 'SELESAI', count: kasusSelesaiCount, color: '#10b981' },
    ];

    // Heatmap per Kelas
    const distinctClasses = await prisma.siswa.findMany({
      select: { kelas: true },
      distinct: ['kelas'],
      orderBy: { kelas: 'asc' },
    });

    const classStatsMap = {};
    distinctClasses.forEach((c) => {
      classStatsMap[c.kelas] = {
        kelas: c.kelas,
        totalPelanggaran: 0,
        totalPoin: 0,
        kerajinan: 0,
        kelakuan: 0,
        kerapian: 0,
      };
    });

    allPelanggaranPerKelas.forEach((p) => {
      const cls = p.siswa?.kelas;
      if (cls && classStatsMap[cls]) {
        classStatsMap[cls].totalPelanggaran++;
        classStatsMap[cls].totalPoin += p.poinSaatItu;
        const kat = p.jenisPelanggaran?.kategori || '';
        if (kat.includes('KERAJINAN')) classStatsMap[cls].kerajinan++;
        if (kat.includes('KELAKUAN')) classStatsMap[cls].kelakuan++;
        if (kat.includes('KERAPIAN')) classStatsMap[cls].kerapian++;
      }
    });

    const classHeatmap = Object.values(classStatsMap).sort(
      (a, b) => b.totalPelanggaran - a.totalPelanggaran
    );

    const maxClassViolations = Math.max(...classHeatmap.map((c) => c.totalPelanggaran), 1);
    const enrichedClassHeatmap = classHeatmap.map((c) => ({
      ...c,
      intensityPercent: Math.round((c.totalPelanggaran / maxClassViolations) * 100),
    }));

    return res.json({
      success: true,
      data: {
        summaryCards: {
          totalSiswa,
          pelanggaranBulanIni: pelanggaranBulanIniCount,
          pelanggaranBulanLalu: pelanggaranBulanLaluCount,
          kasusAktif: kasusBaruCount + kasusProsesCount,
          siswaZonaPeringatan: siswaZonaPeringatanCount,
        },
        trenPelanggaran: monthsData,
        kategoriDistribution,
        top5Siswa,
        caseStatusData,
        classHeatmap: enrichedClassHeatmap,
      },
    });
  } catch (err) {
    next(err);
  }
};
