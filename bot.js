const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const puppeteer = require('puppeteer');
const path = require('path');
const { imageSize } = require('image-size');
const axios = require('axios');
const express = require('express');
const app = express();

require('dotenv').config();

// Telegram botni ishga tushirish
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const sessions = new Map();

async () => await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

// Til sozlamalari
const languages = {
    uz: {
        welcome: "🤖 Assalomu alaykum!\n\n🌟 <b>Patent to'lov cheki yaratuvchi bot</b>ga xush kelibsiz!\n\n📋 Avval eski patent chekingizni PDF formatida yuboring.\n⚠️ <i>Fayl nomi \"Документ-\" bilan boshlanishi shart</i>",
        selectLanguage: "🌐 <b>Tilni tanlang / Выберите язык:</b>",
        langSelected: "✅ <b>O'zbek tili tanlandi!</b>\n\n📄 Endi eski patent chekingizni PDF formatida yuboring.",
        invalidFile: "❌ <b>Xatolik!</b>\n\n📛 Siz yuborgan fayl patent to'lov cheki emas!\n\n💡 <i>Fayl nomi \"Документ-\" bilan boshlanishi kerak</i>",
        fileAccepted: "✅ <b>Patent chek muvaffaqiyatli qabul qilindi!</b>\n\n📅 <b>Qaysi oy uchun to'lov qilmoqchisiz?</b>\n\n📝 <i>Formatda kiriting:</i>\n<code>11 июля 2025 16:17:50 мск</code>",
        enterName: "👤 <b>To'liq ismingizni kiriting:</b>\n\n📝 <i>Familiya Ism Otchestvo formatida</i>\n\n🔹 Masalan: <code>Иванов Иван Иванович</code>",
        enterAmount: "💰 <b>To'lov summasini kiriting:</b>\n\n📝 <i>Har qanday formatda yozing:</i>\n🔹 <code>8900</code>\n🔹 <code>8 900</code>\n🔹 <code>8 900,00</code>\n🔹 <code>8 900,00 ₽</code>\n🔹 <code>17000</code> yoki <code>17 000</code>\n\n🤖 <i>Bot avtomatik tozalab oladi!</i>",
        processing: "⏳ <b>PDF hujjat tayyorlanmoqda...</b>\n\n🔄 <i>Iltimos, biroz kuting</i>",
        success: "🎉 <b>Muvaffaqiyat!</b>\n\n✅ PDF chek tayyor bo'ldi va sizga yuborildi!\n\n⚠️ <b>MUHIM ESLATMA:</b>\n🚨 <i>Sizga berilgan chekni Rossiya politsiyasi qo'liga topshirmang!</i>\n🛡️ <i>Bot javobgarlikni o'z bo'yniga olmaydi</i>\n\n🔧 <b>Hozirgi kunda:</b>\n👨‍💻 Dasturchilar bot ustida faol ishlashmoqda\n✨ Bot original cheklar chiqarib beradi\n📱 Bizdan uzoqlashmang va botimizni musofir do'stlaringizga ulashing!\n\n🔄 <b>Yangi chek uchun /start bosing</b>",
        error: "❌ <b>Xatolik yuz berdi!</b>\n\n🔄 Iltimos, qayta urinib ko'ring yoki /start bosib qaytadan boshlang",
        restart: "\n\n🔄 <b>Qaytadan boshlash uchun /start ni bosing</b>"
    },
    ru: {
        welcome: "🤖 Добро пожаловать!\n\n🌟 <b>Бот для создания чеков патентных платежей</b>\n\n📋 Сначала отправьте старый чек патента в формате PDF.\n⚠️ <i>Имя файла должно начинаться с \"Документ-\"</i>",
        selectLanguage: "🌐 <b>Выберите язык / Tilni tanlang:</b>",
        langSelected: "✅ <b>Русский язык выбран!</b>\n\n📄 Теперь отправьте старый чек патента в формате PDF.",
        invalidFile: "❌ <b>Ошибка!</b>\n\n📛 Отправленный файл не является чеком патентного платежа!\n\n💡 <i>Имя файла должно начинаться с \"Документ-\"</i>",
        fileAccepted: "✅ <b>Чек патента успешно принят!</b>\n\n📅 <b>За какой месяц хотите совершить платеж?</b>\n\n📝 <i>Введите в формате:</i>\n<code>11 июля 2025 16:17:50 мск</code>",
        enterName: "👤 <b>Введите полное имя:</b>\n\n📝 <i>В формате Фамилия Имя Отчество</i>\n\n🔹 Например: <code>Иванов Иван Иванович</code>",
        enterAmount: "💰 <b>Введите сумму платежа:</b>\n\n📝 <i>Пишите в любом формате:</i>\n🔹 <code>8900</code>\n🔹 <code>8 900</code>\n🔹 <code>8 900,00</code>\n🔹 <code>8 900,00 ₽</code>\n🔹 <code>17000</code> или <code>17 000</code>\n\n🤖 <i>Бот автоматически очистит!</i>",
        processing: "⏳ <b>Подготавливается PDF документ...</b>\n\n🔄 <i>Пожалуйста, подождите</i>",
        success: "🎉 <b>Успешно!</b>\n\n✅ PDF чек готов и отправлен вам!\n\n⚠️ <b>ВАЖНОЕ ПРЕДУПРЕЖДЕНИЕ:</b>\n🚨 <i>Не передавайте полученный чек в руки российской полиции!</i>\n🛡️ <i>Бот не несет ответственности</i>\n\n🔧 <b>В настоящее время:</b>\n👨‍💻 Программисты активно работают над ботом\n✨ Бот выдает оригинальные чеки\n📱 Не отдаляйтесь от нас и поделитесь ботом с друзьями-мигрантами!\n\n🔄 <b>Для нового чека нажмите /start</b>",
        error: "❌ <b>Произошла ошибка!</b>\n\n🔄 Пожалуйста, попробуйте снова или нажмите /start для перезапуска",
        restart: "\n\n🔄 <b>Для перезапуска нажмите /start</b>"
    }
};

