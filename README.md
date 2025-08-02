# IELTS Test Platform Backend

Bu IELTS test platformasining backend qismi bo'lib, Node.js, Express va MongoDB texnologiyalari yordamida yaratilgan.

## Xususiyatlari

- **Foydalanuvchi tizimi**: Client, Teacher, Admin rollari
- **Test turlari**: Listening, Reading, Writing, Speaking
- **AI integratsiyasi**: ChatGPT va Whisper
- **Avtomatik baholash**: Listening va Reading testlari
- **Manual baholash**: Writing va Speaking testlari (teacher tomonidan)
- **To'liq test rejimi**: Barcha 4 ta qismni ketma-ket topshirish

## Texnologiyalar

- Node.js & Express.js
- MongoDB & Mongoose
- JWT Authentication
- OpenAI API (ChatGPT & Whisper)
- Multer (fayl yuklash)
- bcryptjs (parol shifrlash)

## O'rnatish

1. Repository ni klonlash:

```bash
git clone <repository-url>
cd ielts-backend
```

2. Dependencies ni o'rnatish:

```bash
npm install
```

3. Environment variables ni sozlash:

```bash
cp .env.example .env
```

`.env` faylini to'ldiring:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ielts_platform
JWT_SECRET=your_jwt_secret_key_here
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
```

4. Serverni ishga tushirish:

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Foydalanuvchi ro'yxatga olish
- `POST /api/auth/login` - Tizimga kirish
- `GET /api/auth/profile` - Profil ma'lumotlari

### Tests

- `GET /api/tests` - Barcha testlar ro'yxati
- `GET /api/tests/:id` - Bitta test ma'lumotlari
- `POST /api/tests/submit/listening-reading` - Listening/Reading testini topshirish
- `POST /api/tests/submit/writing` - Writing testini topshirish
- `POST /api/tests/submit/speaking` - Speaking testini topshirish (audio bilan)
- `POST /api/tests` - Yangi test yaratish (admin/teacher)

### Results

- `GET /api/results` - Foydalanuvchi natijalari
- `GET /api/results/summary` - Ballar xulosasi
- `GET /api/results/:id` - Bitta test natijasi
- `GET /api/results/:id/preview` - Test preview

### Teacher Panel

- `GET /api/teacher/pending` - Baholanishi kerak bo'lgan testlar
- `GET /api/teacher/stats` - Teacher statistikalari
- `GET /api/teacher/result/:resultId` - Baholash uchun natija
- `POST /api/teacher/grade/writing/:resultId` - Writing testini baholash
- `POST /api/teacher/grade/speaking/:resultId` - Speaking testini baholash

## Fayl strukturasi

```
ielts-backend/
├── config/
│   └── database.js
├── models/
│   ├── User.js
│   ├── Test.js
│   ├── TestResult.js
│   └── TestType.js
├── middleware/
│   ├── auth.js
│   └── upload.js
├── routes/
│   ├── auth.routes.js
│   ├── test.routes.js
│   ├── result.routes.js
│   └── teacher.routes.js
├── controllers/
│   ├── authController.js
│   ├── testController.js
│   ├── resultController.js
│   └── teacherController.js
├── utils/
│   ├── chatgpt.js
│   ├── whisper.js
│   └── helpers.js
├── uploads/
├── .env
├── .gitignore
├── package.json
└── server.js
```

## IELTS Baholash Tizimi

### Band Score (0-9)

- **9.0**: Expert user
- **8.0-8.5**: Very good user
- **7.0-7.5**: Good user
- **6.0-6.5**: Competent user
- **5.0-5.5**: Modest user
- **4.0-4.5**: Limited user
- **3.0-3.5**: Extremely limited user
- **1.0-2.5**: Non-user

### Test Turlari

1. **Listening** (30 daqiqa + 10 daqiqa ko'chirish)

   - 40 ta savol
   - Avtomatik baholanadi

2. **Reading** (60 daqiqa)

   - 40 ta savol
   - Avtomatik baholanadi

3. **Writing** (60 daqiqa)

   - Task 1: 150 so'z (20 daqiqa)
   - Task 2: 250 so'z (40 daqiqa)
   - AI yoki teacher tomonidan baholanadi

4. **Speaking** (11-14 daqiqa)
   - 3 ta qism
   - Audio yozib olish
   - Whisper transcription + AI/teacher baholash

## Development

Yangi xususiyat qo'shish:

1. Model yaratish (agar kerak bo'lsa)
2. Controller yaratish
3. Route qo'shish
4. Middleware qo'shish (agar kerak bo'lsa)
5. Test yozish

## Environment Variables

| Variable         | Tavsif                  | Misol                             |
| ---------------- | ----------------------- | --------------------------------- |
| `PORT`           | Server porti            | `5000`                            |
| `MONGODB_URI`    | MongoDB ulanish manzili | `mongodb://localhost:27017/ielts` |
| `JWT_SECRET`     | JWT secret key          | `your_secret_key`                 |
| `OPENAI_API_KEY` | OpenAI API key          | `sk-...`                          |
| `NODE_ENV`       | Environment             | `development/production`          |
