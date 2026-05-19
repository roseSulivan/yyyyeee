const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

// Fungsi untuk menghitung sisa hari menuju target dan membuat progress bar meriah
function getCountdown() {
    const targetDate = new Date('2026-10-10'); // Tanggal Konser A7X
    const today = new Date();
    
    // Reset jam ke 00:00:00 agar perhitungan hari akurat
    targetDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    const timeDiff = targetDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysLeft > 0) {
        // Logika pembuatan progress bar
        const totalHariTunggu = 150; // Total perkiraan rentang hari tunggu menuju konser
        const hariTerlewati = totalHariTunggu - daysLeft;
        
        // Amankan persentase agar selalu berada di range 0% - 100%
        let persentase = Math.floor((hariTerlewati / totalHariTunggu) * 100);
        if (persentase < 0) persentase = 0;
        if (persentase > 100) persentase = 100;

        // Bikin bar kotak-kotak (Panjang 10 karakter)
        const panjangBar = 10;
        const jumlahKotakIsi = Math.round((persentase / 100) * panjangBar);
        const jumlahKotakKosong = panjangBar - jumlahKotakIsi;
        const progressBar = '🟦'.repeat(jumlahKotakIsi) + '⬛'.repeat(jumlahKotakKosong);

        // Template pesan super meriah khas Deathbat Blitar Raya
        return `🔥 *A7X NATION BLITAR RAYA PROUDLY PRESENT* 🔥
🤘 *ROAD TO AVENGED SEVENFOLD CONCERT 2026* 🤘
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Halo kawan-kawan *Deathbat Family*! 🦇
Waktu berjalan cepat, persiapkan energi kalian dari sekarang!

⏳ *Sisa Hari:* *${daysLeft} Hari Lagi!*
📊 *Progress Menuju Hari H:*
${progressBar} [ *${persentase}%* ]

━━━━━━━━━━━━━━━━━━━━━━━━━━━
💪 *PESAN HARI INI:*
_ Gak ada !

*#FoREVer* 🦅
*Salam Persaudaraan - Deathbat Blitar Raya* 🖤`;

    } else if (daysLeft === 0) {
        return `🎉 *WAKTUNYA TELAH TIBA! SEIZE THE DAY!* 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤘 *HARI INI ADALAH SEJARAH KITA!* 🤘

Konser *AVENGED SEVENFOLD* yang kita tunggu-tunggu akhirnya resmi digelar hari ini! 

🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦 [ *100% DONE* ]

Ayo merapat, jaga barisan, nikmati pertunjukan, dan buat Blitar Raya bangga di venue! Enjoy the show, kawan-kawan! 🔥🦇💥`;
    } else {
        return null; // Target tanggal sudah lewat
    }
}

async function startBot() {
    // Menggunakan auth_info untuk menyimpan session login
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: Browsers.macOS('Desktop'), // Menyamarkan sebagai WA Web Mac resmi agar lolos error 405
        syncFullHistory: false // Membuat koneksi awal lebih ringan dan cepat
    });

    // Menyimpan kredensial/session setiap ada perubahan
    sock.ev.on('creds.update', saveCreds);

    // Menangani status koneksi dan QR Code
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

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
                setTimeout(() => startBot(), 3000); 
            }
        } else if (connection === 'open') {
            console.log('✅ Bot Berhasil Terhubung ke WhatsApp!');

            const teksPesan = getCountdown();
            
            if (teksPesan) {
                // ID Grup Target yang sudah kamu pasang sebelumnya
                const targetId = '120363406965958235@g.us';

                console.log('Mengirim pesan countdown meriah...');
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