// Default rasm (fon) o'lchamlarini olish
const defaultImagePath = path.join(__dirname, 'img', 'Документ.jpg');
const defaultImageBuffer = fs.readFileSync(defaultImagePath);
const base64DefaultImage = `data:image/jpeg;base64,${defaultImageBuffer.toString('base64')}`;

const dimensions = imageSize(defaultImageBuffer);
const imgWidthPx = dimensions.width;
const imgHeightPx = dimensions.height;
const pxToInch = (px) => px / 96;
const pageWidthIn = pxToInch(imgWidthPx);
const pageHeightIn = pxToInch(imgHeightPx);

// PDF fayllar uchun vaqtinchalik papka
const tempDir = path.join(__dirname, 'temp_pdfs');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Inline keyboard yaratish
function createLanguageKeyboard() {
    return {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🇺🇿 O'zbek tili", callback_data: 'lang_uz' },
                    { text: "🇷🇺 Русский язык", callback_data: 'lang_ru' }
                ]
            ]
        },
        parse_mode: 'HTML'
    };
}

// dateText ni tahlil qilib YYYY-MM-DD-HH_MM_SS formatiga o'tkazish
function parseDateText(dateText) {
    const months = {
        'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
        'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
        'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
    };

    // Masalan: "11 июля 2025 16:17:50 мск"
    const regex = /^(\d{1,2})\s+(\S+)\s+(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\s+мск$/;
    const match = dateText.match(regex);

    if (!match) {
        throw new Error('Invalid date format');
    }

    const [, day, monthText, year, hours, minutes, seconds] = match;
    const month = months[monthText.toLowerCase()];
    if (!month) {
        throw new Error('Invalid month name');
    }

    // YYYY-MM-DD-HH_MM_SS formatida qaytarish
    return `${year}-${month}-${day.padStart(2, '0')}-${hours}_${minutes}_${seconds}`;
}

// Summani tozalash va standartlash
function cleanAmount(amount) {
    // Barcha bo'sh joylar, ruble belgilari va vergullarni olib tashlash
    let cleaned = amount.toString()
        .replace(/\s+/g, '')        // Barcha bo'sh joylarni olib tashlash
        .replace(/₽/g, '')          // Ruble belgisini olib tashlash
        .replace(/,/g, '.')         // Vergulni nuqtaga o'zgartirish
        .replace(/[^\d.]/g, '');    // Faqat raqam va nuqtani qoldirish

    // Agar nuqta bo'lsa, faqat rublni olish (kopeyklarni e'tiborsiz qoldirish)
    if (cleaned.includes('.')) {
        cleaned = cleaned.split('.')[0];
    }

    // Faqat raqamlarni qaytarish
    return cleaned.replace(/\D/g, '');
}

// Summani formatlash (17 000 shaklida)
function formatAmount(amount) {
    const cleanedAmount = cleanAmount(amount);
    const formattedRubles = parseInt(cleanedAmount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formattedRubles},00 ₽`;
}

// Summani so'zga aylantirish
function convertNumberToWords(amount) {
    // Avval summani tozalash
    const cleanedAmount = cleanAmount(amount);
    const rubles = cleanedAmount;
    const kopecks = '00'; // Har doim 00 kopek

    // So'z shaklidagi sonlar uchun lug'atlar
    const ones = [
        '', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять',
        'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать',
        'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'
    ];
    const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
    const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
    const thousands = ['', 'тысяча', 'тысячи', 'тысяч'];

    function convertLessThanThousand(number) {
        if (number === 0) return '';
        if (number < 20) return ones[number];
        if (number < 100) {
            const ten = Math.floor(number / 10);
            const rest = number % 10;
            return `${tens[ten]}${rest ? ' ' + ones[rest] : ''}`;
        }
        const hundred = Math.floor(number / 100);
        const rest = number % 100;
        return `${hundreds[hundred]}${rest ? ' ' + convertLessThanThousand(rest) : ''}`.trim();
    }

    function convertRubles(number) {
        if (number === 0) return 'ноль';
        let result = '';
        let num = parseInt(number);

        // Millionlar
        if (num >= 1000000) {
            const millions = Math.floor(num / 1000000);
            result += convertLessThanThousand(millions) + ' миллион';
            if (millions > 1 && millions < 5) result += 'а';
            else if (millions >= 5) result += 'ов';
            num %= 1000000;
            if (num > 0) result += ' ';
        }

        // Mingliklar
        if (num >= 1000) {
            const thousand = Math.floor(num / 1000);
            result += convertLessThanThousand(thousand) + ' ';
            if (thousand === 1) result += thousands[1];
            else if (thousand >= 2 && thousand <= 4) result += thousands[2];
            else result += thousands[3];
            num %= 1000;
            if (num > 0) result += ' ';
        }

        // Yuzliklar va qolganlar
        result += convertLessThanThousand(num);
        return result.trim();
    }

    const rubleText = convertRubles(parseInt(rubles));

    // Rubl so'z shaklini aniqlash
    const lastTwoDigits = parseInt(rubles) % 100;
    const lastDigit = parseInt(rubles) % 10;
    let rubleWord = 'рублей';
    if (lastTwoDigits < 10 || lastTwoDigits > 20) {
        if (lastDigit === 1) rubleWord = 'рубль';
        else if (lastDigit >= 2 && lastDigit <= 4) rubleWord = 'рубля';
    }

    return `${rubleText.charAt(0).toUpperCase() + rubleText.slice(1)} ${rubleWord} ${kopecks} копеек`;
}

// HTML sahifa yaratish funksiyasi
function generateHTML(imageBase64, dateText, fullName, amount, amountWords) {
    const formattedAmount = formatAmount(amount);
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; height: 100vh; overflow: hidden; }
        .container {
            position: relative;
            width: ${imgWidthPx}px;
            height: ${imgHeightPx}px;
            background-image: url('${imageBase64}');
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
        }
        .overlay {
            position: absolute;
            color: black;
            text-align: left;
            line-height: 1.2;
        }
        #date {
            top: 101px;
            left: 42px;
            font-size: 29px;
            padding: 4px 30px 4px 0;
            letter-spacing: 0.2px;
            background: #ffffff;
        }
        #name, #nameTwo {
            font-size: 34px;
            background: #ffffff;
            padding: 3px 0 38px 0;
            letter-spacing: 1px;
            width: 71%;
            left: 42px;
        }
        #name { top: 297px; }
        #nameTwo { top: 35.9%; }
        #amount, #amountTwo {
            font-size: 31px;
            background: #ffffff;
            padding: 4px 0 4px 1px;
            letter-spacing: 1px;
            width: 71%;
            left: 42px;
            font-family: 'Roboto', sans-serif;
            font-weight: 400;
        }
        #amount { bottom: 596px; }
        #amountTwo { bottom: 395px; }
        #amountText {
            bottom: 267px;
            left: 42.3px;
            font-size: 34px;
            background: #ffffff;
            padding: 3px 0 0 0;
            width: 84%;
            letter-spacing: -0.2px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="overlay" id="date">${dateText}</div>
        <div class="overlay" id="name">${fullName.toUpperCase()}</div>
        <div class="overlay" id="nameTwo">${fullName.toUpperCase()}</div>
        <div class="overlay" id="amount">${formattedAmount}</div>
        <div class="overlay" id="amountTwo">${formattedAmount}</div>
        <div class="overlay" id="amountText">${amountWords}</div>
    </div>
</body>
</html>`;
}

// /start komandasi
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    sessions.set(chatId, {});

    const welcomeMessage = languages.uz.selectLanguage;
    bot.sendMessage(chatId, welcomeMessage, createLanguageKeyboard());
});

