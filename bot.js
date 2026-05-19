const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

// Fungsi untuk menghitung sisa hari menuju target
function getCountdown() {
    const targetDate = new Date('2026-10-10'); // <--- SESUAIKAN TANGGAL TARGET DI SINI
    const today = new Date();
    
    // Reset jam ke 00:00:00 agar perhitungan hari akurat
    targetDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    const timeDiff = targetDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysLeft > 0) {
        return `🔥 *COUNTDOWN CONCERT* 🔥\n\nHalo kawan-kawan! Sisa *${daysLeft} hari* lagi menuju konser 10 Oktober! Selalu jaga kesehatan dan utamakan sikap saling menghargai.`;
    } else if (daysLeft === 0) {
        return `🎉 *HARI INI ADALAH WAKTUNYA!* 🎉\n\nKonser yang kita tunggu-tunggu akhirnya tiba hari ini! Enjoy the show!`;
    } else {
        return null; // Target tanggal sudah lewat
    }
}

async function startBot() {
    // Menggunakan auth_info untuk menyimpan session login
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // Dimatikan karena sudah deprecated di versi baru
        browser: Browsers.macOS('Desktop'), // Menyamarkan sebagai WA Web Mac resmi agar lolos error 405
        syncFullHistory: false // Membuat koneksi awal lebih ringan dan cepat
    });

    // Menyimpan kredensial/session setiap ada perubahan (penting untuk GitHub Actions)
    sock.ev.on('creds.update', saveCreds);

    // Menangani status koneksi dan QR Code
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Jika server meminta QR, cetak manual menggunakan qrcode-terminal
        if (qr) {
            console.log('\n=========================================');
            console.log('👉 SILAKAN SCAN QR CODE DI BAWAH INI 👈');
            console.log('=========================================\n');
            qrcode.generate(qr, { small: true });
            console.log('\n=========================================');
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log(`Koneksi terputus (Status: ${statusCode}). Mencoba hubung kembali: ${shouldReconnect}`);
            
            if (shouldReconnect) {
                // Jeda 3 detik sebelum mencoba terhubung kembali untuk menghindari spam ke server WA
                setTimeout(() => startBot(), 3000); 
            }
        } else if (connection === 'open') {
            console.log('✅ Bot Berhasil Terhubung ke WhatsApp!');

            const teksPesan = getCountdown();
            
            if (teksPesan) {
                // ID Target Kirim Pesan
                // Masukkan nomor tujuan di sini (Ganti xxxxxxxxx dengan nomor HP)
                // Format nomor internasional tanpa simbol '+' (contoh: 628123456789)
                const targetId = '120363406965958235@g.us'; // <--- GANTI NOMOR TARGET DI SINI

                console.log('Mengirim pesan countdown...');
                await sock.sendMessage(targetId, { text: teksPesan });
                console.log('✅ Pesan sukses terkirim!');
            } else {
                console.log('Target tanggal sudah lewat, tidak ada pesan dikirim.');
            }

            // Beri jeda 5 detik agar proses pengiriman selesai, lalu matikan bot secara aman
            setTimeout(() => {
                console.log('Menutup bot secara aman...');
                process.exit(0);
            }, 5000);
        }
    });
}

// Menjalankan fungsi utama bot
startBot().catch(err => console.error("Gagal menjalankan bot:", err));