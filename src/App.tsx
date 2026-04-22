/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  PlusCircle, 
  Search, 
  User, 
  Calendar, 
  MapPin, 
  Users, 
  ChevronRight, 
  ArrowLeft, 
  Send, 
  Sparkles,
  Share2,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  Filter,
  Calculator,
  Facebook,
  Copy,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

// --- Types ---

interface OtherInstitution {
  name: string;
  institution: string;
  statement?: string;
}

interface NewsItem {
  id: string;
  title: string;
  activityName: string;
  distributionProgram?: string;
  assistanceType?: string;
  mustahikCount?: string;
  distributionArea?: string;
  leaders: string[];
  otherInstitutions?: OtherInstitution[];
  date: string;
  location: string;
  program: string;
  theme: string;
  content: string;
  imageUrl: string;
  timestamp: number;
}

type View = 'home' | 'detail' | 'add' | 'search' | 'calculator' | 'gallery' | 'programs' | 'program_detail';

// --- Constants ---

const PROGRAM_THEMES = {
  'PROGRAM EKONOMI': [
    'Badhar Mart',
    'Badhar Auto',
    'Badhar Laundry',
    'Usaha Bangkit Mustahik',
    'Zakatpreneur Dharmasraya',
    'Gerobak Berkah',
    'Petani Tangguh Zakat',
    'UMKM Naik Kelas',
    'Zakat untuk Kemandirian',
    'Custom'
  ],
  'PROGRAM PENDIDIKAN': [
    'Beasiswa Generasi Cahaya',
    'Sekolah Impian Zakat',
    'Cerdas Bersama Zakat',
    'Satu Zakat, Seribu Harapan',
    'Pemuda Hebat Dharmasraya',
    'Rumah Ilmu Berkah',
    'Custom'
  ],
  'PROGRAM KESEHATAN': [
    'Sehat Berkah Dharmasraya',
    'Zakat Peduli Sehat',
    'Layanan Sehat Mustahik',
    'Ambulans Berkah',
    'Aksi Sehat untuk Umat',
    'Custom'
  ],
  'PROGRAM SOSIAL & KEMANUSIAAN': [
    'Rumah Harapan Dharmasraya',
    'Bedah Rumah Berkah',
    'Dharmasraya Peduli Sesama',
    'Sentuhan Kasih Zakat',
    'Bersama Kita Peduli',
    'Zakat Tanggap Bencana',
    'Custom'
  ],
  'PROGRAM TAQWA': [
    'Cahaya Taqwa Dharmasraya',
    'Gerakan Dakwah Berkah',
    'Dharmasraya Religius',
    'Zakat Menyapa Iman',
    'Taqwa Menguatkan Negeri',
    'Sentuhan Iman Dharmasraya',
    'Safari Dakwah Nagari',
    'Gerakan Subuh Berjamaah',
    'Ngaji Bareng Mustahik',
    'Rumah Tahfidz Berkah',
    'Beasiswa Santri Zakat',
    'Bina Umat Berdaya',
    'Custom'
  ],
  'PROGRAM RAMADHAN': [
    'Ramadhan Penuh Berkah',
    'Cahaya Ramadhan Dharmasraya',
    'Berbagi Tanpa Batas',
    'Ramadhan Bahagia Bersama Zakat',
    'Gerakan Sedekah Ramadhan',
    'Seribu Senyum Ramadhan',
    'Custom'
  ]
};

const LEADERS = [
  'Z. Lubis (Ketua)',
  'Ridwan Syarif (Waka I)',
  'Muhammad Hakim (Waka II)',
  'Rusmiyati (Waka III)',
  'Ardios (Waka IV)'
];

const LOCATIONS = [
  'Aula kantor baznas',
  'aula Kantor Bupati',
  'auditorium',
  'hotel sakato jaya',
  'hotel Jakarta',
  'hotel omega',
  'Custom'
];

const ACTIVITY_NAMES = [
  'Bimtek',
  'Pengumpulan',
  'Pendistribusian',
  'Pendistribusian & Pendayagunaan',
  'Pelatihan',
  'Rapat',
  'Rapat pleno',
  'Rakor',
  'Rakorda',
  'Sosialisasi',
  'Silaturahmi',
  'Zoom',
  'Zoom meeting',
  'Custom'
];

const DISTRIBUTION_PROGRAMS = [
  'Kemanusiaan',
  'Pendidikan',
  'Kesehatan',
  'Ekonomi',
  'Dakwah'
];

const ZAKAT_TYPES = {
  penghasilan: {
    name: 'Zakat Penghasilan',
    rate: 0.025,
    nisab: 'Setara 522kg Beras',
    steps: [
      'Hitung total pendapatan bulanan (gaji, bonus, dll).',
      'Pastikan pendapatan mencapai Nisab (setara 522kg beras).',
      'Kalikan total pendapatan dengan 2,5%.',
      'Salurkan melalui BAZNAS Dharmasraya.'
    ]
  },
  maal: {
    name: 'Zakat Maal (Harta)',
    rate: 0.025,
    nisab: 'Setara 85gr Emas',
    steps: [
      'Hitung total harta yang mengendap selama 1 tahun (tabungan, deposito, dll).',
      'Pastikan total harta mencapai Nisab (setara 85gr emas).',
      'Kalikan total harta dengan 2,5%.',
      'Salurkan melalui BAZNAS Dharmasraya.'
    ]
  },
  emas: {
    name: 'Zakat Emas & Perak',
    rate: 0.025,
    nisab: 'Emas: 85gr | Perak: 595gr',
    steps: [
      'Hitung total berat emas/perak yang dimiliki.',
      'Jika emas >= 85gr atau perak >= 595gr, wajib zakat.',
      'Hitung nilai uangnya berdasarkan harga pasar saat ini.',
      'Kalikan nilai total dengan 2,5%.'
    ]
  },
  perdagangan: {
    name: 'Zakat Perdagangan',
    rate: 0.025,
    nisab: 'Setara 85gr Emas',
    steps: [
      'Hitung Modal yang diputar + Keuntungan + Piutang lancar.',
      'Kurangi dengan Hutang jatuh tempo.',
      'Jika sisa bersih >= Nisab (85gr emas), wajib zakat.',
      'Kalikan sisa bersih dengan 2,5%.'
    ]
  },
  saham: {
    name: 'Zakat Saham',
    rate: 0.025,
    nisab: 'Setara 85gr Emas',
    steps: [
      'Hitung total nilai pasar saham pada akhir tahun.',
      'Jika nilai total >= Nisab (85gr emas), wajib zakat.',
      'Kalikan nilai total dengan 2,5%.'
    ]
  },
  pertanian: {
    name: 'Zakat Pertanian',
    rate: 0.05,
    nisab: '653kg Gabah / 522kg Beras',
    steps: [
      'Hitung total hasil panen bersih.',
      'Jika hasil >= 653kg gabah, wajib zakat.',
      'Keluarkan 5% jika menggunakan irigasi berbayar, atau 10% jika tadah hujan.',
      'Zakat dikeluarkan setiap kali panen (tanpa menunggu 1 tahun).'
    ]
  },
  peternakan: {
    name: 'Zakat Peternakan',
    rate: 0,
    nisab: 'Kambing: 40 ekor | Sapi: 30 ekor',
    steps: [
      'Kambing/Domba: 40-120 ekor = 1 ekor kambing.',
      'Sapi/Kerbau: 30-39 ekor = 1 ekor tabi (sapi 1 thn).',
      'Zakat ini memiliki tabel perhitungan khusus berdasarkan jumlah hewan.'
    ]
  },
  perusahaan: {
    name: 'Zakat Perusahaan',
    rate: 0.025,
    nisab: 'Setara 85gr Emas',
    steps: [
      'Hitung total aset lancar perusahaan pada akhir tahun.',
      'Kurangi dengan hutang jangka pendek.',
      'Jika sisa bersih >= Nisab (85gr emas), wajib zakat.',
      'Kalikan sisa bersih dengan 2,5%.'
    ]
  },
  rikaz: {
    name: 'Zakat Rikaz (Temuan)',
    rate: 0.2,
    nisab: 'Tanpa Nisab',
    steps: [
      'Hitung nilai total harta temuan (harta karun).',
      'Tidak perlu menunggu 1 tahun (Haul).',
      'Keluarkan zakat sebesar 20% dari nilai total.'
    ]
  }
};