// Callback query handler (til tanlash)
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (data.startsWith('lang_')) {
        const selectedLang = data.split('_')[1];
        const session = sessions.get(chatId) || {};
        session.language = selectedLang;
        sessions.set(chatId, session);

        const lang = languages[selectedLang];

        // Xabarni o'chirish va yangi xabar yuborish
        bot.deleteMessage(chatId, callbackQuery.message.message_id);
        bot.sendMessage(chatId, lang.langSelected, { parse_mode: 'HTML' });

        // Callback query ni javob berish
        bot.answerCallbackQuery(callbackQuery.id);
    }
});

// Foydalanuvchi rasmli hujjat yuborganda
bot.on('document', async (msg) => {
    const chatId = msg.chat.id;
    const doc = msg.document;
    const session = sessions.get(chatId);

    if (!session || !session.language) {
        return bot.sendMessage(chatId, "🌐 Avval tilni tanlang!\n\n/start ni bosing", { parse_mode: 'HTML' });
    }

    const lang = languages[session.language];

    if (!doc.file_name.startsWith('Документ-')) {
        return bot.sendMessage(chatId, lang.invalidFile + lang.restart, { parse_mode: 'HTML' });
    }

    try {
        // "Fayl yuklanmoqda" xabari
        const processingMsg = await bot.sendMessage(chatId, "📥 <b>Fayl yuklanmoqda...</b>", { parse_mode: 'HTML' });

        const fileUrl = await bot.getFileLink(doc.file_id);
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const filePath = path.join(tempDir, `temp_${chatId}.jpg`);
        fs.writeFileSync(filePath, response.data);

        session.filePath = filePath;
        sessions.set(chatId, session);

        // Yuklash xabarini o'chirish
        bot.deleteMessage(chatId, processingMsg.message_id);

        bot.sendMessage(chatId, lang.fileAccepted, { parse_mode: 'HTML' });
    } catch (error) {
        console.error('Document processing error:', error);
        bot.sendMessage(chatId, lang.error + lang.restart, { parse_mode: 'HTML' });
    }
});

