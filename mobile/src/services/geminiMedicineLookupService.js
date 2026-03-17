import { GoogleGenerativeAI } from '@google/generative-ai';

const FORM_OPTIONS = [
    'Viên nén', 'Viên nang', 'Viên nang mềm', 'Viên sủi',
    'Siro', 'Bột', 'Ống tiêm', 'Thuốc mỡ', 'Thuốc nhỏ mắt', 'Khác',
];

const GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];

const MEDICINE_RESPONSE_SCHEMA = {
    type: 'OBJECT',
    properties: {
        name: { type: 'STRING' },
        dosage: { type: 'STRING' },
        form: { type: 'STRING' },
        note: { type: 'STRING' },
    },
    required: ['name', 'dosage', 'form', 'note'],
};

const getGeminiClient = () => {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();

    if (!apiKey) {
        throw new Error('Gemini API key chưa được cấu hình (EXPO_PUBLIC_GEMINI_API_KEY)');
    }

    return new GoogleGenerativeAI(apiKey);
};

const parseGeminiJson = (text) => {
    const trimmed = String(text || '').trim();

    if (!trimmed) {
        throw new Error('Gemini không trả về dữ liệu');
    }

    try {
        return JSON.parse(trimmed);
    } catch {
        const start = trimmed.indexOf('{');
        const end = trimmed.lastIndexOf('}');

        if (start === -1 || end === -1 || end < start) {
            throw new Error('Gemini không trả về JSON hợp lệ');
        }

        return JSON.parse(trimmed.slice(start, end + 1));
    }
};

const normalizeMedicineResult = (result = {}) => ({
    name: typeof result.name === 'string' ? result.name.trim() : '',
    dosage: typeof result.dosage === 'string' ? result.dosage.trim() : '',
    form: typeof result.form === 'string' ? result.form.trim() : '',
    note: typeof result.note === 'string' ? result.note.trim() : '',
});

const normalizeForm = (form) => {
    if (!form) {
        return '';
    }

    const normalized = form.trim().toLowerCase();
    const matched = FORM_OPTIONS.find((option) => option.toLowerCase() === normalized);

    return matched || '';
};

const buildBarcodePrompt = (barcode) =>
    `Bạn là chuyên gia dược phẩm Việt Nam. Mã vạch thuốc: "${barcode}".
Tra cứu và trả về thông tin thuốc phù hợp (ưu tiên thuốc Việt Nam và thuốc nhập khẩu phổ biến tại VN).
Trả về JSON với các trường:
- name: tên thương mại hoặc generic (chuỗi rỗng nếu không xác định được)
- dosage: hàm lượng hoạt chất, ví dụ "500mg", "10mg/5ml" (chuỗi rỗng nếu không biết)
- form: dạng thuốc, chỉ dùng một trong: ${FORM_OPTIONS.join(', ')} (chuỗi rỗng nếu không biết)
- note: nhà sản xuất hoặc thông tin tóm tắt ngắn gọn (chuỗi rỗng nếu không biết)
Nếu không nhận ra mã vạch, trả về tất cả là chuỗi rỗng. Chỉ trả về duy nhất một JSON object hợp lệ, không markdown, không giải thích.`;

const buildNamePrompt = (name) =>
    `Bạn là chuyên gia dược phẩm Việt Nam. Thuốc tên: "${name}".
Điền thông tin còn thiếu dựa trên kiến thức dược phẩm phổ biến tại Việt Nam.
Trả về JSON với các trường:
- name: tên đầy đủ và chính xác nhất
- dosage: hàm lượng hoạt chất phổ biến nhất, ví dụ "500mg", "10mg/5ml" (chuỗi rỗng nếu không biết)
- form: dạng thuốc, chỉ dùng một trong: ${FORM_OPTIONS.join(', ')} (chuỗi rỗng nếu không biết)
- note: nhà sản xuất chính hoặc công dụng chính, tóm tắt ngắn gọn (tối đa 80 ký tự, chuỗi rỗng nếu không biết)
Chỉ trả về duy nhất một JSON object hợp lệ, không markdown, không giải thích.`;

const callGemini = async (prompt) => {
    const client = getGeminiClient();
    let lastError = null;

    for (const modelName of GEMINI_MODELS) {
        try {
            const model = client.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: MEDICINE_RESPONSE_SCHEMA,
                    temperature: 0.1,
                    maxOutputTokens: 200,
                },
            });

            const result = await model.generateContent(prompt);
            const raw = result?.response?.text?.()?.trim();

            if (!raw) {
                throw new Error(`Model ${modelName} không trả về dữ liệu`);
            }

            const parsed = normalizeMedicineResult(parseGeminiJson(raw));

            return {
                ...parsed,
                form: normalizeForm(parsed.form),
            };
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error('Không thể gọi Gemini');
};

export const lookupMedicineByBarcodeGemini = async (barcode) => {
    const result = await callGemini(buildBarcodePrompt(barcode));

    if (!result?.name) {
        return { matched: false, barcode };
    }

    return {
        matched: true,
        barcode,
        source: 'gemini',
        medicine: {
            barcode,
            name: result.name || '',
            dosage: result.dosage || null,
            form: result.form || null,
            note: result.note || null,
        },
    };
};

export const suggestMedicineByName = async (name) => {
    const result = await callGemini(buildNamePrompt(name));

    return {
        name: result.name || name,
        dosage: result.dosage || null,
        form: result.form || null,
        note: result.note || null,
    };
};