const INITIAL_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Penyaluran Zakat Konsumtif di Kecamatan Pulau Punjung',
    activityName: 'Pendistribusian',
    distributionProgram: 'Kemanusiaan',
    assistanceType: 'Zakat Konsumtif',
    mustahikCount: '50',
    distributionArea: 'Kecamatan Pulau Punjung',
    leaders: ['Z. Lubis (Ketua)'],
    otherInstitutions: [],
    date: '2026-04-01',
    location: 'Kantor Camat Pulau Punjung',
    program: 'PROGRAM SOSIAL & KEMANUSIAAN',
    theme: 'Sentuhan Kasih Zakat',
    content: 'BAZNAS Kabupaten Dharmasraya menyalurkan bantuan zakat konsumtif kepada 50 mustahik di wilayah Kecamatan Pulau Punjung. Bantuan ini diharapkan dapat meringankan beban ekonomi masyarakat kurang mampu menjelang bulan suci Ramadhan.',
    imageUrl: 'https://picsum.photos/seed/baznas1/800/400',
    timestamp: Date.now() - 86400000 * 2
  }
];

// --- App Component ---

export default function App() {
  const [view, setView] = useState<View>('home');
  const [news, setNews] = useState<NewsItem[]>(INITIAL_NEWS);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') || '');
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey);
  const [apiKeyError, setApiKeyError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    activityName: ACTIVITY_NAMES[0],
    activityNameOption: ACTIVITY_NAMES[0],
    distributionProgram: '',
    assistanceType: '',
    mustahikCount: '',
    distributionArea: '',
    title: '',
    leaders: [] as string[],
    leaderStatements: {} as Record<string, string>,
    otherInstitutions: [] as OtherInstitution[],
    date: new Date().toISOString().split('T')[0],
    location: LOCATIONS[0],
    locationOption: LOCATIONS[0],
    program: '',
    theme: '',
    paragraphCount: 3,
    closingTypes: [] as string[],
    rawNotes: '',
    generatedContent: '',
    image: null as string | null
  });
  
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isLeaderDropdownOpen, setIsLeaderDropdownOpen] = useState(false);
  const [isProgramDropdownOpen, setIsProgramDropdownOpen] = useState(false);
  const [hoveredProgram, setHoveredProgram] = useState<string | null>(null);

  // Calculator State
  const [calcType, setCalcType] = useState<keyof typeof ZAKAT_TYPES>('penghasilan');
  const [calcAmount, setCalcAmount] = useState<number>(0);
  const [calcResult, setCalcResult] = useState<number | null>(null);
  const [isCalcDropdownOpen, setIsCalcDropdownOpen] = useState(false);

  // Gemini Setup
  const ai = useMemo(() => {
    if (!geminiApiKey) return null;
    return new GoogleGenAI({ apiKey: geminiApiKey });
  }, [geminiApiKey]);

  const handleSaveApiKey = () => {
    if (!apiKeyInput) {
      setApiKeyError('API Key wajib diisi');
      setGeminiApiKey('');
      return;
    }
    if (apiKeyInput.length < 20) {
      setApiKeyError('Minimal panjang 20 karakter');
      setGeminiApiKey('');
      return;
    }
    localStorage.setItem('GEMINI_API_KEY', apiKeyInput);
    setGeminiApiKey(apiKeyInput);
    setApiKeyError('');
  };

  // Generate AI Banner
  useEffect(() => {
    const generateBanner = async () => {
      if (bannerImage || isGeneratingBanner || !ai) return;
      setIsGeneratingBanner(true);
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: 'A professional and modern architectural visualization of a BAZNAS (National Board of Zakat) office building in Dharmasraya, Indonesia. The building should look clean, Islamic-modern style, with green and white color scheme. Include a prominent sign that says "BAZNAS KABUPATEN DHARMASRAYA" in elegant typography. The atmosphere should be bright, welcoming, and professional.',
              },
            ],
          },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            setBannerImage(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      } catch (error) {
        console.error("Error generating banner:", error);
        // Fallback to a nice placeholder if AI fails
        setBannerImage("https://picsum.photos/seed/baznas-office/800/400");
      } finally {
        setIsGeneratingBanner(false);
      }
    };

    generateBanner();
  }, [ai, bannerImage, isGeneratingBanner]);

  const generateTitles = async () => {
    if (!formData.rawNotes) return;
    if (!ai) {
      setApiKeyError('API Key wajib diisi untuk menggunakan fitur AI');
      return;
    }
    
    setIsGeneratingTitles(true);
    setSuggestedTitles([]);
    try {
      const leadersInfo = formData.leaders.map(l => {
        const statement = formData.leaderStatements[l];
        return statement ? `${l}: "${statement}"` : `${l}: (Hanya hadir, tidak memberikan pernyataan)`;
      }).join('\n');
      const otherInfo = formData.otherInstitutions.map(oi => {
        return oi.statement ? `${oi.name} (${oi.institution}): "${oi.statement}"` : `${oi.name} (${oi.institution}): (Hanya hadir, tidak memberikan pernyataan)`;
      }).join('\n');
      const prompt = `
        Berdasarkan data kegiatan BAZNAS Dharmasraya berikut:
        Nama Kegiatan: ${formData.activityName}
        ${formData.distributionProgram ? `Program Penyaluran: ${formData.distributionProgram}` : ''}
        ${formData.assistanceType ? `Bentuk Bantuan: ${formData.assistanceType}` : ''}
        ${formData.mustahikCount ? `Jumlah Mustahik: ${formData.mustahikCount}` : ''}
        ${formData.distributionArea ? `Daerah Bantuan: ${formData.distributionArea}` : ''}
        Program (Tema Utama): ${formData.program || 'N/A'}
        Tema (Sub-tema): ${formData.theme || 'N/A'}
        Pimpinan Hadir & Pernyataan:
        ${leadersInfo}
        Lembaga Lain & Pernyataan:
        ${otherInfo}
        Lokasi: ${formData.location}
        Catatan Mentah: ${formData.rawNotes}
        
        Berikan 10 pilihan judul berita yang paling menarik, profesional, dan variatif (beberapa fokus ke pimpinan, beberapa fokus ke manfaat zakat, beberapa fokus ke lokasi).
        PENTING: Jika pimpinan/lembaga ditandai hanya hadir tanpa pernyataan, jangan buat judul yang seolah-olah mereka memberikan pernyataan.
        Format output: Hanya daftar 10 judul, pisahkan dengan baris baru. Jangan berikan nomor atau teks tambahan.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const titles = (response.text || '').split('\n').filter(t => t.trim().length > 0).slice(0, 10);
      setSuggestedTitles(titles);
    } catch (error) {
      console.error("Error generating titles:", error);
    } finally {
      setIsGeneratingTitles(false);
    }
  };

  const generateFullNews = async (chosenTitle: string) => {
    if (!ai) {
      setApiKeyError('API Key wajib diisi untuk menggunakan fitur AI');
      return;
    }
    setIsGeneratingContent(true);
    setFormData(prev => ({ ...prev, title: chosenTitle }));
    
    try {
      const leadersInfo = formData.leaders.map(l => {
        const statement = formData.leaderStatements[l];
        return statement ? `${l} menyampaikan: "${statement}"` : `${l} turut hadir dalam kegiatan tersebut`;
      }).join('\n');
      const otherInfo = formData.otherInstitutions.map(oi => {
        return oi.statement ? `${oi.name} dari ${oi.institution} menyampaikan: "${oi.statement}"` : `${oi.name} dari ${oi.institution} turut hadir dalam kegiatan tersebut`;
      }).join('\n');
      const prompt = `
        Tuliskan berita lengkap yang rapi sesuai Ejaan yang Disempurnakan (EYD) untuk BAZNAS Kabupaten Dharmasraya.
        
        Judul Berita: ${chosenTitle}
        Nama Kegiatan: ${formData.activityName}
        ${formData.distributionProgram ? `Program Penyaluran: ${formData.distributionProgram}` : ''}
        ${formData.assistanceType ? `Bentuk Bantuan: ${formData.assistanceType}` : ''}
        ${formData.mustahikCount ? `Jumlah Mustahik: ${formData.mustahikCount}` : ''}
        ${formData.distributionArea ? `Daerah Bantuan: ${formData.distributionArea}` : ''}
        Program (Tema Utama): ${formData.program || 'N/A'}
        Tema (Sub-tema): ${formData.theme || 'N/A'}
        Pimpinan & Pernyataan:
        ${leadersInfo}
        Lembaga Lain & Pernyataan:
        ${otherInfo}
        Waktu: ${formData.date}
        Tempat: ${formData.location}
        Jumlah Paragraf: ${formData.paragraphCount}
        Penutup Khusus: ${formData.closingTypes.includes('doa') ? 'Sertakan doa penutup yang menyentuh. ' : ''}${formData.closingTypes.includes('foto') ? 'Sertakan kalimat penutup tentang sesi foto bersama. ' : ''}${formData.closingTypes.includes('rekening') ? 'Sertakan ajakan berzakat/infak ke BAZNAS dengan mencantumkan detail rekening berikut di akhir berita:\n\nZakat\nBRI: 2173.01.000166.30.2 (A.n: Zakat BAZNAS Dharmasraya)\nNagari: 7105.01.08.00002.3 (A.n: Zakat BAZNAS Dharmasraya)\nBSI: 7218586858 (A.n: Zakat BAZNAS Kab. Dharmasraya)\n\nRekening Infak dan Sedekah\nBRI: 2173.01.003240.53.7 (A.n: Infak BAZNAS Dharmasraya)\nNagari: 7105.02.20.02024.8 (A.n: Infak Sedekah BAZNAS Kab. Dharmasraya)\nBSI: 7218587083 (A.n: Infak Sedekah BAZNAS Kab. Dharmasraya)\n\nKonfirmasi Zakat\nContact Center BAZNAS Kab. Dharmasraya: 0853-6469-4546' : ''}
        Catatan Tambahan: ${formData.rawNotes}
        
        Panduan Penulisan:
        1. Gunakan gaya bahasa jurnalistik formal namun tetap menyentuh hati.
        2. Pastikan alur berita logis: Pembukaan, Isi (detail kegiatan & kutipan pimpinan), dan Penutup (harapan/doa).
        3. Gunakan EYD yang benar (huruf kapital, tanda baca, kata baku).
        4. Tonjolkan peran BAZNAS dalam menyejahterakan umat di Dharmasraya.
        5. Jika pimpinan atau perwakilan lembaga lain ditandai hanya "turut hadir" tanpa pernyataan, cukup sebutkan kehadiran mereka dalam narasi berita tanpa mengarang kutipan atau pernyataan untuk mereka.
        6. Pisahkan setiap paragraf dengan tepat satu baris kosong (double newline), jangan gunakan lebih dari satu baris kosong.
        7. JANGAN sertakan judul lagi di dalam isi berita, karena judul sudah ditampilkan secara terpisah.
        8. Tuliskan berita dalam tepat ${formData.paragraphCount} paragraf.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setFormData(prev => ({ ...prev, generatedContent: response.text || '' }));
      // Do not clear suggestedTitles here so user can go back to them
    } catch (error) {
      console.error("Error generating content:", error);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleSaveNews = () => {
    const newItem: NewsItem = {
      id: Date.now().toString(),
      title: formData.title,
      activityName: formData.activityName,
      distributionProgram: formData.distributionProgram,
      assistanceType: formData.assistanceType,
      mustahikCount: formData.mustahikCount,
      distributionArea: formData.distributionArea,
      leaders: formData.leaders,
      otherInstitutions: formData.otherInstitutions,
      date: formData.date,
      location: formData.location,
      program: formData.program,
      theme: formData.theme,
      content: formData.generatedContent || formData.rawNotes,
      imageUrl: formData.image || `https://picsum.photos/seed/${Date.now()}/800/400`,
      timestamp: Date.now()
    };
    
    setNews([newItem, ...news]);
    setView('home');
    // Reset form
    setFormData({
      activityName: ACTIVITY_NAMES[0],
      activityNameOption: ACTIVITY_NAMES[0],
      distributionProgram: '',
      assistanceType: '',
      mustahikCount: '',
      distributionArea: '',
      title: '',
      leaders: [],
      leaderStatements: {},
      otherInstitutions: [],
      date: new Date().toISOString().split('T')[0],
      location: LOCATIONS[0],
      locationOption: LOCATIONS[0],
      program: '',
      theme: '',
      paragraphCount: 3,
      closingTypes: [],
      rawNotes: '',
      generatedContent: '',
      image: null
    });
    setSuggestedTitles([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredNews = news.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.leaders.some(l => l.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDots = (amount: number | string) => {
    if (!amount && amount !== 0) return '';
    const num = typeof amount === 'string' ? parseInt(amount.replace(/\D/g, '')) : amount;
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const calculateZakat = () => {
    const type = ZAKAT_TYPES[calcType];
    if (type.rate === 0) {
      // For peternakan or complex types, we just show steps
      setCalcResult(0);
    } else {
      setCalcResult(calcAmount * type.rate);
    }
  };

  const handleShare = async (title: string, content: string, image: string | null) => {
    // Ensure exactly one blank line between paragraphs for share
    const cleanContent = content.replace(/\n\n+/g, '\n\n');
    const shareText = `*${title}*\n\n${cleanContent}\n\n#BAZNAS #Dharmasraya #Zakat`;
    
    try {
      if (navigator.share) {
        const shareData: any = {
          title: title,
          text: shareText,
        };

        if (image && image.startsWith('data:')) {
          const res = await fetch(image);
          const blob = await res.blob();
          const file = new File([blob], 'berita-baznas.png', { type: 'image/png' });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            shareData.files = [file];
          }
        }

        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareText);
        alert("Teks berita telah disalin! Silakan tempel (paste) di media sosial Anda.");
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 max-w-md mx-auto shadow-2xl relative overflow-hidden flex flex-col">
      
      {/* --- Header --- */}
      <header className="bg-emerald-700 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center justify-between">
          {view !== 'home' ? (
            <button onClick={() => setView('home')} className="p-1 hover:bg-emerald-600 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
                <img src="https://baznas.go.id/assets/img/logo/logo-baznas.png" alt="Logo" className="w-8" referrerPolicy="no-referrer" />
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-lg font-bold leading-tight">BAZNAS</h1>
                  <p className="text-xs text-emerald-100">Kab. Dharmasraya</p>
                </div>
                <button 
                  onClick={() => setView('calculator')}
                  className="bg-emerald-600 p-2 rounded-xl flex items-center gap-2 hover:bg-emerald-500 transition-colors shadow-inner"
                >
                  <Calculator size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Kalkulator</span>
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button onClick={() => setView('search')} className="p-2 hover:bg-emerald-600 rounded-full transition-colors">
              <Search size={20} />
            </button>
            <div className="w-8 h-8 bg-emerald-800 rounded-full flex items-center justify-center">
              <User size={18} />
            </div>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          
            {/* Home View */}
            {view === 'home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4 space-y-6"
              >
                {/* Featured Banner */}
                <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-emerald-100 bg-emerald-50 relative min-h-[200px] flex items-center justify-center">
                  {isGeneratingBanner ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-emerald-600" size={32} />
                      <p className="text-xs font-bold text-emerald-700 animate-pulse">Membangun Kantor Digital...</p>
                    </div>
                  ) : (
                    <div className="relative w-full">
                      <img 
                        src={bannerImage || "https://raw.githubusercontent.com/ardiosnasir/baznas-assets/main/baznas-dharmasraya-staff-2026.jpg"} 
                        alt="Kantor BAZNAS Kabupaten Dharmasraya" 
                        className="w-full h-auto object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent flex items-end p-4">
                        <h2 className="text-white font-black text-xl drop-shadow-md">Baznas Kabupaten Dharmasraya</h2>
                      </div>
                    </div>
                  )}
                </div>

                {/* News List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Berita Kegiatan</h3>
                  <button className="text-emerald-600 text-sm font-semibold flex items-center gap-1">
                    Lihat Semua <ChevronRight size={16} />
                  </button>
                </div>
                
                {news.map((item) => (
                  <motion.div 
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedNews(item);
                      setView('detail');
                    }}
                    className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 flex gap-3 p-3 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 line-clamp-2 leading-snug mt-1">{item.title}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(item.date).toLocaleDateString('id-ID')}</span>
                        <span className="flex items-center gap-1"><MapPin size={10} /> {item.location.split(',')[0]}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Detail View */}
          {view === 'detail' && selectedNews && (
            <motion.div 
              key="detail"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white min-h-full"
            >
              <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <button 
                  onClick={() => setView('home')}
                  className="p-2 bg-slate-100 rounded-full text-slate-600"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-lg font-bold text-slate-900 truncate flex-1">
                  {selectedNews.title}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                <div className="w-full h-64 rounded-2xl overflow-hidden shadow-lg">
                  <img src={selectedNews.imageUrl} alt={selectedNews.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>

                {selectedNews.theme && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <p className="text-[10px] text-emerald-600 uppercase font-bold mb-1">Program & Tema</p>
                    <p className="text-sm font-bold text-emerald-800">{selectedNews.program}: {selectedNews.theme}</p>
                  </div>
                )}
                
                <div className="flex justify-end items-start">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleShare(selectedNews.title, selectedNews.content, selectedNews.imageUrl)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 rounded-full text-white shadow-md hover:bg-emerald-700 transition-all active:scale-95"
                      title="Bagikan Berita"
                    >
                      <Share2 size={16} />
                      <span className="text-xs font-bold">Bagikan</span>
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Calendar className="text-emerald-600" size={20} />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Waktu</p>
                      <p className="text-xs font-bold">{new Date(selectedNews.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <MapPin className="text-emerald-600" size={20} />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Tempat</p>
                      <p className="text-xs font-bold truncate">{selectedNews.location}</p>
                    </div>
                  </div>
                </div>

                {/* Distribution Info in Detail */}
                {(selectedNews.activityName === 'Pendistribusian' || selectedNews.activityName === 'Pendistribusian & Pendayagunaan') && (
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3">
                    <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 size={12} /> Detail Penyaluran:
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-2 rounded-xl border border-emerald-100">
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Program</p>
                        <p className="text-[11px] font-bold text-emerald-800">{selectedNews.distributionProgram || '-'}</p>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-emerald-100">
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Daerah</p>
                        <p className="text-[11px] font-bold text-emerald-800">{selectedNews.distributionArea || '-'}</p>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-emerald-100">
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Bentuk</p>
                        <p className="text-[11px] font-bold text-emerald-800">{selectedNews.assistanceType || '-'}</p>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-emerald-100">
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Mustahik</p>
                        <p className="text-[11px] font-bold text-emerald-800">{selectedNews.mustahikCount || '-'} Orang</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Users size={16} className="text-emerald-600" /> Pimpinan Hadir
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedNews.leaders.map(leader => (
                      <span key={leader} className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1 rounded-lg font-medium">
                        {leader}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedNews.otherInstitutions && selectedNews.otherInstitutions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <Users size={16} className="text-blue-600" /> Lembaga Lain
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedNews.otherInstitutions.map((oi, idx) => (
                        <span key={idx} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-lg font-medium">
                          {oi.name} ({oi.institution})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>{selectedNews.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}

          {/* Add View */}
          {view === 'add' && (
            <motion.div 
              key="add"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Input Berita Baru</h2>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={10} /> AI Powered
                </span>
              </div>

              {/* Gemini API Key Section */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                    <Key size={14} className="text-emerald-600" /> Kunci API Gemini
                  </label>
                  {!geminiApiKey && (
                    <span className="text-[10px] font-bold text-red-500 uppercase animate-pulse">Wajib Isi</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="password" 
                      placeholder="Masukkan API Key Gemini..."
                      className={`w-full p-3 rounded-xl border ${apiKeyError ? 'border-red-300' : 'border-slate-200'} bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all`}
                      value={apiKeyInput}
                      onChange={e => setApiKeyInput(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={handleSaveApiKey}
                    className="px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
                  >
                    Simpan
                  </button>
                </div>
                {apiKeyError && <p className="text-[10px] text-red-500 font-medium ml-1">{apiKeyError}</p>}
                {geminiApiKey && !apiKeyError && (
                  <p className="text-[10px] text-emerald-600 font-bold ml-1 flex items-center gap-1">
                    <CheckCircle2 size={10} /> API Key aktif
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {/* Form View (only if no titles and no content) */}
                {!formData.generatedContent && suggestedTitles.length === 0 && (
                  <div className="space-y-4">
                    {/* Activity Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Nama Kegiatan</label>
                      <select 
                        className="w-full p-3 rounded-xl border border-slate-200 outline-none bg-white text-sm"
                        value={formData.activityNameOption}
                        onChange={e => {
                          const val = e.target.value;
                          setFormData({
                            ...formData, 
                            activityNameOption: val, 
                            activityName: val === 'Custom' ? '' : val,
                            // Reset distribution fields if not distribution
                            ...(val !== 'Pendistribusian' && val !== 'Pendistribusian & Pendayagunaan' ? {
                              distributionProgram: '',
                              assistanceType: '',
                              mustahikCount: ''
                            } : {})
                          });
                        }}
                      >
                        {ACTIVITY_NAMES.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>

                    {formData.activityNameOption === 'Custom' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="overflow-hidden"
                      >
                        <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1 ml-1">Nama Kegiatan Kustom</label>
                        <input 
                          type="text" 
                          placeholder="Masukkan nama kegiatan kustom..."
                          className="w-full p-3 rounded-xl border border-emerald-100 bg-emerald-50/30 outline-none focus:border-emerald-300"
                          value={formData.activityName}
                          onChange={e => setFormData({...formData, activityName: e.target.value})}
                        />
                      </motion.div>
                    )}

                    {/* Distribution Fields */}
                    {(formData.activityNameOption === 'Pendistribusian' || formData.activityNameOption === 'Pendistribusian & Pendayagunaan') && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 overflow-hidden"
                      >
                        <div>
                          <label className="block text-xs font-bold text-emerald-700 uppercase mb-2 ml-1">5 Program Penyaluran BAZNAS</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {DISTRIBUTION_PROGRAMS.map(prog => (
                              <button
                                key={prog}
                                onClick={() => setFormData({...formData, distributionProgram: prog})}
                                className={`py-2 px-3 rounded-lg text-[10px] font-bold transition-all ${
                                  formData.distributionProgram === prog 
                                    ? 'bg-emerald-600 text-white shadow-md' 
                                    : 'bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {prog}
                              </button>
                            ))}
                          </div>
                        </div>

                        {formData.distributionProgram && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                          >
                            <div>
                              <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1 ml-1">Bentuk Bantuan</label>
                              <input 
                                type="text" 
                                placeholder="Contoh: Sembako, Uang Tunai"
                                className="w-full p-2 text-sm rounded-lg border border-emerald-200 outline-none focus:border-emerald-400"
                                value={formData.assistanceType}
                                onChange={e => setFormData({...formData, assistanceType: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1 ml-1">Jumlah Mustahik</label>
                              <input 
                                type="number" 
                                placeholder="Jumlah orang..."
                                className="w-full p-2 text-sm rounded-lg border border-emerald-200 outline-none focus:border-emerald-400"
                                value={formData.mustahikCount}
                                onChange={e => setFormData({...formData, mustahikCount: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1 ml-1">Daerah Bantuan</label>
                              <input 
                                type="text" 
                                placeholder="Contoh: Kec. Pulau Punjung"
                                className="w-full p-2 text-sm rounded-lg border border-emerald-200 outline-none focus:border-emerald-400"
                                value={formData.distributionArea}
                                onChange={e => setFormData({...formData, distributionArea: e.target.value})}
                              />
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* Leaders Multi-select Dropdown */}
                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Pimpinan Hadir</label>
                      
                      {/* Dropdown Trigger Box */}
                      <div 
                        onClick={() => setIsLeaderDropdownOpen(!isLeaderDropdownOpen)}
                        className="w-full min-h-[50px] p-2 rounded-xl border border-slate-200 bg-white flex flex-wrap gap-2 items-center cursor-pointer focus-within:ring-2 focus-within:ring-emerald-500 transition-all"
                      >
                        {formData.leaders.length === 0 ? (
                          <span className="text-slate-400 text-sm ml-2">Klik untuk memilih pimpinan...</span>
                        ) : (
                          formData.leaders.map(leader => (
                            <span 
                              key={leader} 
                              className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                            >
                              {leader}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData({
                                    ...formData, 
                                    leaders: formData.leaders.filter(l => l !== leader)
                                  });
                                }}
                                className="hover:bg-emerald-200 rounded-full p-0.5"
                              >
                                <PlusCircle className="rotate-45" size={14} />
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      {/* Hidden Dropdown List */}
                      <AnimatePresence>
                        {isLeaderDropdownOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-[60] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
                          >
                            {LEADERS.map(leader => (
                              <button 
                                key={leader}
                                onClick={() => {
                                  const current = formData.leaders;
                                  if (current.includes(leader)) {
                                    setFormData({...formData, leaders: current.filter(l => l !== leader)});
                                  } else {
                                    setFormData({...formData, leaders: [...current, leader]});
                                  }
                                }}
                                className={`w-full text-left p-3 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                  formData.leaders.includes(leader) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600'
                                }`}
                              >
                                {leader}
                                {formData.leaders.includes(leader) && <CheckCircle2 size={16} className="text-emerald-600" />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Backdrop to close dropdown */}
                      {isLeaderDropdownOpen && (
                        <div 
                          className="fixed inset-0 z-[55]" 
                          onClick={() => setIsLeaderDropdownOpen(false)}
                        />
                      )}

                      {/* Leader Statements - Dynamic Inputs */}
                      <div className="mt-4">
                        <AnimatePresence>
                          {formData.leaders.map(leader => (
                            <motion.div 
                              key={`statement-${leader}`}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mb-3 overflow-hidden"
                            >
                              <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1 ml-1">
                                Apa yang disampaikan {leader}?
                              </label>
                              <input 
                                type="text" 
                                placeholder="Kutipan atau pesan pimpinan..."
                                className="w-full p-2 text-sm rounded-lg border border-emerald-100 bg-emerald-50/30 outline-none focus:border-emerald-300"
                                value={formData.leaderStatements[leader] || ''}
                                onChange={e => setFormData({
                                  ...formData, 
                                  leaderStatements: {
                                    ...formData.leaderStatements,
                                    [leader]: e.target.value
                                  }
                                })}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>

                      {/* Lembaga Lain Section */}
                      <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Users size={14} /> Lembaga Lain (Optional)
                          </label>
                          <button 
                            onClick={() => setFormData({
                              ...formData, 
                              otherInstitutions: [...formData.otherInstitutions, { name: '', institution: '', statement: '' }]
                            })}
                            className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
                          >
                            <PlusCircle size={12} /> Tambah Lembaga
                          </button>
                        </div>

                        <AnimatePresence>
                          {formData.otherInstitutions.map((oi, index) => (
                            <motion.div 
                              key={`other-${index}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="mb-4 p-3 bg-white rounded-xl border border-slate-100 shadow-sm relative"
                            >
                              <button 
                                onClick={() => {
                                  const updated = [...formData.otherInstitutions];
                                  updated.splice(index, 1);
                                  setFormData({ ...formData, otherInstitutions: updated });
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md z-10"
                              >
                                <PlusCircle className="rotate-45" size={12} />
                              </button>

                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 ml-1">Nama Orang</label>
                                  <input 
                                    type="text" 
                                    placeholder="Contoh: Budi"
                                    className="w-full p-2 text-xs rounded-lg border border-slate-100 outline-none focus:border-emerald-300"
                                    value={oi.name}
                                    onChange={e => {
                                      const updated = [...formData.otherInstitutions];
                                      updated[index].name = e.target.value;
                                      setFormData({ ...formData, otherInstitutions: updated });
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 ml-1">Lembaga</label>
                                  <input 
                                    type="text" 
                                    placeholder="Contoh: Dinas Sosial"
                                    className="w-full p-2 text-xs rounded-lg border border-slate-100 outline-none focus:border-emerald-300"
                                    value={oi.institution}
                                    onChange={e => {
                                      const updated = [...formData.otherInstitutions];
                                      updated[index].institution = e.target.value;
                                      setFormData({ ...formData, otherInstitutions: updated });
                                    }}
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[9px] font-bold text-emerald-600 uppercase mb-1 ml-1">Apa yang disampaikan? (Optional)</label>
                                <input 
                                  type="text" 
                                  placeholder="Kutipan atau pesan..."
                                  className="w-full p-2 text-xs rounded-lg border border-emerald-50 bg-emerald-50/20 outline-none focus:border-emerald-300"
                                  value={oi.statement || ''}
                                  onChange={e => {
                                    const updated = [...formData.otherInstitutions];
                                    updated[index].statement = e.target.value;
                                    setFormData({ ...formData, otherInstitutions: updated });
                                  }}
                                />
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        
                        {formData.otherInstitutions.length === 0 && (
                          <p className="text-[10px] text-slate-400 italic text-center py-2">Belum ada lembaga lain yang ditambahkan</p>
                        )}
                      </div>
                    </div>

                    {/* Date & Location */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Waktu</label>
                        <input 
                          type="date" 
                          className="w-full p-3 rounded-xl border border-slate-200 outline-none"
                          value={formData.date}
                          onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Tempat</label>
                        <select 
                          className="w-full p-3 rounded-xl border border-slate-200 outline-none bg-white text-sm"
                          value={formData.locationOption}
                          onChange={e => {
                            const val = e.target.value;
                            setFormData({
                              ...formData, 
                              locationOption: val, 
                              location: val === 'Custom' ? '' : val
                            });
                          }}
                        >
                          {LOCATIONS.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {formData.locationOption === 'Custom' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="overflow-hidden"
                      >
                        <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1 ml-1">Lokasi Kustom</label>
                        <input 
                          type="text" 
                          placeholder="Masukkan lokasi kustom..."
                          className="w-full p-3 rounded-xl border border-emerald-100 bg-emerald-50/30 outline-none focus:border-emerald-300"
                          value={formData.location}
                          onChange={e => setFormData({...formData, location: e.target.value})}
                        />
                      </motion.div>
                    )}

                    {/* Theme (Program & Sub-theme) */}
                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Tema (Optional)</label>
                      <div 
                        onClick={() => setIsProgramDropdownOpen(!isProgramDropdownOpen)}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-emerald-500 transition-all"
                      >
                        <span className={formData.theme ? "text-slate-800 text-sm font-medium" : "text-slate-400 text-sm"}>
                          {formData.theme ? `${formData.program}: ${formData.theme}` : "Pilih Tema Program..."}
                        </span>
                        <ChevronRight className={`text-slate-400 transition-transform ${isProgramDropdownOpen ? 'rotate-90' : ''}`} size={18} />
                      </div>

                      <AnimatePresence>
                        {isProgramDropdownOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-[70] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex"
                            style={{ height: '300px' }}
                          >
                            {/* Left Side: Programs */}
                            <div className="w-1/2 border-r border-slate-100 overflow-y-auto bg-slate-50/50">
                              {Object.keys(PROGRAM_THEMES).map(prog => (
                                <div 
                                  key={prog}
                                  onMouseEnter={() => setHoveredProgram(prog)}
                                  className={`p-3 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors flex items-center justify-between ${
                                    hoveredProgram === prog ? 'bg-white text-emerald-600' : 'text-slate-500 hover:bg-slate-100'
                                  }`}
                                >
                                  {prog}
                                  <ChevronRight size={12} />
                                </div>
                              ))}
                            </div>

                            {/* Right Side: Themes */}
                            <div className="w-1/2 overflow-y-auto bg-white">
                              {hoveredProgram ? (
                                <div className="p-1">
                                  {PROGRAM_THEMES[hoveredProgram as keyof typeof PROGRAM_THEMES].map(t => (
                                    <button
                                      key={t}
                                      onClick={() => {
                                        setFormData({...formData, program: hoveredProgram, theme: t});
                                        setIsProgramDropdownOpen(false);
                                      }}
                                      className="w-full text-left p-3 text-xs text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors"
                                    >
                                      {t}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center p-4 text-center">
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">Pilih Program di Kiri</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {isProgramDropdownOpen && (
                        <div className="fixed inset-0 z-[65]" onClick={() => setIsProgramDropdownOpen(false)} />
                      )}
                    </div>

                    {/* Paragraph Count & Closing Type */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Jumlah Paragraf</label>
                        <select 
                          className="w-full p-3 rounded-xl border border-slate-200 outline-none bg-white text-sm"
                          value={formData.paragraphCount}
                          onChange={e => setFormData({...formData, paragraphCount: parseInt(e.target.value)})}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <option key={n} value={n}>{n} Paragraf</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Penutup (Bisa Pilih {'>'}1)</label>
                        <div className="flex gap-1.5">
                          {['doa', 'foto', 'rekening'].map(type => (
                            <button 
                              key={type}
                              onClick={() => {
                                const current = formData.closingTypes;
                                if (current.includes(type)) {
                                  setFormData({...formData, closingTypes: current.filter(t => t !== type)});
                                } else {
                                  setFormData({...formData, closingTypes: [...current, type]});
                                }
                              }}
                              className={`flex-1 py-3 rounded-xl border text-[9px] font-bold uppercase transition-all ${
                                formData.closingTypes.includes(type) 
                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' 
                                  : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-200'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Upload Foto Kegiatan</label>
                      <div className="relative group">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label 
                          htmlFor="image-upload"
                          className="w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all overflow-hidden"
                        >
                          {formData.image ? (
                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <ImageIcon className="text-slate-300" size={32} />
                              <span className="text-xs text-slate-400 font-medium">Klik untuk pilih foto</span>
                            </>
                          )}
                        </label>
                        {formData.image && (
                          <button 
                            onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md"
                          >
                            <PlusCircle className="rotate-45" size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Raw Notes */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Catatan Mentah / Poin Berita</label>
                      <textarea 
                        rows={4}
                        placeholder="Masukkan poin-poin kegiatan di sini..."
                        className="w-full p-3 rounded-xl border border-slate-200 outline-none resize-none"
                        value={formData.rawNotes}
                        onChange={e => setFormData({...formData, rawNotes: e.target.value})}
                      />
                      
                      <button 
                        onClick={generateTitles}
                        disabled={isGeneratingTitles || !formData.rawNotes}
                        className="mt-2 w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold rounded-xl transition-all shadow-md"
                      >
                        {isGeneratingTitles ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                        {isGeneratingTitles ? 'Mencari Judul Terbaik...' : 'Generate Judul Berita'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Suggested Titles Selection (only if titles exist and no content yet) */}
                {suggestedTitles.length > 0 && !formData.generatedContent && (
                  <motion.div 
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-amber-600 uppercase flex items-center gap-1">
                        <CheckCircle2 size={14} /> Pilih 1 Judul Terbaik:
                      </h3>
                      <button 
                        onClick={() => setSuggestedTitles([])}
                        className="text-[10px] font-bold text-slate-400 underline"
                      >
                        Kembali ke Form
                      </button>
                    </div>
                    <div className="space-y-2">
                      {suggestedTitles.map((title, idx) => (
                        <button
                          key={idx}
                          onClick={() => generateFullNews(title)}
                          disabled={isGeneratingContent}
                          className="w-full text-left p-3 text-sm rounded-xl border border-amber-100 bg-amber-50/30 hover:bg-amber-100 transition-colors flex items-center gap-2"
                        >
                          <span className="w-5 h-5 flex-shrink-0 bg-amber-200 text-amber-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="flex-1 font-medium">{title}</span>
                          {isGeneratingContent && formData.title === title && <Loader2 className="animate-spin text-amber-600" size={16} />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Generated Preview (only if content exists) */}
                {formData.generatedContent && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-emerald-700 uppercase flex items-center gap-1">
                        <CheckCircle2 size={14} /> Hasil Berita (Format EYD)
                      </h3>
                      <button 
                        onClick={() => setFormData({...formData, generatedContent: ''})}
                        className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        <ArrowLeft size={12} /> Ganti Judul
                      </button>
                    </div>
                    <div className="text-sm text-slate-700 prose prose-sm max-w-none bg-white p-4 rounded-lg border border-emerald-100 shadow-inner space-y-4">
                      <h4 className="font-bold text-lg text-slate-900 mb-2 text-center">{formData.title}</h4>
                      
                      {formData.image && (
                        <div className="w-full rounded-xl overflow-hidden shadow-sm">
                          <img src={formData.image} alt="Preview" className="w-full h-auto object-cover" />
                        </div>
                      )}

                      <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkBreaks]}>{formData.generatedContent}</ReactMarkdown>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button 
                        onClick={() => handleShare(formData.title, formData.generatedContent, formData.image)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <Share2 size={18} /> Bagikan Berita
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setView('home')}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSaveNews}
                    disabled={!formData.title || (!formData.generatedContent && !formData.rawNotes)}
                    className="flex-[2] py-4 bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                  >
                    <Send size={18} /> Simpan & Publikasi
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Calculator View */}
          {view === 'calculator' && (
            <motion.div 
              key="calculator"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Calculator className="text-emerald-600" size={24} /> Kalkulator Zakat
                </h2>
                <button 
                  onClick={() => setView('home')}
                  className="p-2 bg-slate-100 rounded-full text-slate-400"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                {/* Zakat Type Selection Dropdown */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Jenis Zakat</label>
                  <div 
                    onClick={() => setIsCalcDropdownOpen(!isCalcDropdownOpen)}
                    className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-all"
                  >
                    <span className="font-bold text-slate-800">{ZAKAT_TYPES[calcType].name}</span>
                    <ChevronRight className={`text-slate-400 transition-transform ${isCalcDropdownOpen ? 'rotate-90' : ''}`} size={20} />
                  </div>

                  <AnimatePresence>
                    {isCalcDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-[70] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
                      >
                        {Object.entries(ZAKAT_TYPES).map(([key, data]) => (
                          <button 
                            key={key}
                            onClick={() => {
                              setCalcType(key as keyof typeof ZAKAT_TYPES);
                              setCalcResult(null);
                              setIsCalcDropdownOpen(false);
                            }}
                            className={`w-full text-left p-4 text-sm flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                              calcType === key ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600'
                            }`}
                          >
                            {data.name}
                            {calcType === key && <CheckCircle2 size={16} className="text-emerald-600" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Calculation Steps */}
                <motion.div 
                  key={`steps-${calcType}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2"
                >
                  <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                    <Filter size={12} /> Langkah Menghitung:
                  </h4>
                  <ul className="space-y-1.5">
                    {ZAKAT_TYPES[calcType].steps.map((step, i) => (
                      <li key={i} className="text-[11px] text-slate-600 flex gap-2">
                        <span className="font-bold text-emerald-600">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase ml-1">
                    {calcType === 'peternakan' ? 'Jumlah Hewan Ternak' : 'Total Nilai / Harta (Rp)'}
                  </label>
                  <div className="relative">
                    {calcType !== 'peternakan' && <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>}
                    <input 
                      type="text" 
                      inputMode="numeric"
                      placeholder="0"
                      className={`w-full p-4 ${calcType !== 'peternakan' ? 'pl-12' : ''} rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg`}
                      value={formatDots(calcAmount)}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setCalcAmount(val ? parseInt(val) : 0);
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    *Nisab {ZAKAT_TYPES[calcType].name}: {ZAKAT_TYPES[calcType].nisab}
                  </p>
                </div>

                {/* Calculate Button */}
                <button 
                  onClick={calculateZakat}
                  className="w-full py-4 bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  Hitung Zakat
                </button>

                {/* Result */}
                <AnimatePresence>
                  {calcResult !== null && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-2"
                    >
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Zakat yang Harus Ditunaikan</p>
                      {calcType === 'peternakan' ? (
                        <h3 className="text-xl font-black text-emerald-800">Cek Tabel Langkah Diatas</h3>
                      ) : (
                        <h3 className="text-3xl font-black text-emerald-800">{formatCurrency(calcResult)}</h3>
                      )}
                      <p className="text-[10px] text-emerald-600 font-medium">
                        {ZAKAT_TYPES[calcType].rate > 0 
                          ? `Berdasarkan perhitungan ${ZAKAT_TYPES[calcType].rate * 100}% dari total`
                          : 'Silakan ikuti panduan langkah di atas'}
                      </p>
                      
                      <button 
                        className="mt-4 w-full py-3 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-100 transition-colors"
                        onClick={() => {
                          alert("Terima kasih! Silakan salurkan zakat Anda melalui rekening resmi BAZNAS Dharmasraya.");
                        }}
                      >
                        Tunaikan Zakat Sekarang
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Search View */}
          {view === 'search' && (
            <motion.div 
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4"
            >
              <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                <Search size={20} className="text-slate-400 ml-2" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Cari berita, pimpinan, atau tempat..."
                  className="flex-1 p-2 outline-none text-sm"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="p-2 text-slate-400">
                    <PlusCircle className="rotate-45" size={20} />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {filteredNews.length > 0 ? (
                  filteredNews.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        setSelectedNews(item);
                        setView('detail');
                      }}
                      className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-1">{item.location} • {new Date(item.date).toLocaleDateString('id-ID')}</p>
                      </div>
                      <ChevronRight size={18} className="text-slate-300" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Search size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 text-sm">Tidak ada berita yang ditemukan</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Gallery View */}
          {view === 'gallery' && (
            <motion.div 
              key="gallery"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <ImageIcon className="text-emerald-600" size={24} /> Galeri Kegiatan
                </h2>
                <button onClick={() => setView('home')} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <ArrowLeft size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {news.map((item) => (
                  <motion.div 
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedNews(item);
                      setView('detail');
                    }}
                    className="aspect-square rounded-2xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer relative group"
                  >
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <p className="text-[10px] text-white font-bold line-clamp-2">{item.title}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Programs View */}
          {view === 'programs' && (
            <motion.div 
              key="programs"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="p-4 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="text-emerald-600" size={24} /> Program & Kegiatan
                </h2>
                <button onClick={() => setView('home')} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <ArrowLeft size={20} />
                </button>
              </div>

              <div className="space-y-3">
                {ACTIVITY_NAMES.filter(a => a !== 'Custom').map((activity) => (
                  <motion.button
                    key={activity}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedProgram(activity);
                      setView('program_detail');
                    }}
                    className="w-full p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-emerald-200 hover:bg-emerald-50/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                        <CheckCircle2 size={20} />
                      </div>
                      <span className="font-bold text-slate-700">{activity}</span>
                    </div>
                    <ChevronRight className="text-slate-400" size={20} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Program Detail View */}
          {view === 'program_detail' && selectedProgram && (
            <motion.div 
              key="program_detail"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="p-4 space-y-6"
            >
              <div className="flex items-center gap-3">
                <button onClick={() => setView('programs')} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-lg font-bold text-slate-800 truncate">Kegiatan: {selectedProgram}</h2>
              </div>

              <div className="space-y-4">
                {news.filter(n => n.activityName === selectedProgram).length > 0 ? (
                  news.filter(n => n.activityName === selectedProgram).map((item) => (
                    <motion.div 
                      key={item.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedNews(item);
                        setView('detail');
                      }}
                      className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 flex gap-3 p-3 cursor-pointer"
                    >
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col justify-between py-1">
                        <h4 className="font-bold text-xs text-slate-800 line-clamp-2 leading-snug">{item.title}</h4>
                        <div className="flex items-center gap-2 text-[9px] text-slate-400">
                          <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(item.date).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-400 text-sm italic">Belum ada berita untuk kategori ini</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* --- Bottom Navigation --- */}
      <nav className="bg-white border-t border-slate-100 p-3 flex justify-around items-center absolute bottom-0 w-full z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setView('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'home' ? 'text-emerald-700' : 'text-slate-400'}`}
        >
          <Home size={22} fill={view === 'home' ? 'currentColor' : 'none'} />
          <span className="text-[10px] font-bold">Beranda</span>
        </button>
        <button 
          onClick={() => setView('gallery')}
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'gallery' ? 'text-emerald-700' : 'text-slate-400'}`}
        >
          <ImageIcon size={22} />
          <span className="text-[10px] font-bold">Galeri</span>
        </button>
        <button 
          onClick={() => setView('add')}
          className="relative -top-6 bg-emerald-700 text-white p-4 rounded-full shadow-xl shadow-emerald-200 border-4 border-slate-50 active:scale-90 transition-transform"
        >
          <PlusCircle size={28} />
        </button>
        <button 
          onClick={() => setView('programs')}
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'programs' || view === 'program_detail' ? 'text-emerald-700' : 'text-slate-400'}`}
        >
          <Sparkles size={22} />
          <span className="text-[10px] font-bold">Program</span>
        </button>
        <button 
          onClick={() => setView('calculator')}
          className={`flex flex-col items-center gap-1 transition-colors ${view === 'calculator' ? 'text-emerald-700' : 'text-slate-400'}`}
        >
          <Calculator size={22} />
          <span className="text-[10px] font-bold">Zakat</span>
        </button>
      </nav>

      {/* Custom CSS for hiding scrollbar and paragraph spacing */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .markdown-body p {
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }
        .markdown-body p:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
