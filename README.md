# BAZNAS Kabupaten Dharmasraya - News App

Aplikasi berita dan kalkulator zakat untuk BAZNAS Kabupaten Dharmasraya.

## Fitur
- Berita terbaru seputar kegiatan BAZNAS Dharmasraya.
- Kalkulator Zakat (Penghasilan, Maal, Emas, dll) dengan format angka otomatis.
- Galeri foto kegiatan.
- Program-program BAZNAS.
- Input berita baru dengan bantuan AI (Gemini).

## Cara Deploy ke Netlify

1.  **Hubungkan ke GitHub/GitLab/Bitbucket**: Unggah kode ini ke repositori Git Anda.
2.  **Buat Situs Baru di Netlify**: Pilih repositori Anda.
3.  **Pengaturan Build**:
    - **Build Command**: `npm run build`
    - **Publish Directory**: `dist`
4.  **Environment Variables**:
    - Tambahkan `GEMINI_API_KEY` di bagian **Site settings > Build & deploy > Environment variables**.
5.  **Deploy**: Klik "Deploy site".

Aplikasi ini sudah dilengkapi dengan `netlify.toml` dan `_redirects` untuk menangani routing SPA (Single Page Application) secara otomatis.