// Matnli xabarlarni qayta ishlash
bot.on('message', async (msg) => {
    // Komanda va callback query'larni o'tkazib yuborish
    if (msg.text && msg.text.startsWith('/')) return;
    if (msg.document) return;

    const chatId = msg.chat.id;
    const session = sessions.get(chatId);

    if (!session || !session.language || !session.filePath) return;

    const lang = languages[session.language];

    try {
        if (!session.month) {
            session.month = msg.text;
            sessions.set(chatId, session);
            return bot.sendMessage(chatId, lang.enterName, { parse_mode: 'HTML' });
        } else if (!session.fullName) {
            session.fullName = msg.text;
            sessions.set(chatId, session);
            return bot.sendMessage(chatId, lang.enterAmount, { parse_mode: 'HTML' });
        } else if (!session.amount) {
            session.amount = msg.text;
            sessions.set(chatId, session);

            // Processing xabari
            const processingMsg = await bot.sendMessage(chatId, lang.processing, { parse_mode: 'HTML' });

            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            const amountWords = convertNumberToWords(session.amount);
            const htmlContent = generateHTML(base64DefaultImage, session.month, session.fullName, session.amount, amountWords);

            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            await page.setViewport({ width: imgWidthPx, height: imgHeightPx });

            // dateText ni tahlil qilib fayl nomini shakllantirish
            const formattedDate = parseDateText(session.month);
            const pdfPath = path.join(tempDir, `Документ-${formattedDate}.pdf`);
            await page.pdf({
                path: pdfPath,
                width: `${pageWidthIn}in`,
                height: `${pageHeightIn}in`,
                printBackground: true,
                margin: { top: 0, right: 0, bottom: 0, left: 0 }
            });

            await browser.close();

            // Processing xabarini o'chirish
            bot.deleteMessage(chatId, processingMsg.message_id);

            // await bot.sendDocument(chatId, pdfPath, {}, { contentType: 'application/pdf' });
            // await bot.sendDocument(chatId, pdfPath);
            const fileStream = fs.createReadStream(pdfPath);
            await bot.sendDocument(chatId, fileStream, {
                filename: path.basename(pdfPath)
            });

            bot.sendMessage(chatId, lang.success, { parse_mode: 'HTML' });

            // Vaqtinchalik fayllarni o'chirish
            fs.unlinkSync(session.filePath);
            fs.unlinkSync(pdfPath);
            sessions.delete(chatId);
        }
    } catch (error) {
        console.error('Message processing error:', error);
        bot.sendMessage(chatId, lang.error + lang.restart, { parse_mode: 'HTML' });
    }
});

