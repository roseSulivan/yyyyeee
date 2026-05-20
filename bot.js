const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

// Fungsi untuk menghitung sisa waktu detail (Hari, Jam, Menit) menuju target jam 7 malam
function getCountdown() {
    // Set target ke 10 Oktober 2026 jam 19:00 (7 Malam) WIB
    const targetDate = new Date('2026-10-10T19:00:00'); 
    const today = new Date();
    
    const timeDiff = targetDate.getTime() - today.getTime();
    
    if (timeDiff > 0) {
        // Logika hitung Hari, Jam, dan Menit secara presisi
        const daysLeft = Math.floor(timeDiff / (1000 * 3600 * 24));
        const hoursLeft = Math.floor((timeDiff % (1000 * 3600 * 24)) / (1000 * 3600));
        const minutesLeft = Math.floor((timeDiff % (1000 * 3600)) / (1000 * 60));

        // Logika pembuatan progress bar (Rentang tunggu 150 hari)
        const totalHariTunggu = 150; 
        const hariTerlewati = totalHariTunggu - daysLeft;
        
        let persentase = Math.floor((hariTerlewati / totalHariTunggu) * 100);
        if (persentase < 0) persentase = 0;
        if (persentase > 100) persentase = 100;

        const panjangBar = 10;
        const jumlahKotakIsi = Math.round((persentase / 100) * panjangBar);
        const jumlahKotakKosong = panjangBar - jumlahKotakIsi;
        const progressBar = '🟦'.repeat(jumlahKotakIsi) + '⬛'.repeat(jumlahKotakKosong);

        // Template pesan ringkas dengan detail waktu yang presisi
        return `🔥 *A7X NATION BLITAR RAYA* 🔥
🤘 *ROAD TO CONCERT 2026* 🤘
━━━━━━━━━━━━━━━━━━━━━

⏳ *Sisa Waktu:* *${daysLeft} Hari, ${hoursLeft} Jam, ${minutesLeft} Menit Lagi!*

⏰ *Kick Off:* 19:00 (7 Malam) WIB

📊 *Progress:*
${progressBar} [ *${persentase}%* ]

━━━━━━━━━━━━━━━━━━━━━
_Keep solid, jaga fisik & utamakan sikap saling menghargai sesama A7X Nation!_

*#FoREVer* 🦅 *Salam Persaudaraan* 🖤`;

    } else if (timeDiff <= 0 && timeDiff > -(1000 * 3600 * 5)) {
        // Jika sedang hari H dan konser masih berlangsung (dalam radius 5 jam dari jam 7 malam)
        return `🎉 *IT'S SHOWTIME! SEIZE THE DAY!* 🎉
━━━━━━━━━━━━━━━━━━━━━
🤘 *HARI INI ADALAH SEJARAH!* 🤘

Malam ini jam 19:00 WIB, konser *AVENGED SEVENFOLD* resmi dimulai!

🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦 [ *100% DONE* ]

Rapatkan barisan, nikmati pertunjukan, dan pecahkan venue malam ini, kawan-kawan! 🔥🦇💥`;
    } else {
        return null; // Konser sudah selesai lewat hari
    }
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

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
                const targetId = '120363406965958235@g.us';

                console.log('Mengirim pesan countdown presisi hari, jam, menit...');
                await sock.sendMessage(targetId, { text: teksPesan });
                console.log('✅ Pesan sukses terkirim!');
            } else {
                console.log('Target waktu sudah lewat, tidak ada pesan dikirim.');
            }

            setTimeout(() => {
                console.log('Menutup bot secara aman...');
                process.exit(0);
            }, 5000);
        }
    });
}

startBot().catch(err => console.error("Gagal menjalankan bot:", err));