// /help komandasi
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpText = `
🤖 <b>Bot haqida ma'lumot:</b>

📋 <b>Vazifasi:</b> Patent to'lov cheklarini yaratish

🔧 <b>Qanday ishlaydi:</b>
1️⃣ Eski patent chekingizni PDF formatida yuboring
2️⃣ To'lov sanasini kiriting 
3️⃣ To'liq ismingizni yozing
4️⃣ To'lov summasini kiriting
5️⃣ Tayyor chekni oling!

🌐 <b>Tillari:</b> O'zbek va Rus tillari

⚡ <b>Boshlash:</b> /start

👨‍💻 <b>Yordam:</b> /help
    `;
    bot.sendMessage(chatId, helpText, { parse_mode: 'HTML' });
});

// Xatoliklarni ushlash
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
    console.error('🚨 Unhandled Rejection:', reason);
});

// Bot ishga tushganini xabar berish
console.log('🚀 Bot muvaffaqiyatli ishga tushdi!');
console.log('🌐 Til qo\'llab-quvvatlash: O\'zbek va Rus');
console.log('📄 PDF cheklar yaratishga tayyor!');
console.log('⏰ Ishga tushgan vaqt:', new Date().toLocaleString());





// Webhook endpoint
app.post('/api/telegram', (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Start server for Vercel
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    bot.setWebHook(
        `${process.env.RENDER_PUBLIC_URL}/bot${process.env.BOT_TOKEN}`
    )
});
module.exports = app;
